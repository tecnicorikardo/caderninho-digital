import { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import { MobileButton } from '../../components/MobileButton';
import { PageHeader } from '../../components/PageHeader';
import EmailReportModal from '../../components/EmailReportModal';
import { ReceiptModal } from '../../components/ReceiptModal';

import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { clientService } from '../../services/clientService';
import { saleService } from '../../services/saleService';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  productId?: string;
  productName?: string;
  price: number;
  quantity: number;
  total: number;
  paymentMethod: string;
  createdAt: Date;
  userId: string;
  isCustomSale?: boolean; // Para vendas só com valor
  dueDate?: Timestamp; // Data de vencimento para fiado
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface StockProduct {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  sku?: string;
}

export function Sales() {

  const { user } = useAuth();
  const { isMobile } = useWindowSize();
  const { guardSale } = useSubscriptionGuard();
  const { incrementUsage } = useSubscription();

  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saleType, setSaleType] = useState<'custom' | 'with-product'>('custom');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    productId: '',
    productName: '',
    price: 0,
    quantity: 1,
    paymentMethod: 'dinheiro',
    dueDate: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('🔍 Carregando vendas para usuário:', user.uid);
      
      // Carregar vendas
      const q = query(collection(db, 'sales'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const salesData: Sale[] = [];
      
      console.log('📊 Documentos encontrados:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Documento encontrado:', doc.id, data);
        salesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Sale);
      });
      
      console.log('✅ Vendas carregadas:', salesData.length);
      console.log('📋 Lista de vendas:', salesData);
      
      setSales(salesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      
      // Carregar clientes
      try {
        const firebaseClients = await clientService.getClients(user.uid);
        setClients(firebaseClients);
      } catch (error) {
        console.log('Erro ao carregar clientes:', error);
        setClients([]);
      }
      
      // Carregar produtos do estoque do Firebase
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('userId', '==', user.uid)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        
        if (!productsSnapshot.empty) {
          const firebaseProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            quantity: doc.data().quantity || 0,
            salePrice: doc.data().salePrice || 0
          })).filter((p: any) => p.quantity > 0); // Apenas produtos com estoque
          
          setStockProducts(firebaseProducts as StockProduct[]);
          console.log('✅ Produtos do estoque carregados do Firebase:', firebaseProducts.length);
        } else {
          // Fallback para localStorage
          const savedProducts = localStorage.getItem(`products_${user.uid}`);
          if (savedProducts) {
            const parsedProducts = JSON.parse(savedProducts);
            setStockProducts(parsedProducts.filter((p: any) => p.quantity > 0));
            console.log('📦 Produtos carregados do cache local');
          }
        }
      } catch (productsError) {
        console.warn('⚠️ Erro ao carregar produtos do Firebase, usando cache:', productsError);
        // Fallback para localStorage
        const savedProducts = localStorage.getItem(`products_${user.uid}`);
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          setStockProducts(parsedProducts.filter((p: any) => p.quantity > 0));
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }

    // Verificar limites de assinatura antes de criar a venda
    if (!guardSale()) {
      return;
    }



    const price = Number(formData.price) || 0;
    if (price < 0.01) {
      toast.error('O preço deve ser pelo menos R$ 0,01');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('A quantidade deve ser maior que zero');
      return;
    }

    // Validar estoque se for produto do estoque
    if (saleType === 'with-product' && formData.productId) {
      const stockProduct = stockProducts.find(p => p.id === formData.productId);
      if (stockProduct && formData.quantity > stockProduct.quantity) {
        toast.error(`Estoque insuficiente! Disponível: ${stockProduct.quantity}`);
        return;
      }
    }

    try {
      const price = Number(formData.price) || 0;
      const total = price * formData.quantity;
      
      // Calcular status de pagamento
      const paidAmount = formData.paymentMethod === 'fiado' ? 0 : total; // Fiado começa com 0 pago
      const remainingAmount = formData.paymentMethod === 'fiado' ? total : 0; // Fiado tem valor pendente
      const paymentStatus = formData.paymentMethod === 'fiado' ? 'pendente' : 'pago';
      
      // Preparar dados base obrigatórios
      const baseSaleData = {
        price: formData.price,
        quantity: formData.quantity,
        total,
        paymentMethod: formData.paymentMethod,
        paymentStatus,
        paidAmount,
        remainingAmount,
        userId: user.uid,
        isCustomSale: saleType === 'custom',
        createdAt: Timestamp.now(),
        ...(formData.paymentMethod === 'fiado' && formData.dueDate ? { 
          dueDate: Timestamp.fromDate(new Date(formData.dueDate + 'T12:00:00')) 
        } : {})
      };

      // Adicionar campos opcionais apenas se tiverem valor válido
      const optionalFields: any = {};

      if (formData.clientId && formData.clientId.trim()) {
        optionalFields.clientId = formData.clientId.trim();
        const selectedClient = clients.find(c => c.id === formData.clientId);
        if (selectedClient && selectedClient.name) {
          optionalFields.clientName = selectedClient.name;
        }
      } else if (formData.clientName && formData.clientName.trim()) {
        optionalFields.clientName = formData.clientName.trim();
      }

      if (formData.productName && formData.productName.trim()) {
        optionalFields.productName = formData.productName.trim();
      }

      if (formData.productId && formData.productId.trim()) {
        optionalFields.productId = formData.productId.trim();
      }

      // Combinar dados base com campos opcionais e garantir que price seja número
      const saleData = { 
        ...baseSaleData, 
        ...optionalFields,
        price: price, // usar o price já convertido
        total: total  // usar o total já calculado
      };
      
      // Função para remover qualquer campo undefined que possa ter escapado
      const cleanSaleData = Object.fromEntries(
        Object.entries(saleData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      
      console.log('📊 Dados limpos da venda:', cleanSaleData);
      
      await addDoc(collection(db, 'sales'), cleanSaleData);
      
      // Incrementar contador de uso
      await incrementUsage('sale');
      
      // Atualizar estoque se for produto do estoque
      if (saleType === 'with-product' && formData.productId) {
        updateStock();
      }
      
      // Registrar receita no financeiro automaticamente apenas para vendas fiado
      // Vendas à vista serão sincronizadas pela função syncSalesAsRevenue
      if (cleanSaleData.paymentMethod === 'fiado') {
        await registerFinancialTransaction(cleanSaleData);
      }
      
      // Criar objeto da venda para o modal
      const newSale: Sale = {
        id: 'temp-' + Date.now(),
        ...cleanSaleData,
        createdAt: new Date()
      } as Sale;
      
      setLastSale(newSale);
      setShowForm(false);
      setShowSuccessModal(true);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
    }
  };

  const updateStock = async () => {
    if (!user || !formData.productId) return;
    
    try {
      // Buscar produto atual do estoque
      const stockProduct = stockProducts.find(p => p.id === formData.productId);
      if (!stockProduct) {
        console.error('Produto não encontrado no estoque');
        return;
      }
      
      const newQuantity = Math.max(0, stockProduct.quantity - formData.quantity);
      
      // Atualizar no Firebase
      try {
        const { updateDoc, doc, Timestamp } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        
        const productRef = doc(db, 'products', formData.productId);
        await updateDoc(productRef, {
          quantity: newQuantity,
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Estoque atualizado no Firebase:', formData.productName, 'Nova quantidade:', newQuantity);
      } catch (firebaseError) {
        console.error('⚠️ Erro ao atualizar no Firebase, atualizando apenas cache local:', firebaseError);
        
        // Fallback: atualizar apenas localStorage
        const savedProducts = localStorage.getItem(`products_${user.uid}`);
        if (savedProducts) {
          const productsList = JSON.parse(savedProducts);
          const updatedProducts = productsList.map((product: any) => {
            if (product.id === formData.productId) {
              return {
                ...product,
                quantity: newQuantity,
                updatedAt: new Date().toISOString()
              };
            }
            return product;
          });
          localStorage.setItem(`products_${user.uid}`, JSON.stringify(updatedProducts));
        }
      }
      
      // Registrar movimentação no localStorage (por enquanto)
      const savedMovements = localStorage.getItem(`stock_movements_${user.uid}`);
      const movementsList = savedMovements ? JSON.parse(savedMovements) : [];
      movementsList.push({
        id: Date.now().toString(),
        productId: formData.productId,
        type: 'saida',
        quantity: formData.quantity,
        reason: `Venda - ${formData.productName}`,
        date: new Date().toISOString(),
        userId: user.uid
      });
      localStorage.setItem(`stock_movements_${user.uid}`, JSON.stringify(movementsList));
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estoque:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      clientName: '',
      productId: '',
      productName: '',
      price: 0,
      quantity: 1,
      paymentMethod: 'dinheiro',
      dueDate: ''
    });
    setSaleType('custom');
    setShowForm(false);
  };

  const handlePrintReceipt = () => {
    if (!lastSale) return;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Venda</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 20px auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .info {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
          }
          .label {
            font-weight: bold;
          }
          .total {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            text-align: center;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            /* Esconder elementos de navegação se houver */
            #root, .modal-content { display: none; }
          }
        </style>
        <!-- Importar CSS global se necessário para reset -->
      </head>
      </head>
      <body>
        <div class="header">
          <div class="title">📓 CADERNINHO DIGITAL</div>
          <div>RECIBO DE VENDA</div>
        </div>
        
        <div class="info">
          <span class="label">Data:</span>
          <span>${new Date(lastSale.createdAt).toLocaleDateString('pt-BR')} ${new Date(lastSale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        ${lastSale.clientName ? `
        <div class="info">
          <span class="label">Cliente:</span>
          <span>${lastSale.clientName}</span>
        </div>
        ` : ''}
        
        <div class="info">
          <span class="label">Produto:</span>
          <span>${lastSale.productName || 'Venda Livre'}</span>
        </div>
        
        <div class="info">
          <span class="label">Quantidade:</span>
          <span>${lastSale.quantity}</span>
        </div>
        
        <div class="info">
          <span class="label">Preço Unit.:</span>
          <span>R$ ${lastSale.price.toFixed(2)}</span>
        </div>
        
        <div class="info">
          <span class="label">Pagamento:</span>
          <span>${lastSale.paymentMethod === 'dinheiro' ? '💵 Dinheiro' : lastSale.paymentMethod === 'pix' ? '📱 PIX' : lastSale.paymentMethod === 'cartao' ? '💳 Cartão' : '📝 Fiado'}</span>
        </div>
        
        <div class="total">
          TOTAL: R$ ${lastSale.total.toFixed(2)}
        </div>
        
        <div class="footer">
          Obrigado pela preferência!<br>
          Volte sempre! 😊
        </div>
      </body>
      </html>
    `;

    // Abrir modal em vez de window.open
    setReceiptHtml(receiptContent);
    setShowReceiptModal(true);
    handleFinalizeSale(); // Limpa estado da venda e fecha modal de sucesso
    
    toast.success('Recibo gerado com sucesso!');
  };

  const handleShareWhatsApp = () => {
    if (!lastSale) return;

    const message = `*🧾 RECIBO DE VENDA*\n\n` +
      `📓 *Caderninho Digital*\n` +
      `📅 Data: ${new Date(lastSale.createdAt).toLocaleDateString('pt-BR')} às ${new Date(lastSale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      (lastSale.clientName ? `👤 Cliente: ${lastSale.clientName}\n` : '') +
      `📦 Produto: ${lastSale.productName || 'Venda Livre'}\n` +
      `🔢 Quantidade: ${lastSale.quantity}\n` +
      `💵 Preço Unit.: R$ ${lastSale.price.toFixed(2)}\n` +
      `💳 Pagamento: ${lastSale.paymentMethod === 'dinheiro' ? '💵 Dinheiro' : lastSale.paymentMethod === 'pix' ? '📱 PIX' : lastSale.paymentMethod === 'cartao' ? '💳 Cartão' : '📝 Fiado'}\n\n` +
      `*💰 TOTAL: R$ ${lastSale.total.toFixed(2)}*\n\n` +
      `Obrigado pela preferência! 😊`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('Abrindo WhatsApp...');
    handleFinalizeSale();
  };

  const handleFinalizeSale = () => {
    setShowSuccessModal(false);
    setLastSale(null);
    resetForm();
    toast.success('Venda finalizada com sucesso!');
  };

  const handleProductSelect = (productId: string) => {
    const product = stockProducts.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        price: product.salePrice
      }));
    }
  };

  const registerFinancialTransaction = async (saleData: any) => {
    if (!user) return;
    
    try {
      console.log('💰 Registrando transações financeiras da venda...');
      
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactionsList = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      // 1. Registrar RECEITA da venda
      const revenueTransaction = {
        id: `sale_revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'receita',
        category: 'Vendas',
        description: saleData.productName ? 
          `Venda: ${saleData.productName}` : 
          `Venda ${saleData.isCustomSale ? 'Livre' : ''}`,
        amount: saleData.total,
        date: new Date().toISOString(),
        paymentMethod: saleData.paymentMethod === 'dinheiro' ? 'dinheiro' : 
                      saleData.paymentMethod === 'pix' ? 'pix' : 'dinheiro',
        status: 'pago',
        userId: user.uid,
        createdAt: new Date().toISOString(),
        financialType: 'comercial',
        saleId: saleData.id || Date.now().toString(),
        autoGenerated: true,
        saleGenerated: true
      };
      
      transactionsList.push(revenueTransaction);
      
      // 2. Calcular e registrar CUSTO DOS PRODUTOS VENDIDOS (CPV)
      if (saleData.products && saleData.products.length > 0) {
        // Carregar produtos para obter preços de custo
        const savedProducts = localStorage.getItem(`products_${user.uid}`);
        const productsList = savedProducts ? JSON.parse(savedProducts) : [];
        
        let totalCost = 0;
        const costDetails = [];
        
        for (const saleProduct of saleData.products) {
          const product = productsList.find((p: any) => p.id === saleProduct.id);
          if (product && product.costPrice > 0) {
            const productCost = product.costPrice * saleProduct.quantity;
            totalCost += productCost;
            costDetails.push(`${product.name} (${saleProduct.quantity}x R$${product.costPrice.toFixed(2)})`);
          }
        }
        
        // Registrar CPV como despesa se houver custo
        if (totalCost > 0) {
          const costTransaction = {
            id: `sale_cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'despesa',
            category: 'Material',
            description: `CPV - ${costDetails.join(', ')}`,
            amount: totalCost,
            date: new Date().toISOString(),
            paymentMethod: 'dinheiro',
            status: 'pago',
            userId: user.uid,
            createdAt: new Date().toISOString(),
            financialType: 'comercial',
            saleId: saleData.id || Date.now().toString(),
            autoGenerated: true,
            costOfGoodsSold: true
          };
          
          transactionsList.push(costTransaction);
          
          const profit = saleData.total - totalCost;
          console.log(`💡 Lucro real da venda: R$ ${profit.toFixed(2)} (Receita: R$ ${saleData.total.toFixed(2)} - CPV: R$ ${totalCost.toFixed(2)})`);
        }
      }
      
      // Salvar todas as transações
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsList));
      
      console.log('✅ Transações financeiras registradas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao registrar transações financeiras:', error);
      // Não mostrar erro para o usuário, pois a venda foi criada com sucesso
    }
  };

  // Preparar dados para envio de email
  const prepareEmailReport = () => {
    console.log('📧 Preparando relatório de email...');
    console.log('📊 Total de vendas no array:', sales.length);
    console.log('📊 Primeiras 3 vendas:', sales.slice(0, 3));
    
    // Calcular totais gerais
    const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;

    console.log('💰 Total calculado:', totalSales);
    console.log('🔢 Quantidade:', salesCount);
    console.log('📈 Ticket médio:', averageTicket);

    // Filtrar vendas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const salesToday = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const totalSalesToday = salesToday.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const salesCountToday = salesToday.length;

    console.log('📅 Vendas de hoje:', salesCountToday);
    console.log('💰 Total de hoje:', totalSalesToday);

    const reportData = {
      period: new Date().toLocaleDateString('pt-BR'),
      totalSales: totalSales,
      salesCount: salesCount,
      averageTicket: averageTicket,
      // Dados de hoje
      totalSalesToday: totalSalesToday,
      salesCountToday: salesCountToday,
      salesToday: salesToday.map(sale => ({
        date: sale.createdAt || new Date(),
        clientName: sale.clientName || 'Venda Direta',
        productName: sale.productName || 'Venda Livre',
        quantity: sale.quantity || 1,
        total: sale.total || 0,
        paymentMethod: sale.paymentMethod || 'dinheiro',
      })),
      // Todas as vendas
      sales: sales.map(sale => ({
        date: sale.createdAt || new Date(),
        clientName: sale.clientName || 'Venda Direta',
        productName: sale.productName || 'Venda Livre',
        quantity: sale.quantity || 1,
        total: sale.total || 0,
        paymentMethod: sale.paymentMethod || 'dinheiro',
      })),
    };

    console.log('📧 Dados do relatório:', reportData);
    return reportData;
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }

    // Confirmar exclusão
    const confirmed = window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      // ✅ Usar função completa do serviço que reverte estoque e remove transações
      await saleService.deleteSaleComplete(saleId, user.uid);
      
      toast.success('Venda excluída com sucesso!');
      await loadData(); // Recarregar dados
    } catch (error: any) {
      console.error('Erro ao excluir venda:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px'
      }}>
        <div style={{ fontSize: '1.2rem' }}>Carregando vendas...</div>
      </div>
    );
  }

  return (
    <SubscriptionGuard feature="o módulo de vendas">
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <PageHeader
        title="Vendas"
        icon="💰"
        subtitle={`${sales.length} vendas registradas`}
        actions={
          <>
            <MobileButton
              onClick={() => {
                console.log('🔄 Botão recarregar clicado');
                loadData();
              }}
              variant="secondary"
              icon="🔄"
              size="sm"
            >
              Recarregar
            </MobileButton>
            
            <MobileButton
              onClick={() => setShowForm(true)}
              variant="success"
              icon="➕"
            >
              Nova Venda
            </MobileButton>

            <MobileButton
              onClick={() => setShowEmailModal(true)}
              disabled={sales.length === 0}
              variant="primary"
              icon="📧"
            >
              Enviar Relatório
            </MobileButton>
          </>
        }
      />

      {/* Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {/* Vendas de Hoje */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const salesToday = sales.filter(sale => {
                const saleDate = new Date(sale.createdAt);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
              });
              
              return salesToday.length;
            })()}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Vendas de Hoje</div>
        </div>

        {/* Faturamento de Hoje */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #10b981'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const salesToday = sales.filter(sale => {
                const saleDate = new Date(sale.createdAt);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
              });
              
              const totalToday = salesToday.reduce((sum, sale) => sum + (sale.total || 0), 0);
              return `R$ ${totalToday.toFixed(2)}`;
            })()}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Faturamento Hoje</div>
        </div>
        
        {/* Total de Vendas */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6b7280' }}>
            {sales.length}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Total de Vendas</div>
        </div>
        
        {/* Faturamento Total */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💵</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6b7280' }}>
            {(() => {
              const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
              return `R$ ${total.toFixed(2)}`;
            })()}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Faturamento Total</div>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0' }}>Vendas Recentes</h3>
        
        {sales.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: '#666'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛍️</div>
            <h3>Nenhuma venda registrada</h3>
            <p>Clique em "Nova Venda" para começar</p>
          </div>
        ) : (
          <div className="scroll-container" style={{ 
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingBottom: '0.5rem'
          }}>
            <div style={{ 
              display: 'grid', 
              gap: '1rem',
              minWidth: '500px'
            }}>
              {sales.map(sale => (
                <div key={sale.id} style={{
                  padding: '1.5rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '12px',
                  backgroundColor: '#f8f9fa',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, color: '#333' }}>
                        {sale.isCustomSale ? '💰' : '📦'} {sale.productName || 'Venda Livre'}
                      </h4>
                      {sale.isCustomSale && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          LIVRE
                        </span>
                      )}
                    </div>
                    
                    {sale.clientName && (
                      <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        👤 Cliente: {sale.clientName}
                      </div>
                    )}
                    
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      Quantidade: {sale.quantity} • Preço unit: R$ {sale.price.toFixed(2)}
                    </div>
                    
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>
                      📅 {sale.createdAt.toLocaleDateString('pt-BR')} às {sale.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                      R$ {sale.total.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      {sale.paymentMethod === 'dinheiro' ? '💵' : sale.paymentMethod === 'pix' ? '📱' : '📝'} {sale.paymentMethod}
                    </div>
                    <MobileButton
                      onClick={() => handleDeleteSale(sale.id)}
                      variant="danger"
                      icon="🗑️"
                      size="sm"
                    >
                      Excluir
                    </MobileButton>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Nova Venda */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '2rem'
        }}>
          <div 
            className="modal-content"
            style={{
              backgroundColor: 'white',
              padding: isMobile ? '1.5rem' : '2rem',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              margin: 'auto'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#333' }}>💰 Nova Venda</h2>
              <MobileButton
                onClick={() => setShowForm(false)}
                variant="secondary"
                size="sm"
                style={{
                  minWidth: '40px',
                  padding: '0.5rem',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </MobileButton>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tipo de Venda */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Tipo de Venda
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSaleType('custom')}
                    style={{
                      padding: '0.75rem',
                      border: `2px solid ${saleType === 'custom' ? '#28a745' : '#e1e5e9'}`,
                      borderRadius: '8px',
                      backgroundColor: saleType === 'custom' ? '#28a745' : 'white',
                      color: saleType === 'custom' ? 'white' : '#333',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    💰 Venda Livre
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType('with-product')}
                    style={{
                      padding: '0.75rem',
                      border: `2px solid ${saleType === 'with-product' ? '#007bff' : '#e1e5e9'}`,
                      borderRadius: '8px',
                      backgroundColor: saleType === 'with-product' ? '#007bff' : 'white',
                      color: saleType === 'with-product' ? 'white' : '#333',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    📦 Do Estoque
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  {saleType === 'custom' ? 'Venda com valor livre (não afeta estoque)' : 'Venda de produto cadastrado (atualiza estoque)'}
                </div>
              </div>

              {/* Cliente */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  👤 Cliente (Opcional)
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    clientId: e.target.value,
                    clientName: ''
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <option value="">Selecionar cliente cadastrado</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
                
                {!formData.clientId && (
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Ou digite o nome do cliente"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                )}
              </div>

              {/* Produto */}
              {saleType === 'with-product' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    📦 Produto do Estoque *
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Selecionar produto do estoque</option>
                    {stockProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - R$ {product.salePrice.toFixed(2)} ({product.quantity} disponível)
                      </option>
                    ))}
                  </select>
                  {stockProducts.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '0.25rem' }}>
                      Nenhum produto em estoque. Cadastre produtos na seção Estoque.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    🛍️ Descrição da Venda (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Ex: Serviço, produto avulso, etc."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setFormData(prev => ({ ...prev, price: value }));
                    }}
                    onBlur={(e) => {
                      // Validação só ao sair do campo
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue) || numValue < 0.01) {
                        setFormData(prev => ({ ...prev, price: 0.01 }));
                      } else if (numValue > 9999) {
                        setFormData(prev => ({ ...prev, price: 9999 }));
                      }
                    }}
                    placeholder="Digite o preço"
                    step="0.01"
                    required
                    disabled={saleType === 'with-product' && formData.productId !== ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: (saleType === 'with-product' && formData.productId !== '') ? '#f8f9fa' : 'white'
                    }}
                  />
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: saleType === 'with-product' && formData.productId !== '' ? '#28a745' : '#666', 
                    marginTop: '0.25rem' 
                  }}>
                    {saleType === 'with-product' && formData.productId !== '' 
                      ? '✅ Preço preenchido automaticamente do estoque' 
                      : '💡 Valores permitidos: R$ 0,01 até R$ 9.999,00'}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity === 0 ? '' : formData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, quantity: 0 }));
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          setFormData(prev => ({ ...prev, quantity: numValue }));
                        }
                      }
                    }}
                    min="1"
                    required
                    placeholder="Digite a quantidade"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Forma de Pagamento
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="pix">📱 PIX</option>
                  <option value="fiado">📝 Fiado</option>
                </select>
              </div>

              {formData.paymentMethod === 'fiado' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#d97706' }}>
                    📅 Data para Pagamento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #fcd34d',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: '#fffbeb'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.25rem' }}>
                    A IA irá te avisar no dia deste vencimento.
                  </div>
                </div>
              )}

              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'center',
                border: '2px solid #28a745'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                  Total da Venda
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28a745' }}>
                  R$ {((Number(formData.price) || 0) * formData.quantity).toFixed(2)}
                </div>
              </div>

              <div className="btn-group-mobile" style={{ 
                display: 'flex', 
                gap: '1rem',
                marginTop: '1.5rem',
                flexDirection: isMobile ? 'column-reverse' : 'row'
              }}>
                <MobileButton
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="secondary"
                  style={{ flex: isMobile ? 'auto' : 1 }}
                >
                  Cancelar
                </MobileButton>
                <MobileButton
                  type="submit"
                  variant="success"
                  icon="💰"
                  style={{ flex: isMobile ? 'auto' : 2 }}
                >
                  Criar Venda
                </MobileButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Email */}
      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportType="sales"
        reportData={prepareEmailReport()}
        defaultSubject="Relatório de Vendas"
      />

      {/* Modal de Recibo */}
      <ReceiptModal 
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        htmlContent={receiptHtml}
      />

      {/* Modal de Sucesso da Venda */}
      {showSuccessModal && lastSale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: isMobile ? '1rem' : '2rem',
          overflowY: 'auto'
        }}>
          <div 
            className="modal-content"
            style={{
              backgroundColor: 'white',
              padding: isMobile ? '1.5rem' : '2.5rem',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.3s ease-out',
              margin: 'auto'
            }}>
            {/* Ícone de Sucesso */}
            <div style={{
              textAlign: 'center',
              marginBottom: isMobile ? '1rem' : '1.5rem'
            }}>
              <div style={{
                width: isMobile ? '60px' : '80px',
                height: isMobile ? '60px' : '80px',
                margin: isMobile ? '0 auto 0.75rem' : '0 auto 1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '2rem' : '3rem',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
              }}>
                ✅
              </div>
              <h2 style={{ 
                margin: '0 0 0.25rem 0', 
                color: '#10b981',
                fontSize: isMobile ? '1.3rem' : '1.8rem'
              }}>
                Venda Criada!
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#666',
                fontSize: isMobile ? '0.85rem' : '1rem'
              }}>
                Escolha uma opção abaixo
              </p>
            </div>

            {/* Resumo da Venda */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: isMobile ? '1rem' : '1.25rem',
              borderRadius: '12px',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              border: '2px solid #e1e5e9'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #e1e5e9'
              }}>
                <span style={{ color: '#666' }}>Produto:</span>
                <span style={{ fontWeight: 'bold' }}>{lastSale.productName || 'Venda Livre'}</span>
              </div>
              
              {lastSale.clientName && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #e1e5e9'
                }}>
                  <span style={{ color: '#666' }}>Cliente:</span>
                  <span style={{ fontWeight: 'bold' }}>{lastSale.clientName}</span>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #e1e5e9'
              }}>
                <span style={{ color: '#666' }}>Quantidade:</span>
                <span style={{ fontWeight: 'bold' }}>{lastSale.quantity}x</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #e1e5e9'
              }}>
                <span style={{ color: '#666' }}>Pagamento:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {lastSale.paymentMethod === 'dinheiro' ? '💵 Dinheiro' : 
                   lastSale.paymentMethod === 'pix' ? '📱 PIX' : 
                   lastSale.paymentMethod === 'cartao' ? '💳 Cartão' : '📝 Fiado'}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem'
              }}>
                <span style={{ 
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Total:
                </span>
                <span style={{ 
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  R$ {lastSale.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botões de Ação - Cards Grandes */}
            <div style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'
            }}>
              {/* Botão Imprimir */}
              <button
                onClick={handlePrintReceipt}
                style={{
                  padding: isMobile ? '1.5rem' : '1.25rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  minHeight: isMobile ? '100px' : '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                }}
              >
                <div style={{
                  fontSize: isMobile ? '3rem' : '2.5rem',
                  lineHeight: 1
                }}>
                  🖨️
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    marginBottom: isMobile ? '0.25rem' : '0'
                  }}>
                    Imprimir Recibo
                  </div>
                  {isMobile && (
                    <div style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.75rem'
                    }}>
                      Gerar cupom fiscal
                    </div>
                  )}
                </div>
              </button>

              {/* Botão WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                style={{
                  padding: isMobile ? '1.5rem' : '1.25rem',
                  background: 'linear-gradient(135deg, #128C7E 0%, #25d366 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                  minHeight: isMobile ? '100px' : '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)';
                }}
              >
                <div style={{
                  fontSize: isMobile ? '3rem' : '2.5rem',
                  lineHeight: 1
                }}>
                  📱
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    marginBottom: isMobile ? '0.25rem' : '0'
                  }}>
                    Enviar WhatsApp
                  </div>
                  {isMobile && (
                    <div style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.75rem'
                    }}>
                      Compartilhar com cliente
                    </div>
                  )}
                </div>
              </button>

              {/* Botão Finalizar */}
              <button
                onClick={handleFinalizeSale}
                style={{
                  padding: isMobile ? '1.5rem' : '1.25rem',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
                  minHeight: isMobile ? '100px' : '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  gridColumn: isMobile ? 'auto' : 'span 3'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(107, 114, 128, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(107, 114, 128, 0.3)';
                }}
              >
                <div style={{
                  fontSize: isMobile ? '3rem' : '2.5rem',
                  lineHeight: 1
                }}>
                  ✓
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    marginBottom: isMobile ? '0.25rem' : '0'
                  }}>
                    Apenas Finalizar
                  </div>
                  {isMobile && (
                    <div style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.75rem'
                    }}>
                      Concluir sem enviar
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </SubscriptionGuard>
  );
}
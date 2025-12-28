import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { MobileButton } from '../../components/MobileButton';
import { PageHeader } from '../../components/PageHeader';
import EmailReportModal from '../../components/EmailReportModal';

import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  category: string;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface StockMovement {
  id: string;
  productId: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  date: Date;
  userId: string;
}

export function Stock() {

  const { user } = useAuth();

  const { guardProduct } = useSubscriptionGuard();
  const { incrementUsage } = useSubscription();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    costPrice: 0,
    salePrice: 0,
    quantity: 0,
    minQuantity: 5,
    category: '',
    supplier: ''
  });

  const [movementData, setMovementData] = useState({
    type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: 0,
    reason: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    if (!user) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      // Import dynamically to avoid loading if not used
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Dados do Excel:', jsonData);

      let successCount = 0;
      let errorCount = 0;
      
      const { productService } = await import('../../services/productService');

      for (const rawRow of jsonData as any[]) {
        try {
          // Normalizar chaves para minúsculas e sem espaços extras
          const row: any = {};
          Object.keys(rawRow).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            row[cleanKey] = rawRow[key];
          });

          // Mapeamento mais robusto
          const productData = {
            name: row['nome'] || row['name'] || row['produto'] || row['product'] || '',
            description: row['descrição'] || row['descricao'] || row['description'] || '',
            sku: row['sku'] || row['código'] || row['codigo'] || row['code'] || '',
            costPrice: Number(row['custo'] || row['cost'] || row['preço de custo'] || row['preco de custo'] || 0),
            salePrice: Number(row['venda'] || row['sale'] || row['price'] || row['preço de venda'] || row['preco de venda'] || 0),
            quantity: Number(row['quantidade'] || row['qtd'] || row['quantity'] || row['estoque'] || 0),
            minQuantity: Number(row['mínimo'] || row['minimo'] || row['min'] || row['estoque mínimo'] || 5),
            category: row['categoria'] || row['category'] || '',
            supplier: row['fornecedor'] || row['supplier'] || ''
          };

          if (!productData.name) {
             // Tentar pegar pelo índice se não achar nome (caso extremo de planilha sem header)
             // Mas por enquanto apenas ignora e avisa
             console.warn('Produto sem nome ignorado (verifique os cabeçalhos da planilha):', rawRow);
             continue;
          }

          // Criar produto
          await productService.createProduct(productData, user.uid);

          // Registrar despesa se aplicável
          if (productData.quantity > 0 && productData.costPrice > 0) {
             await registerStockExpense({
               productName: productData.name,
               quantity: productData.quantity,
               costPrice: productData.costPrice,
               supplier: productData.supplier
             });
          }

          successCount++;
        } catch (err) {
          console.error('Erro ao importar linha:', rawRow, err);
          errorCount++;
        }
      }

      toast.success(`${successCount} produtos importados com sucesso!`);
      if (errorCount > 0) {
        toast.error(`${errorCount} falhas na importação.`);
      }
      
      loadData();
    } catch (error) {
      console.error('Erro ao processar arquivo Excel:', error);
      toast.error('Erro ao processar arquivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar produtos em tempo real
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Função para registrar despesa automática no financeiro
  const registerStockExpense = async (stockData: {
    productName: string;
    quantity: number;
    costPrice: number;
    supplier: string;
  }) => {
    if (!user) return;

    try {
      console.log('💰 Registrando despesa de estoque no financeiro...');
      
      const totalCost = stockData.quantity * stockData.costPrice;
      
      // Criar transação financeira
      const financialTransaction = {
        id: `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'despesa',
        category: 'Fornecedores',
        description: `Compra de estoque - ${stockData.productName} (${stockData.quantity}x)`,
        amount: totalCost,
        date: new Date().toISOString(),
        paymentMethod: 'dinheiro',
        status: 'pago',
        userId: user.uid,
        createdAt: new Date().toISOString(),
        financialType: 'comercial',
        autoGenerated: true,
        stockGenerated: true,
        productName: stockData.productName,
        supplier: stockData.supplier
      };

      // Salvar no localStorage (financeiro usa localStorage)
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactionsList = savedTransactions ? JSON.parse(savedTransactions) : [];
      transactionsList.push(financialTransaction);
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsList));
      
      console.log('✅ Despesa de estoque registrada no financeiro:', financialTransaction.description);
      
      toast.success(`Despesa de R$ ${totalCost.toFixed(2)} registrada no financeiro!`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar despesa de estoque:', error);
      // Não mostrar erro para o usuário, pois o produto foi criado com sucesso
    }
  };

  // Função para registrar despesa de movimentação de estoque
  const registerStockMovementExpense = async (stockData: {
    productName: string;
    quantity: number;
    costPrice: number;
    supplier: string;
    reason: string;
  }) => {
    if (!user) return;

    try {
      console.log('📦 Registrando despesa de movimentação no financeiro...');
      
      const totalCost = stockData.quantity * stockData.costPrice;
      
      // Criar transação financeira
      const financialTransaction = {
        id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'despesa',
        category: 'Fornecedores',
        description: `Entrada de estoque - ${stockData.productName} (${stockData.quantity}x) - ${stockData.reason}`,
        amount: totalCost,
        date: new Date().toISOString(),
        paymentMethod: 'dinheiro',
        status: 'pago',
        userId: user.uid,
        createdAt: new Date().toISOString(),
        financialType: 'comercial',
        autoGenerated: true,
        stockMovementGenerated: true,
        productName: stockData.productName,
        supplier: stockData.supplier
      };

      // Salvar no localStorage (financeiro usa localStorage)
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactionsList = savedTransactions ? JSON.parse(savedTransactions) : [];
      transactionsList.push(financialTransaction);
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsList));
      
      console.log('✅ Despesa de movimentação registrada:', financialTransaction.description);
      
    } catch (error) {
      console.error('❌ Erro ao registrar despesa de movimentação:', error);
    }
  };

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Tentar carregar do Firebase primeiro
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        
        const productsQuery = query(
          collection(db, 'products'),
          where('userId', '==', user.uid)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        
        if (!productsSnapshot.empty) {
          const firebaseProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          })) as Product[];
          
          setProducts(firebaseProducts);
          
          // Atualizar cache local
          localStorage.setItem(`products_${user.uid}`, JSON.stringify(firebaseProducts));
          
          console.log('✅ Produtos carregados do Firebase:', firebaseProducts.length);
        } else {
          // Se não tem no Firebase, tentar localStorage
          const savedProducts = localStorage.getItem(`products_${user.uid}`);
          if (savedProducts) {
            const parsedProducts = JSON.parse(savedProducts).map((product: any) => ({
              ...product,
              createdAt: new Date(product.createdAt),
              updatedAt: new Date(product.updatedAt)
            }));
            setProducts(parsedProducts);
            console.log('📦 Produtos carregados do cache local:', parsedProducts.length);
          }
        }
      } catch (firebaseError) {
        console.warn('⚠️ Erro ao carregar do Firebase, usando cache local:', firebaseError);
        
        // Fallback para localStorage
        const savedProducts = localStorage.getItem(`products_${user.uid}`);
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts).map((product: any) => ({
            ...product,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt)
          }));
          setProducts(parsedProducts);
        }
      }
      
      // Carregar movimentações do localStorage (por enquanto)
      const savedMovements = localStorage.getItem(`stock_movements_${user.uid}`);
      if (savedMovements) {
        const parsedMovements = JSON.parse(savedMovements).map((movement: any) => ({
          ...movement,
          date: new Date(movement.date)
        }));
        setMovements(parsedMovements);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      costPrice: 0,
      salePrice: 0,
      quantity: 0,
      minQuantity: 5,
      category: '',
      supplier: ''
    });
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      sku: product.sku,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      category: product.category,
      supplier: product.supplier
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Verificar limites de assinatura antes de criar produto (apenas para novos produtos)
    if (!editingProduct && !guardProduct()) {
      return;
    }



    // Validações
    if (!formData.name) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    
    const salePrice = Number(formData.salePrice) || 0;
    if (salePrice < 0.01) {
      toast.error('Preço de venda deve ser pelo menos R$ 0,01');
      return;
    }

    try {
      // Garantir que os valores sejam números
      const productData = {
        ...formData,
        costPrice: Number(formData.costPrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        quantity: Number(formData.quantity) || 0,
        minQuantity: Number(formData.minQuantity) || 0,
        userId: user.uid
      };

      // Salvar no Firebase
      // Usar o serviço de produtos
      const { productService } = await import('../../services/productService');
      
      if (editingProduct) {
        // Atualizar produto existente
        await productService.updateProduct(editingProduct.id, productData, user.uid);
        
        // Se aumentou a quantidade, registrar despesa adicional
        const quantityDifference = productData.quantity - editingProduct.quantity;
        if (quantityDifference > 0 && productData.costPrice > 0) {
          await registerStockExpense({
            productName: productData.name,
            quantity: quantityDifference,
            costPrice: productData.costPrice,
            supplier: productData.supplier
          });
        }
        
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await productService.createProduct(productData, user.uid);
        
        // Incrementar contador de uso apenas para novos produtos
        await incrementUsage('product');
        
        // Registrar despesa no financeiro para produtos com custo e quantidade
        if (productData.quantity > 0 && productData.costPrice > 0) {
          await registerStockExpense({
            productName: productData.name,
            quantity: productData.quantity,
            costPrice: productData.costPrice,
            supplier: productData.supplier
          });
        }
        
        toast.success('Produto criado com sucesso!');
      }
      
      setShowForm(false);
      await loadData(); // Recarregar do Firebase
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error('Erro:', error);
    }
  };

  // Preparar dados para envio de email
  const prepareEmailReport = () => {
    const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.salePrice), 0);

    return {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      totalValue,
      lowStockProducts: lowStockProducts.map(p => ({
        name: p.name,
        quantity: p.quantity,
        minStock: p.minQuantity,
        salePrice: p.salePrice,
        sku: p.sku,
      })),
    };
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    if (!user) return;

    try {
      // Buscar o produto antes de excluir para pegar o nome
      const productToDelete = products.find(p => p.id === productId);
      const productName = productToDelete?.name || 'Produto';
      
      console.log('🗑️ Excluindo produto:', productName);
      console.log('📋 Dados do produto:', productToDelete);
      console.log('🔑 User ID atual:', user.uid);
      console.log('🔑 User ID do produto:', productToDelete?.userId);
      console.log('✅ IDs coincidem?', productToDelete?.userId === user.uid);
      
      // 1. Deletar do Firebase
      const { deleteDoc, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      
      // Verificar o documento no Firebase antes de excluir
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        console.log('📄 Documento no Firebase:', productDoc.data());
        console.log('🔑 userId no Firebase:', productDoc.data().userId);
        
        // Deletar do Firebase
        await deleteDoc(doc(db, 'products', productId));
        console.log('✅ Produto excluído do Firebase');
      } else {
        console.warn('⚠️ Documento não existe no Firebase, apenas no cache local');
        console.log('🧹 Removendo apenas do cache local...');
        
        // Remover do localStorage
        const cachedProducts = localStorage.getItem(`products_${user.uid}`);
        if (cachedProducts) {
          const productsList = JSON.parse(cachedProducts);
          const filteredProducts = productsList.filter((p: any) => p.id !== productId);
          localStorage.setItem(`products_${user.uid}`, JSON.stringify(filteredProducts));
          console.log('✅ Produto removido do cache local');
        }
      }
      
      // 2. Remover despesas relacionadas ao produto do financeiro
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      if (savedTransactions) {
        const transactionsList = JSON.parse(savedTransactions);
        
        // Filtrar transações que NÃO são do produto excluído
        const filteredTransactions = transactionsList.filter((transaction: any) => {
          // Manter se NÃO for despesa de estoque deste produto
          const isStockExpense = transaction.stockGenerated || transaction.stockMovementGenerated;
          const isThisProduct = transaction.productName === productName || 
                               transaction.description?.includes(productName);
          
          // Remove se for despesa de estoque E for deste produto
          if (isStockExpense && isThisProduct) {
            console.log('🗑️ Removendo despesa:', transaction.description);
            return false;
          }
          
          return true;
        });
        
        const removedCount = transactionsList.length - filteredTransactions.length;
        
        if (removedCount > 0) {
          localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(filteredTransactions));
          console.log(`✅ ${removedCount} despesa(s) removida(s) do financeiro`);
          toast.success(`Produto e ${removedCount} despesa(s) removidos!`);
        } else {
          toast.success('Produto excluído com sucesso!');
        }
      } else {
        toast.success('Produto excluído com sucesso!');
      }
      
      await loadData(); // Recarregar do Firebase
    } catch (error) {
      toast.error('Erro ao excluir produto');
      console.error('Erro:', error);
    }
  };

  const handleStockMovement = (product: Product) => {
    setSelectedProduct(product);
    setMovementData({
      type: 'entrada',
      quantity: 0,
      reason: ''
    });
    setShowMovementModal(true);
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;

    if (movementData.quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    try {
      // Criar movimentação
      const newMovement = {
        id: Date.now().toString(),
        productId: selectedProduct.id,
        type: movementData.type,
        quantity: movementData.quantity,
        reason: movementData.reason,
        date: new Date().toISOString(),
        userId: user.uid
      };

      const savedMovements = localStorage.getItem(`stock_movements_${user.uid}`);
      const movementsList = savedMovements ? JSON.parse(savedMovements) : [];
      movementsList.push(newMovement);
      localStorage.setItem(`stock_movements_${user.uid}`, JSON.stringify(movementsList));

      // Atualizar quantidade do produto no Firebase

      
      let newQuantity = selectedProduct.quantity;
      
      if (movementData.type === 'entrada') {
        newQuantity += movementData.quantity;
        
        // Registrar despesa no financeiro para entrada de produtos
        if (selectedProduct.costPrice > 0) {
          registerStockMovementExpense({
            productName: selectedProduct.name,
            quantity: movementData.quantity,
            costPrice: selectedProduct.costPrice,
            supplier: selectedProduct.supplier,
            reason: movementData.reason
          });
        }
      } else if (movementData.type === 'saida') {
        newQuantity -= movementData.quantity;
      } else { // ajuste
        const quantityDifference = movementData.quantity - selectedProduct.quantity;
        if (quantityDifference > 0 && selectedProduct.costPrice > 0) {
          // Se o ajuste aumentou o estoque, registrar despesa
          registerStockMovementExpense({
            productName: selectedProduct.name,
            quantity: quantityDifference,
            costPrice: selectedProduct.costPrice,
            supplier: selectedProduct.supplier,
            reason: `Ajuste de estoque - ${movementData.reason}`
          });
        }
        newQuantity = movementData.quantity;
      }
      
      // Atualizar no Firebase usando o serviço
      const { productService } = await import('../../services/productService');
      await productService.updateProduct(
        selectedProduct.id, 
        { quantity: Math.max(0, newQuantity) },
        user.uid
      );
      
      toast.success('Movimentação registrada com sucesso!');
      setShowMovementModal(false);
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  const getStockStatus = (product: Product) => {
    const quantity = Number(product.quantity) || 0;
    const minQuantity = Number(product.minQuantity) || 0;
    if (quantity === 0) return { status: 'Sem estoque', color: '#dc3545' };
    if (quantity <= minQuantity) return { status: 'Estoque baixo', color: '#ffc107' };
    return { status: 'Em estoque', color: '#28a745' };
  };

  const getTotalStockValue = () => {
    return products.reduce((total, product) => {
      const quantity = Number(product.quantity) || 0;
      const costPrice = Number(product.costPrice) || 0;
      return total + (quantity * costPrice);
    }, 0);
  };

  const getLowStockProducts = () => {
    return products.filter(product => {
      const quantity = Number(product.quantity) || 0;
      const minQuantity = Number(product.minQuantity) || 0;
      return quantity <= minQuantity;
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div>Carregando estoque...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      
      {/* Header */}
      <PageHeader
        title="Estoque"
        icon="📦"
        subtitle={`${products.length} produtos cadastrados`}
        actions={
          <>
            <div style={{ display: 'none' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
              />
            </div>

            <MobileButton
              onClick={handleCreateProduct}
              variant="success"
              icon="➕"
            >
              Novo Produto
            </MobileButton>

            <MobileButton
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              icon="📤"
            >
              Importar Excel
            </MobileButton>

            <MobileButton
              onClick={() => {
                const element = document.getElementById('excel-guide');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              variant="outline"
              icon="❓"
            >
              Como Importar?
            </MobileButton>

            <MobileButton
              onClick={() => setShowEmailModal(true)}
              disabled={products.length === 0}
              variant="primary"
              icon="📧"
            >
              Enviar Relatório
            </MobileButton>
          </>
        }
      />

      {/* Campo de Busca Inteligente */}
      {activeTab === 'products' && (
        <div style={{
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.2rem'
            }}>
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, descrição, SKU ou categoria..."
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#5856D6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 86, 214, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e1e5e9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#666',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </div>
          )}
        </div>
      )}

      {/* Resumo do Estoque */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>Total de Produtos</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{products.length}</p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Valor do Estoque</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {getTotalStockValue().toFixed(2)}
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>Estoque Baixo</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {getLowStockProducts().length}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e1e5e9' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'products' ? '#007bff' : 'transparent',
              color: activeTab === 'products' ? 'white' : '#007bff',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'movements' ? '#007bff' : 'transparent',
              color: activeTab === 'movements' ? 'white' : '#007bff',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Movimentações
          </button>
        </div>
      </div>

      {/* Formulário de Produto */}
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
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    SKU/Código
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Ex: PRD001"
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setFormData(prev => ({ ...prev, costPrice: value }));
                    }}
                    onBlur={(e) => {
                      // Validação só ao sair do campo
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue) || numValue < 0) {
                        setFormData(prev => ({ ...prev, costPrice: 0 }));
                      } else if (numValue > 9999) {
                        setFormData(prev => ({ ...prev, costPrice: 9999 }));
                      }
                    }}
                    step="0.01"
                    placeholder="Digite o preço de custo"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.salePrice || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setFormData(prev => ({ ...prev, salePrice: value }));
                    }}
                    onBlur={(e) => {
                      // Validação só ao sair do campo
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue) || numValue < 0.01) {
                        setFormData(prev => ({ ...prev, salePrice: 0.01 }));
                      } else if (numValue > 9999) {
                        setFormData(prev => ({ ...prev, salePrice: 9999 }));
                      }
                    }}
                    step="0.01"
                    placeholder="Digite o preço de venda"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    marginTop: '0.25rem' 
                  }}>
                    💡 Valores permitidos: R$ 0,01 até R$ 9.999,00
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Quantidade Inicial
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
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData(prev => ({ ...prev, quantity: numValue }));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        setFormData(prev => ({ ...prev, quantity: 0 }));
                      }
                    }}
                    min="0"
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity === 0 ? '' : formData.minQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, minQuantity: 0 }));
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData(prev => ({ ...prev, minQuantity: numValue }));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        setFormData(prev => ({ ...prev, minQuantity: 5 }));
                      }
                    }}
                    min="0"
                    placeholder="5"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Eletrônicos"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Nome do fornecedor"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Movimentação */}
      {showMovementModal && selectedProduct && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Movimentar Estoque</h3>
            
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px' 
            }}>
              <div><strong>Produto:</strong> {selectedProduct.name}</div>
              <div><strong>Estoque atual:</strong> {selectedProduct.quantity} unidades</div>
            </div>

            <form onSubmit={handleMovementSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Tipo de Movimentação
                </label>
                <select
                  value={movementData.type}
                  onChange={(e) => setMovementData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'entrada' | 'saida' | 'ajuste' 
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="entrada">📦 Entrada (Adicionar)</option>
                  <option value="saida">📤 Saída (Remover)</option>
                  <option value="ajuste">⚖️ Ajuste (Definir quantidade)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Quantidade
                </label>
                <input
                  type="number"
                  value={movementData.quantity === 0 ? '' : movementData.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setMovementData(prev => ({ ...prev, quantity: 0 }));
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue > 0) {
                        setMovementData(prev => ({ ...prev, quantity: numValue }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || parseInt(e.target.value) < 1) {
                      setMovementData(prev => ({ ...prev, quantity: 1 }));
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Motivo
                </label>
                <input
                  type="text"
                  value={movementData.reason}
                  onChange={(e) => setMovementData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex: Compra, Venda, Ajuste de inventário"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo das Abas */}
      {activeTab === 'products' ? (
        // Lista de Produtos
        filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            {searchTerm ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente buscar por outro nome, SKU ou categoria</p>
              </>
            ) : (
              <>
                <h3>Nenhum produto cadastrado</h3>
                <p>Clique em "Novo Produto" para começar</p>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const salePrice = Number(product.salePrice) || 0;
              const costPrice = Number(product.costPrice) || 0;
              const profit = salePrice - costPrice;
              const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100) : 0;
              
              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e1e5e9'
                  }}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto', 
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                        {product.name}
                        {product.sku && <span style={{ color: '#666', fontSize: '0.9rem' }}> ({product.sku})</span>}
                      </h3>
                      {product.description && (
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                          {product.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                        {product.category && <span>📂 {product.category}</span>}
                        {product.supplier && <span>🏪 {product.supplier}</span>}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: 'white',
                        backgroundColor: stockStatus.color,
                        marginBottom: '0.5rem'
                      }}>
                        {stockStatus.status}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {product.quantity} un.
                      </div>
                    </div>
                  </div>

                  {/* Informações Financeiras */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Preço de Custo</div>
                      <div style={{ fontWeight: '500' }}>R$ {(Number(product.costPrice) || 0).toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Preço de Venda</div>
                      <div style={{ fontWeight: '500' }}>R$ {(Number(product.salePrice) || 0).toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Lucro Unitário</div>
                      <div style={{ fontWeight: '500', color: profit >= 0 ? '#28a745' : '#dc3545' }}>
                        R$ {profit.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Margem</div>
                      <div style={{ fontWeight: '500', color: profitMargin >= 0 ? '#28a745' : '#dc3545' }}>
                        {profitMargin.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Valor Total</div>
                      <div style={{ fontWeight: 'bold' }}>
                        R$ {((Number(product.quantity) || 0) * (Number(product.costPrice) || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handleStockMovement(product)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      📦 Movimentar
                    </button>
                    
                    <button
                      onClick={() => handleEditProduct(product)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Lista de Movimentações
        movements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <h3>Nenhuma movimentação registrada</h3>
            <p>As movimentações aparecerão aqui conforme você movimentar o estoque</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {movements
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                const typeIcon = movement.type === 'entrada' ? '📦' : 
                                movement.type === 'saida' ? '📤' : '⚖️';
                const typeColor = movement.type === 'entrada' ? '#28a745' : 
                                 movement.type === 'saida' ? '#dc3545' : '#ffc107';
                
                return (
                  <div
                    key={movement.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e1e5e9'
                    }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr auto', 
                      gap: '1rem',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                          {typeIcon} {product?.name || 'Produto não encontrado'}
                        </h4>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                          {movement.reason}
                        </p>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {movement.date.toLocaleDateString('pt-BR')} às {movement.date.toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: typeColor,
                          marginBottom: '0.5rem'
                        }}>
                          {movement.type.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {movement.type === 'entrada' ? '+' : movement.type === 'saida' ? '-' : '='}{movement.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )
      )}

      {/* Modal de Email */}
      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportType="stock"
        reportData={prepareEmailReport()}
        defaultSubject={`Relatório de Estoque - ${new Date().toLocaleDateString('pt-BR')}`}
      />

      {/* Guia de Importação Excel */}
      <div 
        id="excel-guide"
        style={{
          marginTop: '4rem',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px solid #e9ecef'
        }}
      >
        <h2 style={{ 
          color: '#495057', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 Como Importar Produtos via Excel
        </h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>📝 Estrutura da Planilha</h3>
          <p style={{ marginBottom: '1rem', color: '#495057' }}>
            Crie uma planilha Excel (.xlsx ou .xls) com as seguintes colunas na primeira linha:
          </p>
          
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong style={{ color: '#dc3545' }}>nome*</strong>
                <div style={{ color: '#6c757d' }}>Nome do produto</div>
              </div>
              <div>
                <strong>descrição</strong>
                <div style={{ color: '#6c757d' }}>Descrição detalhada</div>
              </div>
              <div>
                <strong>sku</strong>
                <div style={{ color: '#6c757d' }}>Código do produto</div>
              </div>
              <div>
                <strong>custo</strong>
                <div style={{ color: '#6c757d' }}>Preço de custo (R$)</div>
              </div>
              <div>
                <strong style={{ color: '#dc3545' }}>venda*</strong>
                <div style={{ color: '#6c757d' }}>Preço de venda (R$)</div>
              </div>
              <div>
                <strong>quantidade</strong>
                <div style={{ color: '#6c757d' }}>Estoque inicial</div>
              </div>
              <div>
                <strong>minimo</strong>
                <div style={{ color: '#6c757d' }}>Estoque mínimo</div>
              </div>
              <div>
                <strong>categoria</strong>
                <div style={{ color: '#6c757d' }}>Categoria do produto</div>
              </div>
              <div>
                <strong>fornecedor</strong>
                <div style={{ color: '#6c757d' }}>Nome do fornecedor</div>
              </div>
            </div>
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#fff3cd', 
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#856404'
            }}>
              <strong>* Campos obrigatórios:</strong> nome e venda são obrigatórios
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>📊 Exemplo de Planilha</h3>
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>nome</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>descrição</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>sku</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>custo</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>venda</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>quantidade</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>minimo</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>categoria</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>fornecedor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Smartphone XYZ</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Smartphone 128GB</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>PHONE001</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>800</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>1200</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>10</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>2</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Eletrônicos</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>TechSupplier</td>
                </tr>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Camiseta Básica</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Camiseta 100% algodão</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>SHIRT001</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>15</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>35</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>50</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>10</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Roupas</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>ModaLtda</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>⚠️ Dicas Importantes</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📝 Formatação
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6c757d' }}>
                <li>Use a primeira linha para os cabeçalhos</li>
                <li>Não deixe linhas vazias entre os dados</li>
                <li>Use números decimais com ponto (ex: 15.50)</li>
                <li>Evite caracteres especiais nos nomes</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💰 Financeiro
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6c757d' }}>
                <li>Produtos com custo e quantidade geram despesas automáticas</li>
                <li>As despesas aparecem no módulo Financeiro</li>
                <li>Isso ajuda no controle de gastos com estoque</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔄 Nomes Alternativos
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6c757d', fontSize: '0.85rem' }}>
                <li><strong>nome:</strong> name, produto, product</li>
                <li><strong>custo:</strong> cost, preço de custo</li>
                <li><strong>venda:</strong> sale, price, preço de venda</li>
                <li><strong>quantidade:</strong> qtd, quantity, estoque</li>
                <li><strong>minimo:</strong> min, estoque mínimo</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#d1ecf1',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ color: '#0c5460', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚀 Passo a Passo
          </h4>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#0c5460' }}>
            <li style={{ marginBottom: '0.5rem' }}>Crie uma planilha Excel com as colunas acima</li>
            <li style={{ marginBottom: '0.5rem' }}>Preencha os dados dos seus produtos</li>
            <li style={{ marginBottom: '0.5rem' }}>Salve o arquivo como .xlsx ou .xls</li>
            <li style={{ marginBottom: '0.5rem' }}>Clique no botão "Importar Excel" acima</li>
            <li style={{ marginBottom: '0.5rem' }}>Selecione seu arquivo e aguarde a importação</li>
            <li>Pronto! Seus produtos serão importados automaticamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
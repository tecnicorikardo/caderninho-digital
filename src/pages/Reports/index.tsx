import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';
import EmailReportModal from '../../components/EmailReportModal';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'dinheiro' | 'pix' | 'fiado';
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  paidAmount: number;
  remainingAmount: number;
  isLoan: boolean;
  loanAmount?: number;
  createdAt: Date;
  userId: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
}

interface Product {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
}

interface ReportData {
  // Resumo Geral
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  totalClients: number;
  totalProducts: number;
  averageTicket: number;
  
  // Vendas por período
  salesByMonth: Array<{ month: string; sales: number; revenue: number }>;
  
  // Melhores clientes
  topClients: Array<{
    id: string;
    name: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date;
  }>;
  
  // Produtos mais vendidos
  topProducts: Array<{
    name: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  
  // Status de pagamentos
  paymentStatus: {
    paid: number;
    pending: number;
    partial: number;
  };
  
  // Formas de pagamento
  paymentMethods: {
    dinheiro: number;
    pix: number;
    fiado: number;
  };
  
  // Estoque
  stockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

// Componente de IA simples integrado
function SimpleAI({ rawData }: { rawData: any }) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSimpleInsights();
  }, [rawData]);

  const generateSimpleInsights = async () => {
    setLoading(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newInsights = [];
    
    // Análise básica
    if (rawData.transactions.length > 0) {
      const receitas = rawData.transactions.filter((t: any) => t.type === 'receita').reduce((sum: number, t: any) => sum + t.amount, 0);
      const despesas = rawData.transactions.filter((t: any) => t.type === 'despesa').reduce((sum: number, t: any) => sum + t.amount, 0);
      const saldo = receitas - despesas;
      
      if (saldo > 0) {
        newInsights.push(`✅ Saldo positivo: R$ ${saldo.toFixed(2)} (Receitas: R$ ${receitas.toFixed(2)} - Despesas: R$ ${despesas.toFixed(2)})`);
      } else {
        newInsights.push(`⚠️ Saldo negativo: R$ ${saldo.toFixed(2)} - Revise seus gastos`);
      }
    }
    
    if (rawData.sales.length > 0) {
      const totalVendas = rawData.sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      const ticketMedio = totalVendas / rawData.sales.length;
      newInsights.push(`📊 ${rawData.sales.length} vendas realizadas - Ticket médio: R$ ${ticketMedio.toFixed(2)}`);
    }
    
    if (rawData.clients.length > 0) {
      newInsights.push(`👥 ${rawData.clients.length} clientes cadastrados no sistema`);
    }
    
    if (rawData.products.length > 0) {
      const produtosBaixoEstoque = rawData.products.filter((p: any) => (p.quantity || 0) <= 5).length;
      if (produtosBaixoEstoque > 0) {
        newInsights.push(`⚠️ ${produtosBaixoEstoque} produtos com estoque baixo - Reabastecer urgente`);
      } else {
        newInsights.push(`✅ Estoque sob controle - ${rawData.products.length} produtos disponíveis`);
      }
    }
    
    if (newInsights.length === 0) {
      newInsights.push('📝 Adicione mais dados para gerar insights inteligentes');
    }
    
    setInsights(newInsights);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
        <h3>IA Analisando seus Dados...</h3>
        <p style={{ color: '#666' }}>Processando informações e gerando insights</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🧠</span>
        <h3 style={{ margin: 0 }}>Insights da IA</h3>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {insights.map((insight, index) => (
          <div key={index} style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e1e5e9'
          }}>
            {insight}
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#1976d2' }}>
          🤖 Análise gerada por IA offline • Dados processados localmente
        </p>
      </div>
    </div>
  );
}

export function Reports() {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [rawData, setRawData] = useState({ sales: [], clients: [], products: [], transactions: [] });
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0], // 1 ano atrás
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    generateReport();
  }, [dateFilter]);

  const generateReport = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Carregar dados do Firebase e localStorage
      console.log('🔄 Carregando dados para relatório...');
      
      // Carregar vendas do Firebase
      let sales: Sale[] = [];
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        
        const salesQuery = query(collection(db, 'sales'), where('userId', '==', user.uid));
        const salesSnapshot = await getDocs(salesQuery);
        
        sales = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            // Garantir que products seja um array
            products: data.products || (data.productName ? [{
              id: '1',
              name: data.productName,
              price: data.price || 0,
              quantity: data.quantity || 1
            }] : [])
          } as Sale;
        });
        
        console.log(`✅ ${sales.length} vendas carregadas do Firebase`);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar vendas do Firebase, usando localStorage:', error);
        // Fallback para localStorage
        const savedSales = localStorage.getItem(`sales_${user.uid}`);
        sales = savedSales ? JSON.parse(savedSales).map((sale: any) => ({
          ...sale,
          createdAt: new Date(sale.createdAt),
          products: sale.products || []
        })) : [];
      }

      // Carregar clientes do Firebase
      let clients: Client[] = [];
      try {
        const { clientService } = await import('../../services/clientService');
        clients = await clientService.getClients(user.uid);
        console.log(`✅ ${clients.length} clientes carregados do Firebase`);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar clientes do Firebase, usando localStorage:', error);
        // Fallback para localStorage
        const savedClients = localStorage.getItem(`clients_${user.uid}`);
        clients = savedClients ? JSON.parse(savedClients).map((client: any) => ({
          ...client,
          createdAt: new Date(client.createdAt)
        })) : [];
      }

      // Carregar produtos do localStorage
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      const products: Product[] = savedProducts ? JSON.parse(savedProducts) : [];
      
      // Carregar transações do localStorage
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactions = savedTransactions ? JSON.parse(savedTransactions).map((t: any) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt)
      })) : [];

      // Salvar dados brutos para a IA
      setRawData({ sales: sales as any, clients: clients as any, products: products as any, transactions: transactions as any });

      // Filtrar vendas por data
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Debug: verificar datas
      console.log('Filtro de data:', { startDate, endDate });
      console.log('Total de vendas antes do filtro:', sales.length);
      console.log('Exemplo de venda:', sales[0]);
      
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        const isInRange = saleDate >= startDate && saleDate <= endDate;
        if (!isInRange) {
          console.log('Venda fora do período:', { saleDate, startDate, endDate, sale: sale.id });
        }
        return isInRange;
      });
      
      console.log('Vendas após filtro:', filteredSales.length);
      console.log('Exemplo de venda filtrada:', filteredSales[0]);

      // Calcular dados do relatório
      console.log('📊 Calculando totais...');
      console.log('Total de vendas (todas):', sales.length);
      console.log('Total de vendas (filtradas):', filteredSales.length);
      
      const totalSales = sales.length; // Usar TODAS as vendas, não filtradas
      const totalRevenue = sales.reduce((sum, sale) => {
        const revenue = sale.paidAmount || sale.total || 0;
        console.log(`Venda ${sale.id}: R$ ${revenue}`);
        return sum + revenue;
      }, 0);
      
      console.log('💰 Receita total:', totalRevenue);
      
      console.log('📊 Calculando lucro...');
      console.log('Vendas filtradas para lucro:', filteredSales.length);
      console.log('Produtos disponíveis:', products.length);
      const totalProfit = sales.reduce((sum, sale) => { // Usar TODAS as vendas
        // Verificar se a venda tem produtos
        if (!sale.products || !Array.isArray(sale.products) || sale.products.length === 0) {
          // Para vendas sem produtos (vendas livres), assumir margem de 30%
          const saleValue = sale.paidAmount || sale.total || 0;
          const profit = isNaN(saleValue) ? 0 : saleValue * 0.3;
          console.log(`💰 Venda livre ${sale.id}: R$ ${saleValue} x 30% = Lucro R$ ${profit}`);
          return sum + profit;
        }
        
        return sum + sale.products.reduce((productSum, product) => {
          if (!product || !product.name) {
            return productSum;
          }
          
          const stockProduct = products.find(p => p.name === product.name);
          const quantity = product.quantity || 1;
          const price = product.price || 0;
          
          if (isNaN(price) || isNaN(quantity)) {
            console.log(`⚠️ Produto ${product.name}: dados inválidos (preço: ${price}, qtd: ${quantity})`);
            return productSum;
          }
          
          let profit = 0;
          if (stockProduct && stockProduct.costPrice && stockProduct.costPrice > 0 && !isNaN(stockProduct.costPrice)) {
            // Usar preço de custo real do estoque
            profit = (price - stockProduct.costPrice) * quantity;
            console.log(`💰 Produto ${product.name}: Preço R$${price} - Custo R$${stockProduct.costPrice} = Lucro R$${profit}`);
          } else {
            // Se não tiver preço de custo, assumir margem de 30%
            profit = price * quantity * 0.3;
            console.log(`💰 Produto ${product.name}: Margem 30% = Lucro R$${profit}`);
          }
          
          return productSum + Math.max(0, isNaN(profit) ? 0 : profit);
        }, 0);
      }, 0);
      
      console.log('💰 Lucro total calculado:', totalProfit);

      const averageTicket = totalSales > 0 && !isNaN(totalRevenue) ? totalRevenue / totalSales : 0;
      
      console.log('📊 Resumo final:');
      console.log('- Total de vendas:', totalSales);
      console.log('- Receita total:', totalRevenue);
      console.log('- Lucro total:', totalProfit);
      console.log('- Ticket médio:', averageTicket);

      // Vendas por mês (últimos 6 meses)
      const salesByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthSales = sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= monthStart && saleDate <= monthEnd;
        });
        
        const monthRevenue = monthSales.reduce((sum, sale) => {
          const revenue = sale.paidAmount || sale.total || 0;
          return sum + (isNaN(revenue) ? 0 : revenue);
        }, 0);
        
        console.log(`Mês ${date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}: ${monthSales.length} vendas, R$ ${monthRevenue}`);
        
        salesByMonth.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          sales: monthSales.length,
          revenue: monthRevenue
        });
      }

      // Melhores clientes (usar TODAS as vendas, não filtradas)
      // Análise de clientes
      
      const clientStats = new Map();
      
      sales.forEach((sale) => {
        // Usar múltiplas formas de identificar o cliente
        let clientKey = 'avulso';
        let clientName = 'Cliente Avulso';
        
        if (sale.clientId && sale.clientId.trim()) {
          clientKey = sale.clientId;
          const foundClient = clients.find(c => c.id === sale.clientId);
          clientName = foundClient ? foundClient.name : `Cliente ID: ${sale.clientId}`;
        } else if (sale.clientName && sale.clientName.trim()) {
          clientKey = sale.clientName.trim();
          clientName = sale.clientName.trim();
        } else {
          clientKey = `avulso_${sale.id}`;
          clientName = 'Cliente Avulso';
        }
        
        if (!clientStats.has(clientKey)) {
          clientStats.set(clientKey, {
            id: sale.clientId || clientKey,
            name: clientName,
            totalPurchases: 0,
            totalSpent: 0,
            lastPurchase: sale.createdAt
          });
        }
        
        const stats = clientStats.get(clientKey);
        const saleValue = sale.paidAmount || sale.total || 0;
        stats.totalPurchases += 1;
        stats.totalSpent += saleValue;
        
        if (sale.createdAt > stats.lastPurchase) {
          stats.lastPurchase = sale.createdAt;
        }
      });

      const topClients = Array.from(clientStats.values())
        .filter(client => client.totalSpent > 0) // Só clientes com compras
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
      
      // Resultado: clientes processados

      // Produtos mais vendidos (usar TODAS as vendas, não filtradas)
      const productStats = new Map();
      
      sales.forEach((sale) => {
        
        // Verificar se a venda tem produtos
        if (sale.products && Array.isArray(sale.products) && sale.products.length > 0) {
          sale.products.forEach((product) => {
            if (product && product.name && product.name.trim()) {
              const productKey = product.name.trim();
              
              if (!productStats.has(productKey)) {
                productStats.set(productKey, {
                  name: productKey,
                  quantitySold: 0,
                  revenue: 0,
                  profit: 0
                });
              }
              
              const stats = productStats.get(productKey);
              const quantity = product.quantity || 1;
              const price = product.price || 0;
              
              stats.quantitySold += quantity;
              stats.revenue += price * quantity;
              
              // Calcular lucro
              const stockProduct = products.find(p => p.name === productKey);
              let profit = 0;
              
              if (stockProduct && stockProduct.costPrice && stockProduct.costPrice > 0) {
                // Usar preço de custo real
                profit = (price - stockProduct.costPrice) * quantity;
              } else {
                // Margem padrão de 30% se não tiver preço de custo
                profit = price * quantity * 0.3;
              }
              
              stats.profit += Math.max(0, profit); // Garantir que não seja negativo
            }
          });
        }
      });

      const topProducts = Array.from(productStats.values())
        .filter(product => product.quantitySold > 0) // Só produtos vendidos
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10);
      
      // Resultado: produtos processados

      // Status de pagamentos (usar TODAS as vendas para essas estatísticas)
      console.log('📊 Calculando status de pagamentos...');
      
      const paymentStatus = {
        paid: 0,
        pending: 0,
        partial: 0
      };
      
      sales.forEach((sale, index) => {
        let status = 'pago'; // padrão
        
        // Verificar se tem paymentStatus definido
        if (sale.paymentStatus) {
          status = sale.paymentStatus;
        } else {
          // Calcular status baseado nos dados disponíveis
          const total = sale.total || 0;
          const paidAmount = sale.paidAmount || total;
          // const _remainingAmount = sale.remainingAmount || 0; // Não utilizado
          
          if (sale.paymentMethod === 'fiado') {
            if (paidAmount >= total) {
              status = 'pago';
            } else if (paidAmount > 0) {
              status = 'parcial';
            } else {
              status = 'pendente';
            }
          } else {
            // Para dinheiro e pix, assumir que foi pago
            status = 'pago';
          }
        }
        
        console.log(`Venda ${index + 1}: ${sale.id} - Status: ${status} - Método: ${sale.paymentMethod}`);
        
        switch (status) {
          case 'pago':
            paymentStatus.paid++;
            break;
          case 'pendente':
            paymentStatus.pending++;
            break;
          case 'parcial':
            paymentStatus.partial++;
            break;
        }
      });
      
      console.log('📊 Status final:', paymentStatus);

      // Formas de pagamento (usar TODAS as vendas para essas estatísticas)
      const paymentMethods = {
        dinheiro: sales.filter(sale => sale.paymentMethod === 'dinheiro').length,
        pix: sales.filter(sale => sale.paymentMethod === 'pix').length,
        fiado: sales.filter(sale => sale.paymentMethod === 'fiado').length
      };

      // Debug: log dos dados para verificar
      console.log('Vendas filtradas:', filteredSales.length);
      console.log('Status de pagamento:', paymentStatus);
      console.log('Formas de pagamento:', paymentMethods);
      console.log('Exemplo de venda:', filteredSales[0]);

      // Dados do estoque
      const stockValue = products.reduce((sum, product) => sum + (product.quantity * product.costPrice), 0);
      const lowStockProducts = products.filter(product => product.quantity <= 5 && product.quantity > 0).length;
      const outOfStockProducts = products.filter(product => product.quantity === 0).length;

      setReportData({
        totalSales,
        totalRevenue,
        totalProfit,
        totalClients: clients.length,
        totalProducts: products.length,
        averageTicket,
        salesByMonth,
        topClients,
        topProducts,
        paymentStatus,
        paymentMethods,
        stockValue,
        lowStockProducts,
        outOfStockProducts
      });

    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = `
RELATÓRIO DE VENDAS
Período: ${new Date(dateFilter.startDate).toLocaleDateString('pt-BR')} a ${new Date(dateFilter.endDate).toLocaleDateString('pt-BR')}

=== RESUMO GERAL ===
Total de Vendas: ${reportData.totalSales}
Receita Total: R$ ${reportData.totalRevenue.toFixed(2)}
Lucro Total: R$ ${reportData.totalProfit.toFixed(2)}
Ticket Médio: R$ ${reportData.averageTicket.toFixed(2)}
Total de Clientes: ${reportData.totalClients}
Total de Produtos: ${reportData.totalProducts}

=== MELHORES CLIENTES ===
${reportData.topClients.map((client, index) => 
  `${index + 1}. ${client.name} - ${client.totalPurchases} compras - R$ ${client.totalSpent.toFixed(2)}`
).join('\n')}

=== PRODUTOS MAIS VENDIDOS ===
${reportData.topProducts.map((product, index) => 
  `${index + 1}. ${product.name} - ${product.quantitySold} unidades - R$ ${product.revenue.toFixed(2)}`
).join('\n')}

=== ESTOQUE ===
Valor do Estoque: R$ ${reportData.stockValue.toFixed(2)}
Produtos com Estoque Baixo: ${reportData.lowStockProducts}
Produtos em Falta: ${reportData.outOfStockProducts}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${dateFilter.startDate}_${dateFilter.endDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div>Gerando relatório...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Erro ao carregar relatório</h1>
      </div>
    );
  }

  // Preparar dados para envio de email
  const prepareEmailReport = () => {
    // Filtrar vendas pelo período selecionado
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    const filteredSales = rawData.sales.filter((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Calcular vendas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const salesToday = rawData.sales.filter((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= today && saleDate <= todayEnd;
    });
    
    const totalSalesToday = salesToday.reduce((sum: number, sale: any) => {
      return sum + (sale.paidAmount || sale.total || 0);
    }, 0);

    return {
      period: `${new Date(dateFilter.startDate).toLocaleDateString('pt-BR')} - ${new Date(dateFilter.endDate).toLocaleDateString('pt-BR')}`,
      // Vendas de hoje
      totalSalesToday: totalSalesToday,
      salesCountToday: salesToday.length,
      // Totais gerais (todas as vendas, não filtradas)
      totalSales: reportData.totalRevenue,
      salesCount: reportData.totalSales,
      averageTicket: reportData.averageTicket,
      // Lista de vendas do período filtrado
      sales: filteredSales.map((sale: any) => ({
        date: sale.createdAt,
        clientName: sale.clientName || 'Venda Direta',
        productName: sale.products && sale.products.length > 0 
          ? sale.products.map((p: any) => p.name).join(', ')
          : 'Venda Livre',
        quantity: sale.products && sale.products.length > 0
          ? sale.products.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0)
          : 1,
        total: sale.paidAmount || sale.total || 0,
        paymentMethod: sale.paymentMethod,
      })),
    };
  };

  return (
    <SubscriptionGuard feature="o módulo de relatórios">
      <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>📊 Relatórios</h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={exportReport}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#38a169',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            📄 Exportar Relatório
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            disabled={!reportData || reportData.totalSales === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: (!reportData || reportData.totalSales === 0) ? '#a0aec0' : '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (!reportData || reportData.totalSales === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            📧 Enviar por Email
          </button>
        </div>
      </div>

      {/* Filtros de Data */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Filtros</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto auto', 
          gap: '1rem', 
          alignItems: isMobile ? 'stretch' : 'end' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Data Inicial
            </label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
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
              Data Final
            </label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px'
              }}
            />
          </div>
          
          <button
            onClick={() => {
              setDateFilter({
                startDate: new Date(2020, 0, 1).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              });
            }}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            Todas as Vendas
          </button>
          
          <button
            onClick={generateReport}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Atualizar
          </button>
        </div>
        
        {/* Info sobre o período */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#1976d2'
        }}>
          📅 Mostrando dados de {new Date(dateFilter.startDate).toLocaleDateString('pt-BR')} até {new Date(dateFilter.endDate).toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Resumo Geral */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '2px solid #007bff'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>💰 Receita Total</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
            R$ {isNaN(reportData.totalRevenue) ? '0.00' : reportData.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '2px solid #28a745'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>📈 Lucro Total</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
            R$ {isNaN(reportData.totalProfit) ? '0.00' : reportData.totalProfit.toFixed(2)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8' }}>🛒 Total de Vendas</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {reportData.totalSales}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>🎯 Ticket Médio</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {isNaN(reportData.averageTicket) ? '0.00' : reportData.averageTicket.toFixed(2)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#6f42c1' }}>👥 Total Clientes</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {reportData.totalClients}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#fd7e14' }}>📦 Valor Estoque</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {isNaN(reportData.stockValue) ? '0.00' : reportData.stockValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Vendas por Mês */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0' }}>📊 Vendas por Mês (Últimos 6 meses)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {reportData.salesByMonth.map((month, index) => (
            <div key={index} style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{month.month}</div>
              <div style={{ fontSize: '1.2rem', color: '#007bff' }}>{month.sales} vendas</div>
              <div style={{ fontSize: '0.9rem', color: '#28a745' }}>
                R$ {isNaN(month.revenue) ? '0.00' : month.revenue.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Melhores Clientes e Produtos Mais Vendidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Melhores Clientes */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>🏆 Melhores Clientes</h3>
          {reportData.topClients.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>Nenhum cliente encontrado</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {reportData.topClients.slice(0, 5).map((client, index) => (
                <div key={client.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: index === 0 ? '#fff3cd' : '#f8f9fa',
                  borderRadius: '8px',
                  border: index === 0 ? '2px solid #ffc107' : '1px solid #e1e5e9'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {index === 0 && '👑 '}{client.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {client.totalPurchases} compras
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                      R$ {client.totalSpent.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Última: {client.lastPurchase.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Mais Vendidos */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>🔥 Produtos Mais Vendidos</h3>
          {reportData.topProducts.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>Nenhum produto vendido</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {reportData.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: index === 0 ? '#d1ecf1' : '#f8f9fa',
                  borderRadius: '8px',
                  border: index === 0 ? '2px solid #17a2b8' : '1px solid #e1e5e9'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {index === 0 && '🥇 '}{product.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {product.quantitySold} unidades vendidas
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                      R$ {product.revenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#28a745' }}>
                      Lucro: R$ {product.profit.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status de Pagamentos e Formas de Pagamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Status de Pagamentos */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>💳 Status de Pagamentos</h3>
          {rawData.sales.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
              Nenhuma venda registrada
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#d4edda',
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <span>✅ Pagos</span>
                <span style={{ fontWeight: 'bold' }}>{reportData.paymentStatus.paid}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <span>🟡 Parciais</span>
                <span style={{ fontWeight: 'bold' }}>{reportData.paymentStatus.partial}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #f5c6cb'
              }}>
                <span>🔴 Pendentes</span>
                <span style={{ fontWeight: 'bold' }}>{reportData.paymentStatus.pending}</span>
              </div>
              
              {/* Total para verificação */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                border: '1px solid #bbdefb',
                marginTop: '0.5rem'
              }}>
                <span style={{ fontWeight: 'bold' }}>📊 Total</span>
                <span style={{ fontWeight: 'bold' }}>
                  {rawData.sales.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Formas de Pagamento */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>💰 Formas de Pagamento</h3>
          {rawData.sales.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
              Nenhuma venda registrada
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#d1ecf1',
                borderRadius: '8px',
                border: '1px solid #bee5eb'
              }}>
                <span>💵 Dinheiro</span>
                <span style={{ fontWeight: 'bold' }}>{reportData.paymentMethods.dinheiro}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#e2e3e5',
                borderRadius: '8px',
                border: '1px solid #d6d8db'
              }}>
                <span>📱 PIX</span>
                <span style={{ fontWeight: 'bold' }}>{reportData.paymentMethods.pix}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#fce4ec',
                borderRadius: '8px',
                border: '1px solid #f8bbd9'
              }}>
                <span>📝 Fiado</span>
                <span style={{ fontWeight: 'bold' }}>{reportData.paymentMethods.fiado}</span>
              </div>
              
              {/* Total para verificação */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                border: '1px solid #bbdefb',
                marginTop: '0.5rem'
              }}>
                <span style={{ fontWeight: 'bold' }}>📊 Total</span>
                <span style={{ fontWeight: 'bold' }}>
                  {rawData.sales.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Estoque */}
      {(reportData.lowStockProducts > 0 || reportData.outOfStockProducts > 0) && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid #ffc107',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#856404' }}>⚠️ Alertas de Estoque</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {reportData.lowStockProducts > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#ffeaa7',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <div style={{ fontWeight: 'bold' }}>{reportData.lowStockProducts} produtos</div>
                <div style={{ fontSize: '0.9rem' }}>com estoque baixo</div>
              </div>
            )}
            
            {reportData.outOfStockProducts > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fab1a0',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <div style={{ fontWeight: 'bold' }}>{reportData.outOfStockProducts} produtos</div>
                <div style={{ fontSize: '0.9rem' }}>em falta</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info - Temporário */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>🔍 Debug Info</h4>
          <p><strong>Total de vendas carregadas:</strong> {rawData.sales.length}</p>
          <p><strong>Vendas no período:</strong> {reportData?.totalSales || 0}</p>
          <p><strong>Período:</strong> {dateFilter.startDate} a {dateFilter.endDate}</p>
          {rawData.sales.length > 0 && (
            <details>
              <summary>Exemplo de venda (clique para ver)</summary>
              <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                {JSON.stringify(rawData.sales[0], null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* IA Simples Integrada */}
      <div style={{ marginBottom: '2rem' }}>
        <SimpleAI rawData={rawData} />
      </div>

      {/* Modal de Email */}
      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportType="sales"
        reportData={prepareEmailReport()}
        defaultSubject={`Relatório Completo - ${dateFilter.startDate} a ${dateFilter.endDate}`}
      />
      </div>
    </SubscriptionGuard>
  );
}

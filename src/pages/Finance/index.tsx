import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useSubscription } from '../../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: 'dinheiro' | 'pix' | 'cartao' | 'transferencia';
  status: 'pago' | 'pendente';
  userId: string;
  createdAt: Date;
  financialType: 'comercial'; // Apenas comercial
}

// Categorias Comerciais
const RECEITA_COMERCIAL_CATEGORIES = [
  'Vendas', 'Serviços', 'Comissões', 'Outros'
];

const DESPESA_COMERCIAL_CATEGORIES = [
  'Fornecedores', 'Aluguel Loja', 'Energia Comercial', 'Internet Loja', 
  'Marketing', 'Funcionários', 'Impostos', 'Material', 'Manutenção', 'Outros'
];

export function Finance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { guardTransaction } = useSubscriptionGuard();
  const { incrementUsage } = useSubscription();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'comercial' | 'relatorio'>('overview');
  
  const [formData, setFormData] = useState({
    type: 'receita' as 'receita' | 'despesa',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'dinheiro' as 'dinheiro' | 'pix' | 'cartao' | 'transferencia',
    status: 'pago' as 'pago' | 'pendente',
    financialType: 'comercial'
  });

  useEffect(() => {
    const initData = async () => {
      await loadTransactions();
      await cleanDuplicateTransactions();
      await syncSalesAsRevenue();
      await syncStockExpenses();
      // Recarregar uma última vez para garantir que tudo esteja atualizado
      await loadTransactions();
    };
    initData();
  }, []);

  const loadTransactions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      if (savedTransactions) {
        let parsedTransactions = JSON.parse(savedTransactions).map((transaction: any) => ({
          ...transaction,
          date: new Date(transaction.date),
          createdAt: new Date(transaction.createdAt),
          // Migração: adicionar financialType para transações antigas
          financialType: transaction.financialType || 'comercial'
        }));
        
        // Salvar as transações migradas
        localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(parsedTransactions));
        
        setTransactions(parsedTransactions);
      }
    } catch (error) {
      toast.error('Erro ao carregar transações');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanDuplicateTransactions = async () => {
    if (!user) return;

    try {
      console.log('🧹 Limpando transações duplicadas...');
      
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      if (!savedTransactions) return;
      
      let transactions = JSON.parse(savedTransactions);
      const originalCount = transactions.length;
      
      // Separar transações por tipo
      const transactionsBySaleId = new Map();
      const transactionsWithoutSaleId: any[] = [];
      const stockTransactions: any[] = []; // ✅ NOVO: Transações de estoque
      
      transactions.forEach((transaction: any) => {
        // ✅ NOVO: Identificar e preservar transações de estoque
        if (transaction.stockGenerated || transaction.stockMovementGenerated) {
          stockTransactions.push(transaction);
        } else if (transaction.saleId) {
          if (!transactionsBySaleId.has(transaction.saleId)) {
            transactionsBySaleId.set(transaction.saleId, []);
          }
          transactionsBySaleId.get(transaction.saleId).push(transaction);
        } else {
          transactionsWithoutSaleId.push(transaction);
        }
      });
      
      // Manter apenas uma transação por venda (preferir a mais recente)
      const cleanedTransactions: any[] = [
        ...transactionsWithoutSaleId,
        ...stockTransactions // ✅ NOVO: Preservar TODAS as transações de estoque
      ];
      
      transactionsBySaleId.forEach((saleTransactions) => {
        if (saleTransactions.length > 1) {
          // Se há duplicatas, manter apenas a mais recente
          const mostRecent = saleTransactions.reduce((latest: any, current: any) => {
            const latestDate = new Date(latest.createdAt || latest.date);
            const currentDate = new Date(current.createdAt || current.date);
            return currentDate > latestDate ? current : latest;
          });
          cleanedTransactions.push(mostRecent);
          console.log(`🗑️ Removidas ${saleTransactions.length - 1} duplicatas para venda ${saleTransactions[0].saleId}`);
        } else {
          cleanedTransactions.push(saleTransactions[0]);
        }
      });
      
      if (cleanedTransactions.length < originalCount) {
        localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(cleanedTransactions));
        console.log(`✅ Limpeza concluída: ${originalCount - cleanedTransactions.length} duplicatas removidas`);
        console.log(`📦 Transações de estoque preservadas: ${stockTransactions.length}`);
        toast.success(`${originalCount - cleanedTransactions.length} transações duplicadas foram removidas!`);
      } else {
        console.log('✅ Nenhuma duplicata encontrada');
        console.log(`📦 Transações de estoque: ${stockTransactions.length}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao limpar duplicatas:', error);
    }
  };

  const syncSalesAsRevenue = async () => {
    if (!user) return;

    try {
      console.log('🔄 Sincronizando vendas com financeiro...');
      
      // Carregar vendas do Firebase
      let sales: any[] = [];
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
          };
        });
        
        console.log(`✅ ${sales.length} vendas encontradas no Firebase`);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar vendas do Firebase:', error);
        return;
      }

      // Carregar transações existentes atuais (sempre ler o mais recente do localStorage)
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      let existingTransactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      // Identificar vendas que ainda não foram sincronizadas
      // Verificar tanto transações automáticas quanto manuais para evitar duplicação
      const syncedSaleIds = existingTransactions
        .filter((t: any) => t.saleId) // Qualquer transação com saleId
        .map((t: any) => t.saleId);
      
      // Filtrar vendas não sincronizadas, excluindo vendas fiado (tratadas separadamente)
      const unsyncedSales = sales.filter(sale => 
        !syncedSaleIds.includes(sale.id) && 
        sale.paymentMethod !== 'fiado' // Vendas fiado são tratadas no módulo de vendas
      );
      
      console.log(`📊 ${unsyncedSales.length} vendas não sincronizadas encontradas`);
      
      if (unsyncedSales.length === 0) {
        console.log('✅ Todas as vendas já estão sincronizadas');
        return;
      }

      // Criar transações de receita para vendas não sincronizadas
      const newTransactions = unsyncedSales.map(sale => {
        const saleValue = sale.paidAmount || sale.total || 0;
        const clientName = sale.clientName || 'Cliente Avulso';
        
        return {
          id: `sale_${sale.id}_${Date.now()}`,
          type: 'receita',
          category: 'Vendas',
          description: `Venda - ${clientName}`,
          amount: saleValue,
          date: sale.createdAt.toISOString ? sale.createdAt.toISOString() : new Date(sale.createdAt).toISOString(),
          paymentMethod: sale.paymentMethod === 'dinheiro' ? 'dinheiro' : 
                       sale.paymentMethod === 'pix' ? 'pix' : 'dinheiro',
          status: 'pago',
          userId: user.uid,
          createdAt: new Date().toISOString(),
          autoGenerated: true,
          saleId: sale.id,
          financialType: 'comercial' // Vendas sempre são comerciais
        };
      });

      // Salvar as novas transações
      const updatedTransactions = [...existingTransactions, ...newTransactions];
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(updatedTransactions));
      
      console.log(`✅ ${newTransactions.length} receitas sincronizadas com sucesso`);
      
      if (newTransactions.length > 0) {
        toast.success(`${newTransactions.length} vendas sincronizadas como receitas!`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar vendas:', error);
    }
  };

  const syncStockExpenses = async () => {
    if (!user) return;

    try {
      console.log('🔄 Sincronizando despesas de estoque...');
      
      // 1. Buscar todos os produtos do Firebase
      let productsSnapshot;
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');

        const productsQuery = query(
          collection(db, 'products'),
          where('userId', '==', user.uid)
        );
        productsSnapshot = await getDocs(productsQuery);
      } catch (error) {
        console.warn('Erro ao buscar produtos do Firebase:', error);
        return;
      }
      
      // 2. Calcular valor total do estoque
      let totalStockValue = 0;
      const productsData: any[] = [];
      
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const quantity = Number(data.quantity) || 0;
        const costPrice = Number(data.costPrice) || 0;
        const productValue = quantity * costPrice;
        
        totalStockValue += productValue;
        productsData.push({
          id: doc.id,
          name: data.name,
          quantity,
          costPrice,
          value: productValue
        });
      });
      
      // 3. Buscar despesas de estoque existentes
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      const stockExpenses = transactions.filter((t: any) => 
        t.type === 'despesa' && (t.stockGenerated || t.stockMovementGenerated)
      );
      
      let totalExpenses = 0;
      stockExpenses.forEach((expense: any) => {
        totalExpenses += Number(expense.amount) || 0;
      });
      
      // 4. Calcular diferença
      const difference = totalStockValue - totalExpenses;
      
      // Tolerância de 1 centavo
      if (difference <= 0.01) {
        console.log('✅ Despesas de estoque já estão sincronizadas (ou excedem o valor atual)');
        return;
      }
      
      // 5. Criar transação de ajuste
      if (difference > 0) {
        console.log(`📉 Ajustando despesas de estoque: falta R$ ${difference.toFixed(2)}`);
        
        const adjustmentTransaction = {
          id: `stock_adjustment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'despesa',
          category: 'Fornecedores',
          description: `Ajuste de Estoque - Sincronização Automática`,
          amount: difference,
          date: new Date().toISOString(),
          paymentMethod: 'dinheiro',
          status: 'pago',
          userId: user.uid,
          createdAt: new Date().toISOString(),
          financialType: 'comercial',
          autoGenerated: true,
          stockGenerated: true,
          notes: 'Ajuste automático para sincronizar valor do estoque com despesas registradas'
        };
        
        // Adicionar e salvar
        transactions.push(adjustmentTransaction);
        localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactions));
        
        toast.success(`Despesas de estoque sincronizadas: +R$ ${difference.toFixed(2)}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar despesas de estoque:', error);
    }
  };

  const handleCreateTransaction = (type: 'receita' | 'despesa') => {
    setEditingTransaction(null);
    setFormData({
      type,
      category: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'dinheiro',
      status: 'pago',
      financialType: 'comercial'
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Verificar limites de assinatura antes de criar transação (apenas para novas transações)
    if (!editingTransaction && !guardTransaction()) {
      return;
    }

    const amount = Number(formData.amount) || 0;
    if (!formData.category || !formData.description || amount < 0.01) {
      toast.error('Preencha todos os campos obrigatórios. Valor mínimo: R$ 0,01');
      return;
    }

    try {
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      let transactionsList = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      // Garantir que amount seja número
      const transactionData = {
        ...formData,
        amount: amount // usar o amount já convertido
      };

      if (editingTransaction) {
        transactionsList = transactionsList.map((transaction: any) => 
          transaction.id === editingTransaction.id 
            ? { 
                ...transaction, 
                ...transactionData, 
                date: new Date(formData.date).toISOString(),
                updatedAt: new Date().toISOString() 
              }
            : transaction
        );
        toast.success('Transação atualizada com sucesso!');
      } else {
        const newTransaction = {
          id: Date.now().toString(),
          ...transactionData,
          date: new Date(formData.date).toISOString(),
          createdAt: new Date().toISOString(),
          userId: user.uid,
          financialType: formData.financialType
        };
        transactionsList.push(newTransaction);
        
        // Incrementar contador de uso apenas para novas transações
        await incrementUsage('transaction');
        
        toast.success('Transação criada com sucesso!');
      }
      
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsList));
      
      setShowForm(false);
      loadTransactions();
    } catch (error) {
      toast.error('Erro ao salvar transação');
      console.error('Erro:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const savedTransactions = localStorage.getItem(`transactions_${user?.uid}`);
      if (savedTransactions) {
        const transactionsList = JSON.parse(savedTransactions);
        const filteredTransactions = transactionsList.filter((transaction: any) => transaction.id !== transactionId);
        localStorage.setItem(`transactions_${user?.uid}`, JSON.stringify(filteredTransactions));
      }
      
      toast.success('Transação excluída com sucesso!');
      loadTransactions();
    } catch (error) {
      toast.error('Erro ao excluir transação');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date.toISOString().split('T')[0],
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      financialType: transaction.financialType
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (transactionId: string) => {
    if (!user) return;

    try {
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      if (savedTransactions) {
        const transactionsList = JSON.parse(savedTransactions);
        const updatedTransactions = transactionsList.map((transaction: any) => {
          if (transaction.id === transactionId) {
            const newStatus = transaction.status === 'pago' ? 'pendente' : 'pago';
            toast.success(`Transação marcada como ${newStatus}!`);
            return { 
              ...transaction, 
              status: newStatus,
              updatedAt: new Date().toISOString() 
            };
          }
          return transaction;
        });
        
        localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(updatedTransactions));
        loadTransactions();
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error('Erro:', error);
    }
  };

  const getSummary = () => {
    const receitas = transactions.filter(t => t.type === 'receita');
    const despesas = transactions.filter(t => t.type === 'despesa');

    const totalReceitas = receitas.reduce((sum, t) => t.status === 'pago' ? sum + t.amount : sum, 0);
    const totalDespesas = despesas.reduce((sum, t) => t.status === 'pago' ? sum + t.amount : sum, 0);
    const receitasPendentes = receitas.reduce((sum, t) => t.status === 'pendente' ? sum + t.amount : sum, 0);
    const despesasPendentes = despesas.reduce((sum, t) => t.status === 'pendente' ? sum + t.amount : sum, 0);

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      receitasPendentes,
      despesasPendentes
    };
  };

  const summary = getSummary();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div>Carregando dados financeiros...</div>
      </div>
    );
  }

  return (
    <SubscriptionGuard feature="o módulo financeiro">
      <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>💰 Gestão Financeira</h1>
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
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            padding: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e1e5e9'
          }}>
            <button
              onClick={() => handleCreateTransaction('receita')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              + Receita
            </button>
            <button
              onClick={() => handleCreateTransaction('despesa')}
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
              + Despesa
            </button>
          </div>
        </div>
      </div>

      {/* Informação sobre Integração Automática */}
      <div className="card" style={{
        backgroundColor: 'rgba(40, 199, 111, 0.05)',
        marginBottom: '2rem',
        border: '1px solid rgba(40, 199, 111, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#28a745',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'white'
          }}>
            🤖
          </div>
          <div>
            <strong style={{ color: '#28a745', fontSize: '1.1rem' }}>Integração Automática Ativada</strong>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
              Seus custos e lucros são calculados automaticamente
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.95rem', color: '#28a745', lineHeight: '1.5' }}>
          • <strong>📦 Estoque:</strong> Ao adicionar produtos, o custo é registrado como despesa automaticamente<br/>
          • <strong>🛍️ Vendas:</strong> Receita da venda + custo dos produtos vendidos (CPV) são calculados<br/>
          • <strong>💰 Lucro Real:</strong> Receitas - Despesas - CPV = seu lucro líquido verdadeiro<br/>
          • <strong>🏷️ Identificação:</strong> Transações automáticas são marcadas com etiquetas coloridas
        </div>
      </div>

      {/* Resumo Financeiro Geral */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{
          textAlign: 'center',
          border: '2px solid var(--success-color)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--success-color)' }}>📈 Receitas Totais</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
            R$ {summary.totalReceitas.toFixed(2)}
          </p>
          {summary.receitasPendentes > 0 && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--warning-color)' }}>
              Pendente: R$ {summary.receitasPendentes.toFixed(2)}
            </p>
          )}
        </div>

        <div className="card" style={{
          textAlign: 'center',
          border: '2px solid var(--danger-color)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger-color)' }}>📉 Despesas Totais</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
            R$ {summary.totalDespesas.toFixed(2)}
          </p>
          {summary.despesasPendentes > 0 && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--warning-color)' }}>
              Pendente: R$ {summary.despesasPendentes.toFixed(2)}
            </p>
          )}
        </div>

        <div className="card" style={{
          textAlign: 'center',
          border: `2px solid ${summary.saldoLiquido >= 0 ? 'var(--primary-color)' : 'var(--danger-color)'}`
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: summary.saldoLiquido >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' }}>
            💰 Lucro Líquido
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: summary.saldoLiquido >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' 
          }}>
            R$ {summary.saldoLiquido.toFixed(2)}
          </p>
        </div>
      </div>



      {/* Abas de Navegação */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e1e5e9' }}>
          {[
            { key: 'overview', label: '📊 Visão Geral' },
            { key: 'comercial', label: '🏪 Transações' },
            { key: 'relatorio', label: '📋 Relatórios' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === tab.key ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--primary-color)',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário de Transação */}
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
          padding: '1rem'
        }}>
          <div 
            className="modal-content"
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 'auto'
            }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {editingTransaction ? 'Editar' : 'Nova'} {formData.type === 'receita' ? 'Receita' : 'Despesa'}
            </h2>

            <form onSubmit={handleSubmit}>


              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione uma categoria</option>
                  {(formData.type === 'receita' ? RECEITA_COMERCIAL_CATEGORIES : DESPESA_COMERCIAL_CATEGORIES).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="Descreva a transação"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setFormData(prev => ({ ...prev, amount: value }));
                    }}
                    onBlur={(e) => {
                      // Validação só ao sair do campo
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue) || numValue < 0.01) {
                        setFormData(prev => ({ ...prev, amount: 0.01 }));
                      } else if (numValue > 9999) {
                        setFormData(prev => ({ ...prev, amount: 9999 }));
                      }
                    }}
                    step="0.01"
                    placeholder="Digite o valor"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
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
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
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
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      paymentMethod: e.target.value as 'dinheiro' | 'pix' | 'cartao' | 'transferencia' 
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="pix">📱 PIX</option>
                    <option value="cartao">💳 Cartão</option>
                    <option value="transferencia">🏦 Transferência</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value as 'pago' | 'pendente' 
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="pago">✅ Pago</option>
                    <option value="pendente">⏳ Pendente</option>
                  </select>
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
                    backgroundColor: formData.type === 'receita' ? '#28a745' : '#dc3545',
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

      {/* Conteúdo das Abas */}
      {activeTab === 'overview' && (
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0' }}>📊 Visão Geral</h3>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <h4>Nenhuma transação registrada</h4>
              <p>Comece adicionando suas receitas e despesas usando os botões acima</p>
            </div>
          ) : (
            <div>
              <p>Total de transações: {transactions.length}</p>
              <p>Receitas: {transactions.filter(t => t.type === 'receita').length}</p>
              <p>Despesas: {transactions.filter(t => t.type === 'despesa').length}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'comercial' && (
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0' }}>
            🏪 Todas as Transações
          </h3>
          
          {transactions.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              Nenhuma transação registrada
            </p>
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
                minWidth: '650px'
              }}>
                {transactions
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((transaction) => (
                <div key={transaction.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: transaction.status === 'pendente' ? '#fff3cd' : '#f8f9fa',
                  borderRadius: '8px',
                  border: `2px solid ${
                    transaction.status === 'pendente' ? '#ffc107' : 
                    transaction.type === 'receita' ? '#28a745' : '#dc3545'
                  }`,
                  opacity: transaction.status === 'pendente' ? 0.8 : 1
                }}>
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontWeight: 'bold', 
                      marginBottom: '0.25rem' 
                    }}>
                      {transaction.description}
                      {transaction.status === 'pendente' && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: '#ffc107',
                          color: '#212529',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          ⏳ PENDENTE
                        </span>
                      )}
                      {(transaction as any).autoGenerated && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: (transaction as any).saleGenerated ? '#28a745' : 
                                         (transaction as any).stockGenerated ? '#ff6b35' :
                                         (transaction as any).costOfGoodsSold ? '#dc3545' : '#007bff',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {(transaction as any).saleGenerated ? '🛍️ VENDA' :
                           (transaction as any).stockGenerated ? '📦 ESTOQUE' :
                           (transaction as any).costOfGoodsSold ? '💰 CPV' : 
                           (transaction as any).fiadoPayment ? '📝 FIADO' : '🔄 AUTO'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                      📂 {transaction.category} • 📅 {transaction.date.toLocaleDateString('pt-BR')}
                      {(transaction as any).autoGenerated && (
                        <span style={{ color: '#007bff', marginLeft: '0.5rem' }}>
                          • {(transaction as any).saleGenerated ? '🛍️ Gerado por Venda' :
                             (transaction as any).stockGenerated ? '📦 Gerado por Estoque' :
                             (transaction as any).costOfGoodsSold ? '💰 Custo dos Produtos Vendidos' :
                             (transaction as any).stockMovementGenerated ? '📦 Movimentação de Estoque' :
                             (transaction as any).fiadoPayment ? '📝 Pagamento de Fiado' :
                             '🔄 Sincronizado Automaticamente'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {transaction.paymentMethod === 'dinheiro' && '💵'}
                      {transaction.paymentMethod === 'pix' && '📱'}
                      {transaction.paymentMethod === 'cartao' && '💳'}
                      {transaction.paymentMethod === 'transferencia' && '🏦'}
                      {' '}{transaction.paymentMethod} • {transaction.status === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: transaction.type === 'receita' ? '#28a745' : '#dc3545'
                    }}>
                      {transaction.type === 'receita' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Botão de alternar status */}
                    <button
                      onClick={() => handleToggleStatus(transaction.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: transaction.status === 'pago' ? '#ffc107' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                      title={transaction.status === 'pago' ? 'Marcar como pendente' : 'Marcar como pago'}
                    >
                      {transaction.status === 'pago' ? '⏳' : '✅'}
                    </button>
                    
                    {/* Botão de editar */}
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Editar transação"
                    >
                      ✏️
                    </button>
                    
                    {/* Botão de deletar */}
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Excluir transação"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'relatorio' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Relatório Geral */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.5rem 0' }}>📋 Relatório Geral</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#28a745' }}>📈 Receitas Totais</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  R$ {summary.totalReceitas.toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#dc3545' }}>📉 Despesas Totais</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                  R$ {summary.totalDespesas.toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: summary.saldoLiquido >= 0 ? '#007bff' : '#dc3545' }}>💰 Saldo Líquido</h4>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: summary.saldoLiquido >= 0 ? '#007bff' : '#dc3545' 
                }}>
                  R$ {summary.saldoLiquido.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Relatório Detalhado */}
          <div className="card" style={{ border: '2px solid #6c757d' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#6c757d' }}>🏪 Relatório Detalhado</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#28a745' }}>📈 Receitas</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  R$ {summary.totalReceitas.toFixed(2)}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {transactions.filter(t => t.type === 'receita').length} transações
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#dc3545' }}>📉 Despesas</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                  R$ {summary.totalDespesas.toFixed(2)}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {transactions.filter(t => t.type === 'despesa').length} transações
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: summary.saldoLiquido >= 0 ? '#28a745' : '#dc3545' }}>💰 Lucro</h4>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: summary.saldoLiquido >= 0 ? '#28a745' : '#dc3545' 
                }}>
                  R$ {summary.saldoLiquido.toFixed(2)}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  Margem: {summary.totalReceitas > 0 ? 
                    ((summary.saldoLiquido / summary.totalReceitas) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </SubscriptionGuard>
  );
}
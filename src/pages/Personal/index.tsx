import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { personalFinanceService } from '../../services/personalFinanceService';
import type { PersonalTransaction } from '../../services/personalFinanceService';
import { EditTransactionModal } from './EditTransactionModal';
import { CategoryManager } from './CategoryManager';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useSubscription } from '../../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

export function Personal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { guardTransaction } = useSubscriptionGuard();
  const { incrementUsage } = useSubscription();
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'receita' | 'despesa'>('all');
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'despesa' as 'receita' | 'despesa',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'dinheiro' as any,
    isRecurring: false,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('🔄 Inicializando categorias padrão para userId:', user.uid);
      // Inicializar categorias padrão se necessário
      await personalFinanceService.initializeDefaultCategories(user.uid);
      
      console.log('📊 Carregando transações e categorias...');
      const [transactionsData, categoriesData] = await Promise.all([
        personalFinanceService.getTransactions(user.uid),
        personalFinanceService.getCategories(user.uid)
      ]);
      
      console.log('✅ Transações carregadas:', transactionsData.length);
      console.log('📝 Transações:', transactionsData);
      console.log('✅ Categorias carregadas:', categoriesData.length);
      console.log('📂 Categorias:', categoriesData);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Verificar limites de assinatura antes de criar transação
    if (!guardTransaction()) {
      return;
    }

    try {
      console.log('🔄 Criando transação pessoal...');
      console.log('👤 User ID:', user.uid);
      console.log('📊 Dados da transação:', {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date)
      });

      const transactionId = await personalFinanceService.createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        userId: user.uid
      }, user.uid);

      // Incrementar contador de uso
      await incrementUsage('transaction');

      console.log('✅ Transação criada com ID:', transactionId);
      toast.success('Transação adicionada!');
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;

    try {
      await personalFinanceService.deleteTransaction(id);
      toast.success('Transação excluída!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const handleEdit = (transaction: PersonalTransaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await personalFinanceService.updateTransaction(id, data);
      toast.success('Transação atualizada!');
      setEditingTransaction(null);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar transação');
      throw error;
    }
  };

  // Funções de Categorias
  const handleCreateCategory = async (data: any) => {
    if (!user) return;
    try {
      await personalFinanceService.createCategory(data, user.uid);
      toast.success('Categoria criada!');
      loadData();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
      throw error;
    }
  };

  const handleUpdateCategory = async (id: string, data: any) => {
    try {
      await personalFinanceService.updateCategory(id, data);
      toast.success('Categoria atualizada!');
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await personalFinanceService.deleteCategory(id);
      toast.success('Categoria excluída!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
      throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'despesa',
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'dinheiro',
      isRecurring: false,
      notes: ''
    });
  };

  // Calcular totais
  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  );

  const totalReceitas = transactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalReceitas - totalDespesas;

  const availableCategories = categories.filter(c => c.type === formData.type);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Voltar
          </button>
          <div>
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>💰 Gestão Pessoal</h1>
            <p style={{ margin: 0, color: '#666' }}>
              Controle suas finanças pessoais separadamente do negócio
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowCategoryManager(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '1rem'
            }}
          >
            📂 Categorias
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '1rem'
            }}
          >
            + Nova Transação
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💵 Receitas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {totalReceitas.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💸 Despesas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {totalDespesas.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: saldo >= 0 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💰 Saldo
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {saldo.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {(['all', 'receita', 'despesa'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === f ? '#667eea' : 'white',
              color: filter === f ? 'white' : '#333',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {f === 'all' ? 'Todas' : f === 'receita' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* Lista de Transações */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div>Nenhuma transação encontrada</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Clique em "Nova Transação" para começar
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e1e5e9' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Data</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Descrição</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Categoria</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Método</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  style={{ borderBottom: '1px solid #f0f0f0' }}
                >
                  <td style={{ padding: '1rem' }}>
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '1rem' }}>{transaction.description}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      backgroundColor: transaction.type === 'receita' ? '#d4edda' : '#f8d7da',
                      color: transaction.type === 'receita' ? '#155724' : '#721c24'
                    }}>
                      {transaction.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    {transaction.paymentMethod.replace('_', ' ')}
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: transaction.type === 'receita' ? '#28a745' : '#dc3545'
                  }}>
                    {transaction.type === 'receita' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(transaction)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        marginRight: '0.5rem'
                      }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                      }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Nova Transação */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Nova Transação</h2>
            
            <form onSubmit={handleSubmit}>
              {/* Tipo */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Tipo
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ flex: 1, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="receita"
                      checked={formData.type === 'receita'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: '' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    💵 Receita
                  </label>
                  <label style={{ flex: 1, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="despesa"
                      checked={formData.type === 'despesa'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: '' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    💸 Despesa
                  </label>
                </div>
              </div>

              {/* Categoria */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione...</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Ex: Almoço no restaurante"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Valor */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Data */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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

              {/* Método de Pagamento */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Método de Pagamento
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
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
                  <option value="cartao_debito">💳 Cartão Débito</option>
                  <option value="cartao_credito">💳 Cartão Crédito</option>
                  <option value="transferencia">🏦 Transferência</option>
                </select>
              </div>

              {/* Notas */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#e1e5e9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          categories={categories}
          onSave={handleUpdate}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Modal de Gerenciar Categorias */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onCreate={handleCreateCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </div>
  );
}

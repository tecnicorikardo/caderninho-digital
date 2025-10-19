import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  productName?: string;
  price: number;
  quantity: number;
  total: number;
  paymentMethod: string;
  createdAt: Date;
  userId: string;
  isCustomSale?: boolean; // Para vendas só com valor
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saleType, setSaleType] = useState<'custom' | 'with-product'>('custom');
  
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    productId: '',
    productName: '',
    price: 0,
    quantity: 1,
    paymentMethod: 'dinheiro'
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
      
      // Carregar vendas
      const q = query(collection(db, 'sales'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const salesData: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        salesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Sale);
      });
      
      setSales(salesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      
      // Carregar clientes
      try {
        const firebaseClients = await clientService.getClients(user.uid);
        setClients(firebaseClients);
      } catch (error) {
        console.log('Erro ao carregar clientes:', error);
        setClients([]);
      }
      
      // Carregar produtos do estoque
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        setStockProducts(parsedProducts.filter((p: any) => p.quantity > 0));
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

    if (formData.price <= 0) {
      toast.error('O preço deve ser maior que zero');
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
      const total = formData.price * formData.quantity;
      
      // Calcular status de pagamento
      const paidAmount = total; // Para vendas simples, assumir que foi pago integralmente
      const remainingAmount = 0; // Para vendas simples, não há valor pendente
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
        createdAt: Timestamp.now()
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

      // Combinar dados base com campos opcionais
      const saleData = { ...baseSaleData, ...optionalFields };
      
      // Função para remover qualquer campo undefined que possa ter escapado
      const cleanSaleData = Object.fromEntries(
        Object.entries(saleData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      
      console.log('📊 Dados limpos da venda:', cleanSaleData);
      
      await addDoc(collection(db, 'sales'), cleanSaleData);
      
      // Atualizar estoque se for produto do estoque
      if (saleType === 'with-product' && formData.productId) {
        updateStock();
      }
      
      // Registrar receita no financeiro automaticamente
      await registerFinancialTransaction(cleanSaleData);
      
      toast.success('Venda criada com sucesso! Receita registrada no financeiro.');
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
    }
  };

  const updateStock = () => {
    if (!user || !formData.productId) return;
    
    try {
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      if (savedProducts) {
        const productsList = JSON.parse(savedProducts);
        
        const updatedProducts = productsList.map((product: any) => {
          if (product.id === formData.productId) {
            const newQuantity = Math.max(0, product.quantity - formData.quantity);
            return {
              ...product,
              quantity: newQuantity,
              updatedAt: new Date().toISOString()
            };
          }
          return product;
        });
        
        localStorage.setItem(`products_${user.uid}`, JSON.stringify(updatedProducts));
        
        // Registrar movimentação
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
        
        console.log('✅ Estoque atualizado');
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
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
      paymentMethod: 'dinheiro'
    });
    setSaleType('custom');
    setShowForm(false);
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
      console.log('💰 Registrando receita no financeiro...');
      
      // Criar transação financeira
      const financialTransaction = {
        id: Date.now().toString(),
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
        saleId: saleData.id || Date.now().toString(), // Referência à venda
        autoGenerated: true // Marcar como gerada automaticamente
      };
      
      // Salvar no localStorage (financeiro usa localStorage)
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactionsList = savedTransactions ? JSON.parse(savedTransactions) : [];
      transactionsList.push(financialTransaction);
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsList));
      
      console.log('✅ Receita registrada no financeiro:', financialTransaction.description);
    } catch (error) {
      console.error('❌ Erro ao registrar receita no financeiro:', error);
      // Não mostrar erro para o usuário, pois a venda foi criada com sucesso
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>💰 Vendas - Sistema Atualizado</h1>
          <p style={{ margin: 0, color: '#666' }}>
            {sales.length} vendas registradas
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            ← Dashboard
          </button>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
          }}
        >
          + Nova Venda
        </button>
      </div>

      {/* Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28a745' }}>
            {sales.length}
          </div>
          <div style={{ color: '#666' }}>Total de Vendas</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💵</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28a745' }}>
            R$ {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
          </div>
          <div style={{ color: '#666' }}>Faturamento Total</div>
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
          <div style={{ display: 'grid', gap: '1rem' }}>
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
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {sale.paymentMethod === 'dinheiro' ? '💵' : sale.paymentMethod === 'pix' ? '📱' : '📝'} {sale.paymentMethod}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#333' }}>💰 Nova Venda</h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
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
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
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
                  R$ {(formData.price * formData.quantity).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                  }}
                >
                  💰 Criar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
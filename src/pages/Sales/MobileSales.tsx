import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { saleService } from '../../services/saleService';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  products: Product[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'dinheiro' | 'pix' | 'fiado';
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  paidAmount: number;
  remainingAmount: number;
  isLoan: boolean;
  loanAmount?: number;
  installmentCount?: number;
  createdAt: Date;
  userId: string;
  notes?: string;
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

export function MobileSales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    products: [{ id: '', name: '', price: 0, quantity: 1 }],
    discount: 0,
    paymentMethod: 'dinheiro' as 'dinheiro' | 'pix' | 'fiado',
    paidAmount: 0,
    isLoan: false,
    loanAmount: 0,
    installmentCount: 1,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Carregar vendas do Firebase (fonte principal)
      try {
        const firebaseSales = await saleService.getSales(user.uid);
        setSales(firebaseSales);
        // Salvar no localStorage como cache
        localStorage.setItem(`sales_${user.uid}`, JSON.stringify(
          firebaseSales.map(sale => ({
            ...sale,
            createdAt: sale.createdAt.toISOString()
          }))
        ));
      } catch (error) {
        console.log('Erro ao carregar do Firebase, usando localStorage:', error);
        // Fallback: carregar do localStorage se Firebase falhar
        const savedSales = localStorage.getItem(`sales_${user.uid}`);
        if (savedSales) {
          const parsedSales = JSON.parse(savedSales).map((sale: any) => ({
            ...sale,
            createdAt: new Date(sale.createdAt)
          }));
          setSales(parsedSales);
        }
      }

      // 2. Carregar clientes do Firebase (fonte principal)
      try {
        const firebaseClients = await clientService.getClients(user.uid);
        setClients(firebaseClients);
        // Salvar no localStorage como cache
        localStorage.setItem(`clients_${user.uid}`, JSON.stringify(firebaseClients));
      } catch (error) {
        console.log('Erro ao carregar clientes do Firebase, usando localStorage:', error);
        // Fallback: carregar do localStorage se Firebase falhar
        const savedClients = localStorage.getItem(`clients_${user.uid}`);
        if (savedClients) {
          setClients(JSON.parse(savedClients));
        }
      }

      // 3. Carregar produtos do localStorage (só existe lá)
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      if (savedProducts) {
        setStockProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = stockProducts.find(p => p.id === productId);
    if (selectedProduct) {
      const newProducts = [...formData.products];
      newProducts[index] = {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.salePrice,
        quantity: 1
      };
      setFormData({ ...formData, products: newProducts });
      
      // Auto-calcular total
      calculateTotal(newProducts, formData.discount);
    }
  };

  const updateProductQuantity = (index: number, value: string) => {
    const newProducts = [...formData.products];
    if (value === '') {
      // Permitir campo vazio temporariamente
      newProducts[index].quantity = 0;
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        newProducts[index].quantity = numValue;
      } else {
        return; // Não atualizar se o valor for inválido
      }
    }
    setFormData({ ...formData, products: newProducts });
    // Só calcular total se a quantidade for válida (> 0)
    if (newProducts[index].quantity > 0) {
      calculateTotal(newProducts, formData.discount);
    }
  };

  const calculateTotal = (products: Product[], discount: number) => {
    const subtotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const total = subtotal - discount;
    // Para vendas fiado, paidAmount deve ser 0 por padrão
    const paidAmount = formData.paymentMethod === 'fiado' ? 0 : total;
    setFormData(prev => ({ ...prev, paidAmount }));
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { id: '', name: '', price: 0, quantity: 1 }]
    });
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData({ ...formData, products: newProducts });
      calculateTotal(newProducts, formData.discount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const subtotal = formData.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      const total = subtotal - formData.discount;
      const remainingAmount = total - formData.paidAmount;

      const newSale: Sale = {
        id: editingSale?.id || Date.now().toString(),
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        products: formData.products,
        subtotal,
        discount: formData.discount,
        total,
        paymentMethod: formData.paymentMethod,
        paymentStatus: remainingAmount <= 0 ? 'pago' : (formData.paidAmount > 0 ? 'parcial' : 'pendente'),
        paidAmount: formData.paidAmount,
        remainingAmount,
        isLoan: formData.isLoan,
        loanAmount: formData.isLoan ? formData.loanAmount : undefined,
        installmentCount: formData.paymentMethod === 'fiado' ? formData.installmentCount : undefined,
        notes: formData.notes,
        createdAt: editingSale?.createdAt || new Date(),
        userId: user.uid,
      };

      let updatedSales;
      if (editingSale) {
        updatedSales = sales.map(sale => sale.id === editingSale.id ? newSale : sale);
      } else {
        updatedSales = [...sales, newSale];
      }

      setSales(updatedSales);
      localStorage.setItem(`sales_${user.uid}`, JSON.stringify(updatedSales));

      // Atualizar estoque
      if (!editingSale) {
        const updatedProducts = stockProducts.map(product => {
          const soldProduct = formData.products.find(p => p.id === product.id);
          if (soldProduct) {
            return {
              ...product,
              quantity: Math.max(0, product.quantity - soldProduct.quantity)
            };
          }
          return product;
        });
        setStockProducts(updatedProducts);
        localStorage.setItem(`products_${user.uid}`, JSON.stringify(updatedProducts));
      }

      toast.success(editingSale ? 'Venda atualizada!' : 'Venda registrada!');
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error('Erro ao salvar venda');
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      clientName: '',
      products: [{ id: '', name: '', price: 0, quantity: 1 }],
      discount: 0,
      paymentMethod: 'dinheiro',
      paidAmount: 0,
      isLoan: false,
      loanAmount: 0,
      installmentCount: 1,
      notes: ''
    });
    setEditingSale(null);
  };

  const deleteSale = async (saleId: string) => {
    if (!user) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        // ✅ Usar função completa do serviço que reverte estoque e remove transações
        await saleService.deleteSaleComplete(saleId, user.uid);
        
        // Atualizar estado local
        const updatedSales = sales.filter(sale => sale.id !== saleId);
        setSales(updatedSales);
        
        toast.success('Venda excluída!');
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        toast.error('Erro ao excluir venda');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        padding: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
          <div>Carregando vendas...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      {/* Header Mobile */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>💰 Vendas</h1>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          ➕ Nova Venda
        </button>
      </div>

      {/* Formulário Mobile */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            marginTop: '2rem'
          }}>
            {/* Header do Modal */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e1e5e9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderRadius: '12px 12px 0 0'
            }}>
              <h3 style={{ margin: 0 }}>
                {editingSale ? 'Editar Venda' : 'Nova Venda'}
              </h3>
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
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
              {/* Cliente */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Cliente
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={formData.clientId}
                    onChange={(e) => {
                      const selectedClient = clients.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        clientId: e.target.value,
                        clientName: selectedClient?.name || ''
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Selecionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Cliente avulso */}
                <input
                  type="text"
                  placeholder="Ou digite o nome do cliente"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value, clientId: '' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    marginTop: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Produtos */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                    Produtos
                  </label>
                  <button
                    type="button"
                    onClick={addProduct}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    + Produto
                  </button>
                </div>

                {formData.products.map((product, index) => (
                  <div key={index} style={{
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {/* Seleção do Produto */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <select
                        value={product.id}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Selecionar produto</option>
                        {stockProducts
                          .filter(p => p.quantity > 0)
                          .map(stockProduct => (
                            <option key={stockProduct.id} value={stockProduct.id}>
                              {stockProduct.name} - R$ {stockProduct.salePrice.toFixed(2)} (Est: {stockProduct.quantity})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Preço e Quantidade */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 80px auto', 
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#666' }}>Preço</label>
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#e9ecef',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: '#28a745'
                        }}>
                          R$ {product.price.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#666' }}>Qtd</label>
                        <input
                          type="number"
                          value={product.quantity === 0 ? '' : product.quantity}
                          onChange={(e) => updateProductQuantity(index, e.target.value)}
                          onBlur={(e) => {
                            // Garantir que não fique vazio ao sair do campo
                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                              updateProductQuantity(index, '1');
                            }
                          }}
                          min="1"
                          placeholder="Qtd"
                          required
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #007bff',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            textAlign: 'center',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>

                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Subtotal do produto */}
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}>
                      Subtotal: R$ {(product.price * product.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desconto */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const discount = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
                    setFormData({ ...formData, discount });
                    calculateTotal(formData.products, discount);
                  }}
                  onBlur={(e) => {
                    // Garantir que não fique vazio
                    if (e.target.value === '') {
                      setFormData({ ...formData, discount: 0 });
                    }
                  }}
                  min="0"
                  step="0.01"
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

              {/* Total */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: '8px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total da Venda</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  R$ {(
                    formData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0) - formData.discount
                  ).toFixed(2)}
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Forma de Pagamento
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { value: 'dinheiro', label: '💵 Dinheiro', color: '#28a745' },
                    { value: 'pix', label: '📱 PIX', color: '#17a2b8' },
                    { value: 'fiado', label: '📝 Fiado', color: '#ffc107' }
                  ].map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        const total = formData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0) - formData.discount;
                        const paidAmount = method.value === 'fiado' ? 0 : total;
                        setFormData({ ...formData, paymentMethod: method.value as any, paidAmount });
                      }}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: formData.paymentMethod === method.value ? method.color : '#f8f9fa',
                        color: formData.paymentMethod === method.value ? 'white' : '#333',
                        border: `2px solid ${method.color}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor Pago */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Valor Pago (R$)
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const paidAmount = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
                    setFormData({ ...formData, paidAmount });
                  }}
                  onBlur={(e) => {
                    // Se estiver vazio, preencher com o total apenas se não for fiado
                    if (e.target.value === '') {
                      const total = formData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0) - formData.discount;
                      const paidAmount = formData.paymentMethod === 'fiado' ? 0 : total;
                      setFormData({ ...formData, paidAmount });
                    }
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
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

              {/* Observações */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre a venda..."
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {editingSale ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Vendas Mobile */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sales.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3>Nenhuma venda registrada</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Comece registrando sua primeira venda!
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ➕ Primeira Venda
            </button>
          </div>
        ) : (
          sales
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(sale => (
              <div key={sale.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid ${
                  sale.paymentStatus === 'pago' ? '#28a745' :
                  sale.paymentStatus === 'parcial' ? '#ffc107' : '#dc3545'
                }`
              }}>
                {/* Header da Venda */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {sale.clientName || sale.clientId ? 
                        (clients.find(c => c.id === sale.clientId)?.name || sale.clientName) : 
                        'Cliente Avulso'
                      }
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {sale.createdAt.toLocaleDateString('pt-BR')} às {sale.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#28a745'
                    }}>
                      R$ {sale.total.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      backgroundColor: 
                        sale.paymentStatus === 'pago' ? '#d4edda' :
                        sale.paymentStatus === 'parcial' ? '#fff3cd' : '#f8d7da',
                      color:
                        sale.paymentStatus === 'pago' ? '#155724' :
                        sale.paymentStatus === 'parcial' ? '#856404' : '#721c24'
                    }}>
                      {sale.paymentStatus === 'pago' ? '✅ Pago' :
                       sale.paymentStatus === 'parcial' ? '🟡 Parcial' : '🔴 Pendente'}
                    </div>
                  </div>
                </div>

                {/* Produtos */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Produtos:
                  </div>
                  {sale.products.map((product, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      marginBottom: '0.25rem',
                      fontSize: '0.9rem'
                    }}>
                      <span>{product.name} x{product.quantity}</span>
                      <span style={{ fontWeight: 'bold' }}>
                        R$ {(product.price * product.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Informações de Pagamento */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  <div>
                    <strong>Pagamento:</strong><br />
                    {sale.paymentMethod === 'dinheiro' ? '💵 Dinheiro' :
                     sale.paymentMethod === 'pix' ? '📱 PIX' : '📝 Fiado'}
                  </div>
                  <div>
                    <strong>Pago:</strong><br />
                    R$ {sale.paidAmount.toFixed(2)}
                    {sale.remainingAmount > 0 && (
                      <div style={{ color: '#dc3545', fontSize: '0.8rem' }}>
                        Resta: R$ {sale.remainingAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                {sale.notes && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    <strong>Obs:</strong> {sale.notes}
                  </div>
                )}

                {/* Ações */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setEditingSale(sale);
                      setFormData({
                        clientId: sale.clientId || '',
                        clientName: sale.clientName || '',
                        products: sale.products,
                        discount: sale.discount,
                        paymentMethod: sale.paymentMethod,
                        paidAmount: sale.paidAmount,
                        isLoan: sale.isLoan,
                        loanAmount: sale.loanAmount || 0,
                        installmentCount: sale.installmentCount || 1,
                        notes: sale.notes || ''
                      });
                      setShowForm(true);
                    }}
                    style={{
                      padding: '0.75rem',
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
                    onClick={() => deleteSale(sale.id)}
                    style={{
                      padding: '0.75rem',
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
            ))
        )}
      </div>
    </div>
  );
}
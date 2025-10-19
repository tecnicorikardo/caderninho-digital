import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');
  
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Carregar produtos do localStorage
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts).map((product: any) => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }));
        setProducts(parsedProducts);
      }
      
      // Carregar movimentações do localStorage
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

    // Validações
    if (!formData.name || formData.salePrice <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      let productsList = savedProducts ? JSON.parse(savedProducts) : [];
      
      if (editingProduct) {
        // Atualizar produto existente
        productsList = productsList.map((product: any) => 
          product.id === editingProduct.id 
            ? { ...product, ...formData, updatedAt: new Date().toISOString() }
            : product
        );
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const newProduct = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user.uid
        };
        productsList.push(newProduct);
        toast.success('Produto criado com sucesso!');
      }
      
      localStorage.setItem(`products_${user.uid}`, JSON.stringify(productsList));
      
      setShowForm(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error('Erro:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const savedProducts = localStorage.getItem(`products_${user?.uid}`);
      if (savedProducts) {
        const productsList = JSON.parse(savedProducts);
        const filteredProducts = productsList.filter((product: any) => product.id !== productId);
        localStorage.setItem(`products_${user?.uid}`, JSON.stringify(filteredProducts));
      }
      
      toast.success('Produto excluído com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir produto');
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

      // Atualizar quantidade do produto
      const savedProducts = localStorage.getItem(`products_${user.uid}`);
      if (savedProducts) {
        const productsList = JSON.parse(savedProducts);
        const updatedProducts = productsList.map((product: any) => {
          if (product.id === selectedProduct.id) {
            let newQuantity = product.quantity;
            
            if (movementData.type === 'entrada') {
              newQuantity += movementData.quantity;
            } else if (movementData.type === 'saida') {
              newQuantity -= movementData.quantity;
            } else { // ajuste
              newQuantity = movementData.quantity;
            }
            
            return {
              ...product,
              quantity: Math.max(0, newQuantity),
              updatedAt: new Date().toISOString()
            };
          }
          return product;
        });
        localStorage.setItem(`products_${user.uid}`, JSON.stringify(updatedProducts));
      }
      
      toast.success('Movimentação registrada com sucesso!');
      setShowMovementModal(false);
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { status: 'Sem estoque', color: '#dc3545' };
    if (product.quantity <= product.minQuantity) return { status: 'Estoque baixo', color: '#ffc107' };
    return { status: 'Em estoque', color: '#28a745' };
  };

  const getTotalStockValue = () => {
    return products.reduce((total, product) => total + (product.quantity * product.costPrice), 0);
  };

  const getLowStockProducts = () => {
    return products.filter(product => product.quantity <= product.minQuantity);
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>Estoque</h1>
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
        
        <button
          onClick={handleCreateProduct}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '1rem'
          }}
        >
          + Novo Produto
        </button>
      </div>

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
                    value={formData.costPrice === 0 ? '' : formData.costPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, costPrice: 0 }));
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData(prev => ({ ...prev, costPrice: numValue }));
                        }
                      }
                    }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.salePrice === 0 ? '' : formData.salePrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, salePrice: 0 }));
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData(prev => ({ ...prev, salePrice: numValue }));
                        }
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
                      borderRadius: '8px'
                    }}
                  />
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
        products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <h3>Nenhum produto cadastrado</h3>
            <p>Clique em "Novo Produto" para começar</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              const profit = product.salePrice - product.costPrice;
              const profitMargin = product.costPrice > 0 ? ((profit / product.costPrice) * 100) : 0;
              
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
                      <div style={{ fontWeight: '500' }}>R$ {product.costPrice.toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Preço de Venda</div>
                      <div style={{ fontWeight: '500' }}>R$ {product.salePrice.toFixed(2)}</div>
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
                        R$ {(product.quantity * product.costPrice).toFixed(2)}
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
    </div>
  );
}
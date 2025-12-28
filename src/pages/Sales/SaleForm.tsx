import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { saleService } from '../../services/saleService';
import type { Client } from '../../types/client';
import type { Product, SaleFormData } from '../../types/sale';
import toast from 'react-hot-toast';

// Tipo temporário para o formulário que permite quantity como string durante edição
interface FormProduct extends Omit<Product, 'quantity'> {
  quantity: number | string;
}

interface StockProduct {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  sku?: string;
}

interface SaleFormProps {
  clients: Client[];
  products: StockProduct[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function SaleForm({ clients, products, onSuccess, onCancel }: SaleFormProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Omit<SaleFormData, 'products'> & { products: FormProduct[] }>({
    products: [{ id: '1', name: '', price: 0, quantity: 1 }],
    discount: 0,
    paymentMethod: 'dinheiro',
    paidAmount: 0,
    isLoan: false,
    installmentCount: 1
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validações
    if (formData.products.some(p => !p.name || Number(p.price) < 0.01)) {
      toast.error('Preencha todos os produtos corretamente. Preço mínimo: R$ 0,01');
      return;
    }

    try {
      setLoading(true);
      
      // Garantir que todos os valores sejam números
      const processedFormData = {
        ...formData,
        products: formData.products.map(product => ({
          ...product,
          price: Number(product.price) || 0,
          quantity: Number(product.quantity) || 0
        })),
        discount: Number(formData.discount) || 0,
        paidAmount: Number(formData.paidAmount) || 0,
        loanAmount: Number(formData.loanAmount) || 0
      };
      
      await saleService.createSale(processedFormData, user.uid);
      toast.success('Venda criada com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { 
        id: Date.now().toString(), 
        name: '', 
        price: 0, 
        quantity: 1 
      }]
    }));
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.map((product, i) => 
          i === index ? {
            ...product,
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.salePrice
          } : product
        )
      }));
    }
  };

  const subtotal = formData.products.reduce((sum, product) => 
    sum + ((Number(product.price) || 0) * (Number(product.quantity) || 0)), 0
  );
  
  const total = subtotal - (Number(formData.discount) || 0) + (Number(formData.loanAmount) || 0);

  return (
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
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Nova Venda</h2>

        <form onSubmit={handleSubmit}>
          {/* Cliente */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Cliente (opcional)
            </label>
            <select
              value={formData.clientId || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                clientId: e.target.value || undefined,
                clientName: e.target.value ? clients.find(c => c.id === e.target.value)?.name : undefined
              }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Venda sem cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
            
            {!formData.clientId && (
              <input
                type="text"
                placeholder="Nome do cliente (opcional)"
                value={formData.clientName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>

          {/* Produtos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontWeight: '500' }}>Produtos</label>
              <button
                type="button"
                onClick={addProduct}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                + Adicionar Produto
              </button>
            </div>

            {formData.products.map((product, index) => (
              <div key={product.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr auto', 
                gap: '0.5rem', 
                marginBottom: '0.5rem',
                alignItems: 'start'
              }}>
                <div>
                  {products.length > 0 && (
                    <select
                      value={product.id || ''}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e5e9',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Selecione do estoque ou digite abaixo</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - R$ {p.salePrice.toFixed(2)} (Estoque: {p.quantity})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Ou digite o nome do produto"
                    value={product.name}
                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <input
                  type="number"
                  placeholder="Digite o preço"
                  value={product.price || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : e.target.value;
                    updateProduct(index, 'price', value);
                  }}
                  onBlur={(e) => {
                    // Validação só ao sair do campo
                    const numValue = parseFloat(e.target.value);
                    if (isNaN(numValue) || numValue < 0.01) {
                      updateProduct(index, 'price', 0.01);
                    } else if (numValue > 9999) {
                      updateProduct(index, 'price', 9999);
                    }
                  }}
                  step="0.01"
                  required
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="number"
                  placeholder="Qtd"
                  value={product.quantity === 0 || product.quantity === '' ? '' : product.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      updateProduct(index, 'quantity', '');
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue > 0) {
                        updateProduct(index, 'quantity', numValue);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || parseInt(e.target.value) < 1) {
                      updateProduct(index, 'quantity', 1);
                    }
                  }}
                  min="1"
                  required
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px'
                  }}
                />
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
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Desconto */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Desconto (R$)
            </label>
            <input
              type="number"
              value={formData.discount || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setFormData(prev => ({ ...prev, discount: value }));
              }}
              onBlur={(e) => {
                // Validação só ao sair do campo
                const numValue = Number(e.target.value);
                if (isNaN(numValue) || numValue < 0) {
                  setFormData(prev => ({ ...prev, discount: 0 }));
                } else if (numValue > 9999) {
                  setFormData(prev => ({ ...prev, discount: 9999 }));
                }
              }}
              step="0.01"
              placeholder="Digite o desconto"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Empréstimo */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.isLoan}
                onChange={(e) => setFormData(prev => ({ ...prev, isLoan: e.target.checked }))}
              />
              <span style={{ fontWeight: '500' }}>Adicionar empréstimo</span>
            </label>
            
            {formData.isLoan && (
              <input
                type="number"
                placeholder="Digite o valor do empréstimo"
                value={formData.loanAmount || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                  setFormData(prev => ({ ...prev, loanAmount: value }));
                }}
                onBlur={(e) => {
                  // Validação só ao sair do campo
                  const numValue = Number(e.target.value);
                  if (isNaN(numValue) || numValue < 0) {
                    setFormData(prev => ({ ...prev, loanAmount: 0 }));
                  } else if (numValue > 9999) {
                    setFormData(prev => ({ ...prev, loanAmount: 9999 }));
                  }
                }}
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>

          {/* Forma de Pagamento */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Forma de Pagamento
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                paymentMethod: e.target.value as 'dinheiro' | 'pix' | 'fiado'
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
              <option value="fiado">📝 Fiado</option>
            </select>
          </div>

          {/* Parcelas (se fiado) */}
          {formData.paymentMethod === 'fiado' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Número de Parcelas
              </label>
              <input
                type="number"
                value={formData.installmentCount || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, installmentCount: parseInt(e.target.value) || 1 }))}
                min="1"
                max="12"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px'
                }}
              />
            </div>
          )}

          {/* Valor Pago */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Valor Pago Agora (R$)
            </label>
            <input
              type="number"
              value={formData.paidAmount || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setFormData(prev => ({ ...prev, paidAmount: value }));
              }}
              onBlur={(e) => {
                // Validação só ao sair do campo
                const numValue = Number(e.target.value);
                const maxValue = Math.min(total, 9999);
                if (isNaN(numValue) || numValue < 0) {
                  setFormData(prev => ({ ...prev, paidAmount: 0 }));
                } else if (numValue > maxValue) {
                  setFormData(prev => ({ ...prev, paidAmount: maxValue }));
                }
              }}
              step="0.01"
              placeholder="Digite o valor pago"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Observações */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Observações
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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

          {/* Resumo */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem' 
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Resumo da Venda</h4>
            <div>Subtotal: R$ {subtotal.toFixed(2)}</div>
            <div>Desconto: R$ {formData.discount.toFixed(2)}</div>
            {formData.isLoan && <div>Empréstimo: R$ {(formData.loanAmount || 0).toFixed(2)}</div>}
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              Total: R$ {total.toFixed(2)}
            </div>
            <div>Valor Pago: R$ {formData.paidAmount.toFixed(2)}</div>
            <div style={{ color: total - formData.paidAmount > 0 ? '#dc3545' : '#28a745' }}>
              Restante: R$ {(total - formData.paidAmount).toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
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
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Salvando...' : 'Criar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
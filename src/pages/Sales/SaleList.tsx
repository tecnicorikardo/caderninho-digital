import { useState } from 'react';
import type { Sale } from '../../types/sale';
import type { Client } from '../../types/client';
import { PaymentModal } from './PaymentModal';
import { saleService } from '../../services/saleService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SaleListProps {
  sales: Sale[];
  clients: Client[];
  onDelete: (saleId: string) => void;
  onPaymentUpdate: () => void;
}

export function SaleList({ sales, clients, onDelete, onPaymentUpdate }: SaleListProps) {
  const { user } = useAuth();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getClientName = (sale: Sale) => {
    if (sale.clientName) return sale.clientName;
    if (sale.clientId) {
      const client = clients.find(c => c.id === sale.clientId);
      return client?.name || 'Cliente não encontrado';
    }
    return 'Venda sem cliente';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return '#28a745';
      case 'parcial': return '#ffc107';
      case 'pendente': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'dinheiro': return '💵';
      case 'pix': return '📱';
      case 'fiado': return '📝';
      default: return '💳';
    }
  };

  const handleAddPayment = (sale: Sale) => {
    setSelectedSale(sale);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedSale(null);
    onPaymentUpdate();
  };

  const handleDeleteSale = async (saleId: string) => {
    // Confirmar exclusão
    const confirmed = window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      // ✅ Usar função completa do serviço que reverte estoque e remove transações
      await saleService.deleteSaleComplete(saleId, user?.uid || '');
      
      toast.success('Venda excluída com sucesso!');
      onDelete(saleId);
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  if (sales.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#666'
      }}>
        <h3>Nenhuma venda registrada</h3>
        <p>Clique em "Nova Venda" para começar</p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gap: '1rem'
      }}>
        {sales.map((sale) => (
          <div
            key={sale.id}
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
                  Venda #{sale.id.slice(-6)}
                </h3>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                  {sale.createdAt.toLocaleDateString('pt-BR')} às {sale.createdAt.toLocaleTimeString('pt-BR')}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>
                  Cliente: {getClientName(sale)}
                </p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: getPaymentStatusColor(sale.paymentStatus),
                  marginBottom: '0.5rem'
                }}>
                  {sale.paymentStatus.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {getPaymentMethodIcon(sale.paymentMethod)} {sale.paymentMethod.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div style={{ marginBottom: '1rem' }}>
              <strong>Produtos:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                {sale.products.map((product, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.25rem 0',
                    borderBottom: index < sale.products.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <span>{product.name} (x{product.quantity})</span>
                    <span>R$ {(product.price * product.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Valores */}
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
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Subtotal</div>
                <div style={{ fontWeight: '500' }}>R$ {sale.subtotal.toFixed(2)}</div>
              </div>
              
              {sale.discount > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Desconto</div>
                  <div style={{ fontWeight: '500', color: '#dc3545' }}>-R$ {sale.discount.toFixed(2)}</div>
                </div>
              )}
              
              {sale.isLoan && sale.loanAmount && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Empréstimo</div>
                  <div style={{ fontWeight: '500', color: '#17a2b8' }}>+R$ {sale.loanAmount.toFixed(2)}</div>
                </div>
              )}
              
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Total</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>R$ {sale.total.toFixed(2)}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Pago</div>
                <div style={{ fontWeight: '500', color: '#28a745' }}>R$ {sale.paidAmount.toFixed(2)}</div>
              </div>
              
              {sale.remainingAmount > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Restante</div>
                  <div style={{ fontWeight: '500', color: '#dc3545' }}>R$ {sale.remainingAmount.toFixed(2)}</div>
                </div>
              )}
            </div>

            {/* Parcelas (se houver) */}
            {sale.installments && sale.installments.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Parcelas:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {sale.installments.map((installment, index) => (
                    <div key={installment.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.25rem 0',
                      fontSize: '0.9rem'
                    }}>
                      <span>
                        {index + 1}ª parcela - {installment.dueDate.toLocaleDateString('pt-BR')}
                      </span>
                      <span style={{
                        color: installment.status === 'pago' ? '#28a745' : 
                              installment.status === 'atrasado' ? '#dc3545' : '#666'
                      }}>
                        R$ {installment.amount.toFixed(2)} ({installment.status})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {sale.notes && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Observações:</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic', color: '#666' }}>
                  {sale.notes}
                </p>
              </div>
            )}

            {/* Ações */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {sale.remainingAmount > 0 && (
                <button
                  onClick={() => handleAddPayment(sale)}
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
                  💰 Adicionar Pagamento
                </button>
              )}
              
              <button
                onClick={() => handleDeleteSale(sale.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                }}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {showPaymentModal && selectedSale && (
        <PaymentModal
          sale={selectedSale}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}
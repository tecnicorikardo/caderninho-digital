import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { usePayment } from '../../hooks/usePayment';
import { PixPayment } from '../../components/PixPayment';
import toast from 'react-hot-toast';

export function Upgrade() {
  const navigate = useNavigate();
  const { subscription, plans } = useSubscription();
  const { loading: paymentLoading } = usePayment();
  const [months, setMonths] = useState(1); // Default 1 mês
  const [showPremiumForm, setShowPremiumForm] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  
  // Ref para o formulário de pagamento
  const paymentFormRef = useRef<HTMLDivElement>(null);

  const freePlan = plans.find(p => p.id === 'free');
  const premiumPlan = plans.find(p => p.id === 'premium');

  const handleUpgrade = async () => {
    setShowPayment(true);
    toast.success('Pagamento PIX gerado! Use o código copia e cola.');
  };

  const handlePaymentSuccess = () => {
    toast.success('🎉 Pagamento aprovado! Bem-vindo ao Premium!');
    navigate('/');
  };

  const totalAmount = months * 20.00;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', color: '#333' }}>
            💎 Upgrade para Premium
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', margin: 0 }}>
            Desbloqueie todo o potencial do seu negócio
          </p>
        </div>

        {/* Comparação de Planos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Plano Gratuito */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '2px solid #e1e5e9',
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🆓</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Gratuito</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                R$ 0<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mês</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                2 meses grátis
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
              {freePlan?.features.map((feature, index) => (
                <li key={index} style={{
                  padding: '0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: '#28a745' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {subscription?.plan === 'free' && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                Plano Atual
              </div>
            )}
          </div>

          {/* Plano Premium */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,123,255,0.2)',
            border: '2px solid #007bff',
            position: 'relative',
            transform: 'scale(1.05)'
          }}>
            {/* Badge Popular */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#007bff',
              color: 'white',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              RECOMENDADO
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Premium</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                R$ 20<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mês</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Assine quantos meses quiser!
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
              {premiumPlan?.features.map((feature, index) => (
                <li key={index} style={{
                  padding: '0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: '#007bff' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                setShowPremiumForm(true);
                // Scroll suave para o formulário após um pequeno delay
                setTimeout(() => {
                  paymentFormRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }, 100);
              }}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            >
              Escolher Premium
            </button>
          </div>
        </div>

        {/* Formulário de Pagamento */}
        {showPremiumForm && (
          <div 
            ref={paymentFormRef}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              maxWidth: '600px',
              margin: '0 auto',
              scrollMarginTop: '2rem' // Espaço do topo ao fazer scroll
            }}>
            <h3 style={{ margin: '0 0 2rem 0', textAlign: 'center' }}>
              Finalizar Pagamento
            </h3>

            {/* Método de Pagamento */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500' }}>
                Forma de Pagamento
              </label>
              <div style={{ 
                padding: '1.5rem',
                border: '2px solid #32BCAD',
                borderRadius: '12px',
                backgroundColor: '#f0fff0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem', color: '#32BCAD' }}>
                  PIX - Pagamento Instantâneo
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Aprovação imediata • Seguro • Sem taxas
                </div>
              </div>
            </div>

            {/* Seleção de Meses */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500' }}>
                Quantos meses deseja assinar?
              </label>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: 'white',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <button
                  onClick={() => setMonths(prev => Math.max(1, prev - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#f0f0f0',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#333'
                  }}
                >
                  -
                </button>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                    {months} {months === 1 ? 'mês' : 'meses'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    R$ 20,00 / mês
                  </div>
                </div>

                <button
                  onClick={() => setMonths(prev => Math.min(12, prev + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#32BCAD',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  +
                </button>
              </div>

              {/* Distaque de valor total */}
              <div style={{ 
                marginTop: '1rem', 
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                color: '#32BCAD'
              }}>
                Total a pagar: R$ {(months * 20).toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Resumo */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Resumo do Pedido</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Plano Premium ({months} {months === 1 ? 'mês' : 'meses'})</span>
                <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
              </div>

              <hr style={{ margin: '1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                <span>Total</span>
                <span style={{ color: '#32BCAD' }}>
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Interface de Pagamento PIX */}
            {showPayment ? (
              <PixPayment
                amount={totalAmount}
                description={`Plano Premium (${months} ${months === 1 ? 'mês' : 'meses'})`}
                interval="month" // Mesmo sendo N meses, tecnicamente é um ciclo mensal pré-pago
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPayment(false)}
              />
            ) : (
              /* Botões */
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    flex: 1,
                    padding: '1rem',
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
                  onClick={handleUpgrade}
                  disabled={paymentLoading}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    backgroundColor: paymentLoading ? '#ccc' : '#32BCAD',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {paymentLoading ? 'Processando...' : 
                   `📱 Pagar R$ ${totalAmount.toFixed(2).replace('.', ',')} via PIX`}
                </button>
              </div>
            )}

            {/* Garantia */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#d4edda',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#155724'
            }}>
              🛡️ <strong>Garantia de 7 dias</strong><br />
              Não ficou satisfeito? Devolvemos seu dinheiro sem perguntas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
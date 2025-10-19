import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { usePayment } from '../../hooks/usePayment';
import { PixPayment } from '../../components/PixPayment';
import toast from 'react-hot-toast';

export function Upgrade() {
  const navigate = useNavigate();
  const { subscription, plans } = useSubscription();
  const { createSubscriptionPayment, loading: paymentLoading, simulatePaymentSuccess } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const freePlan = plans.find(p => p.id === 'free');
  const premiumPlan = plans.find(p => p.id === 'premium');

  const handleUpgrade = async () => {
    if (paymentMethod === 'pix') {
      setShowPayment(true);
      toast.success('Pagamento PIX gerado! Use o código ou QR Code.');
    } else if (paymentMethod === 'picpay') {
      setLoading(true);
      
      try {
        const payment = await createSubscriptionPayment(selectedPlan);
        
        if (payment) {
          setPaymentData(payment);
          setShowPayment(true);
          toast.success('Pagamento PicPay criado! Escaneie o QR Code.');
        }
      } catch (error) {
        console.error('Erro no pagamento:', error);
        toast.error('Erro ao criar pagamento');
      } finally {
        setLoading(false);
      }
    } else {
      // Outros métodos de pagamento
      toast.info('Método de pagamento em desenvolvimento');
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('🎉 Pagamento aprovado! Bem-vindo ao Premium!');
    navigate('/');
  };

  const handleSimulateSuccess = () => {
    if (paymentData) {
      simulatePaymentSuccess(paymentData.referenceId);
      handlePaymentSuccess();
    }
  };

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
                12 meses grátis
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
                ou R$ 200/ano (2 meses grátis)
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
              onClick={() => setShowPremiumForm(true)}
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
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h3 style={{ margin: '0 0 2rem 0', textAlign: 'center' }}>
              Finalizar Pagamento
            </h3>

            {/* Método de Pagamento */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500' }}>
                Forma de Pagamento
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { id: 'pix', label: '📱 PIX', desc: 'Instantâneo e seguro' },
                  { id: 'picpay', label: '💳 PicPay', desc: 'Em desenvolvimento' },
                  { id: 'card', label: '💳 Cartão', desc: 'Em desenvolvimento' }
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPaymentMethod(method.id);
                    }}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${paymentMethod === method.id ? '#32BCAD' : '#e1e5e9'}`,
                      borderRadius: '8px',
                      backgroundColor: paymentMethod === method.id ? '#f0fff0' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {method.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {method.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Plano */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500' }}>
                Período de Cobrança
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPlan('monthly');
                  }}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${selectedPlan === 'monthly' ? '#007bff' : '#e1e5e9'}`,
                    borderRadius: '8px',
                    backgroundColor: selectedPlan === 'monthly' ? '#f0f8ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    💳 Mensal
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
                    R$ 20,00
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    por mês
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPlan('yearly');
                  }}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${selectedPlan === 'yearly' ? '#28a745' : '#e1e5e9'}`,
                    borderRadius: '8px',
                    backgroundColor: selectedPlan === 'yearly' ? '#f0fff0' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    2 MESES GRÁTIS
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    💎 Anual
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                    R$ 200,00
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    R$ 16,67/mês
                  </div>
                </button>
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
                <span>Plano Premium ({selectedPlan === 'monthly' ? 'mensal' : 'anual'})</span>
                <span>R$ {selectedPlan === 'monthly' ? '20,00' : '200,00'}</span>
              </div>
              {selectedPlan === 'yearly' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#28a745' }}>
                  <span>Desconto anual</span>
                  <span>-R$ 40,00</span>
                </div>
              )}
              {paymentMethod === 'picpay' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Taxa PicPay (2,99%)</span>
                  <span>R$ {selectedPlan === 'monthly' ? '0,60' : '6,00'}</span>
                </div>
              )}
              <hr style={{ margin: '1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                <span>Total</span>
                <span style={{ color: paymentMethod === 'pix' ? '#32BCAD' : '#007bff' }}>
                  R$ {paymentMethod === 'pix' ? 
                      (selectedPlan === 'monthly' ? '20,00' : '200,00') :
                      (selectedPlan === 'monthly' ? '20,60' : '206,00')}
                </span>
              </div>
            </div>

            {/* Interface de Pagamento PIX */}
            {showPayment && paymentMethod === 'pix' ? (
              <PixPayment
                amount={selectedPlan === 'monthly' ? 20.60 : 206.00}
                description={`Plano Premium ${selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}`}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPayment(false)}
              />
            ) : showPayment && paymentData ? (
              <div style={{
                padding: '2rem',
                backgroundColor: '#f0f8ff',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💳</div>
                <h3 style={{ margin: '0 0 1rem 0' }}>Pagamento PicPay</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Escaneie o QR Code ou clique no botão para pagar
                </p>

                {/* QR Code Simulado */}
                <div style={{
                  width: '200px',
                  height: '200px',
                  backgroundColor: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  margin: '0 auto 2rem auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  QR Code PicPay<br />
                  (Simulação)
                </div>

                {/* Botão PicPay */}
                <a
                  href={paymentData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '1rem 2rem',
                    backgroundColor: '#11C76F',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    marginBottom: '1rem'
                  }}
                >
                  💳 Abrir PicPay
                </a>

                {/* Botão para simular sucesso (apenas desenvolvimento) */}
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={handleSimulateSuccess}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🧪 Simular Pagamento Aprovado
                  </button>
                </div>

                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  <strong>Como pagar:</strong><br />
                  1. Abra o app do PicPay<br />
                  2. Escaneie o QR Code<br />
                  3. Confirme o pagamento<br />
                  4. Aguarde a confirmação
                </div>
              </div>
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
                  disabled={loading || paymentLoading}
                  style={{
                    flex: 2,
                    padding: '1rem',
                    backgroundColor: (loading || paymentLoading) ? '#ccc' : 
                                   paymentMethod === 'pix' ? '#32BCAD' : '#11C76F',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (loading || paymentLoading) ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {(loading || paymentLoading) ? 'Processando...' : 
                   paymentMethod === 'pix' ? 
                   `📱 Pagar R$ ${selectedPlan === 'monthly' ? '20,00' : '200,00'} via PIX` :
                   `💳 Pagar R$ ${selectedPlan === 'monthly' ? '20,60' : '206,00'} via PicPay`}
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
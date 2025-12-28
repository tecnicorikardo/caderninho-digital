import { useSubscription } from '../contexts/SubscriptionContext';

interface SubscriptionStatusProps {
  compact?: boolean;
}

export function SubscriptionStatus({ compact = false }: SubscriptionStatusProps) {
  const { 
    subscription, 
    isActive, 
    daysRemaining, 
    upgradeToPremium,
    loading 
  } = useSubscription();

  console.log('🔍 SubscriptionStatus render:', {
    loading,
    subscription: subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      endDate: subscription.endDate?.toLocaleDateString('pt-BR')
    } : null,
    isActive,
    daysRemaining
  });

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '2px solid #e1e5e9',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <div>⏳ Carregando informações da assinatura...</div>
      </div>
    );
  }

  if (!subscription) {
    console.log('⚠️ Subscription is null/undefined');
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '2px solid #ffc107',
        marginBottom: '1rem'
      }}>
        <div style={{ color: '#856404', fontWeight: 'bold', marginBottom: '1rem' }}>
          ⚠️ Carregando informações da assinatura...
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          Se este problema persistir, tente recarregar a página ou fazer logout/login novamente.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => window.location.reload()}
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
            🔄 Recarregar Página
          </button>
          <button
            onClick={() => window.location.href = '/upgrade'}
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
            💎 Ver Planos
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{
        padding: '0.5rem 1rem',
        backgroundColor: isActive ? '#d4edda' : '#f8d7da',
        color: isActive ? '#155724' : '#721c24',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {subscription.plan === 'premium' ? '💎' : '🆓'}
        {subscription.plan === 'premium' ? 'Premium' : `${daysRemaining} dias restantes`}
      </div>
    );
  }

  // Verificar se está realmente ativo baseado nos dias restantes
  const isReallyActive = daysRemaining > 0;

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${isReallyActive ? '#28a745' : '#dc3545'}`,
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {subscription.plan === 'premium' ? '💎' : '🆓'}
            </span>
            <h3 style={{ margin: 0, color: '#333' }}>
              Plano {subscription.plan === 'premium' ? 'Premium' : 'Gratuito'}
            </h3>
            <span style={{
              padding: '0.2rem 0.5rem',
              backgroundColor: isReallyActive ? '#28a745' : '#dc3545',
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              {isReallyActive ? 'ATIVO' : 'EXPIRADO'}
            </span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              fontSize: '1.1rem', 
              color: daysRemaining <= 7 ? '#dc3545' : daysRemaining <= 30 ? '#ff9500' : '#28a745',
              fontWeight: '600',
              marginBottom: '0.5rem' 
            }}>
              ⏰ {daysRemaining > 0 ? (
                daysRemaining === 1 ? '1 dia restante' : `${daysRemaining} dias restantes`
              ) : (
                subscription.plan === 'premium' ? 'Assinatura expirada' : 'Período gratuito expirado'
              )}
            </div>
            
            {/* Barra de progresso */}
            {daysRemaining > 0 && (
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: `${Math.min(100, (daysRemaining / 30) * 100)}%`,
                  height: '100%',
                  backgroundColor: daysRemaining <= 7 ? '#dc3545' : daysRemaining <= 30 ? '#ff9500' : '#28a745',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }} />
              </div>
            )}
            
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              {subscription.plan === 'premium' ? 'Assinatura' : 'Período gratuito'} até: {subscription.endDate.toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {subscription.plan === 'free' && (
          <button
            onClick={upgradeToPremium}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            💎 Upgrade Premium
          </button>
        )}
      </div>

      {/* Avisos */}
      {subscription.plan === 'free' && daysRemaining <= 30 && daysRemaining > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          color: '#856404'
        }}>
          ⚠️ <strong>Seu período gratuito expira em {daysRemaining} dias!</strong>
          <br />
          Faça upgrade para Premium por apenas R$ 20/mês e continue usando todas as funcionalidades.
        </div>
      )}

      {daysRemaining <= 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          🚫 <strong>{subscription.plan === 'premium' ? 'Assinatura expirada!' : 'Período gratuito expirado!'}</strong>
          <br />
          Faça upgrade para Premium para continuar usando o sistema.
        </div>
      )}
    </div>
  );
}
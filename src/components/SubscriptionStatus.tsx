import { useSubscription } from '../contexts/SubscriptionContext';

interface SubscriptionStatusProps {
  compact?: boolean;
}

export function SubscriptionStatus({ compact = false }: SubscriptionStatusProps) {
  const { 
    subscription, 
    usage, 
    isActive, 
    daysRemaining, 
    upgradeToPremium,
    loading 
  } = useSubscription();

  if (loading || !subscription || !usage) {
    return null;
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

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${isActive ? '#28a745' : '#dc3545'}`,
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
              backgroundColor: isActive ? '#28a745' : '#dc3545',
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              {isActive ? 'ATIVO' : 'EXPIRADO'}
            </span>
          </div>

          {subscription.plan === 'free' && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                ⏰ {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Período gratuito expirado'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                Período gratuito até: {subscription.endDate.toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}

          {/* Uso atual */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Vendas este mês</div>
              <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                {usage.salesCount}
                {subscription.plan === 'free' && ' / 1000'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Clientes</div>
              <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                {usage.clientsCount}
                {subscription.plan === 'free' && ' / 500'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Produtos</div>
              <div style={{ fontWeight: 'bold', color: '#ffc107' }}>
                {usage.productsCount}
                {subscription.plan === 'free' && ' / 200'}
              </div>
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

      {!isActive && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          🚫 <strong>Período gratuito expirado!</strong>
          <br />
          Faça upgrade para Premium para continuar usando o sistema.
        </div>
      )}
    </div>
  );
}
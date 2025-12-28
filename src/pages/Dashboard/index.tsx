import { useAuth } from '../../contexts/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '../../components/SubscriptionStatus';
import { FiadosWidget } from '../../components/FiadosWidget';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useDailyStockAlert } from '../../hooks/useDailyStockAlert';
import { MobileButton } from '../../components/MobileButton';
import { QuickActionsFab } from '../../components/QuickActionsFab';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const navigate = useNavigate();
  const { createExpiredTestUser, activatePremiumSubscription, refreshSubscription } = useSubscription();
  
  // Alerta diário de estoque baixo
  useDailyStockAlert();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {
      title: 'Clientes',
      icon: '👥',
      description: 'Gerencie seus clientes',
      route: '/clients',
      color: '#1e3a8a',
      bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    },
    {
      title: 'Vendas',
      icon: '💰',
      description: 'Registre suas vendas',
      route: '/sales',
      color: '#065f46',
      bgGradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
    },
    {
      title: 'Estoque',
      icon: '📦',
      description: 'Controle seus produtos',
      route: '/stock',
      color: '#4338ca',
      bgGradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)'
    },
    {
      title: 'Financeiro',
      icon: '💳',
      description: 'Receitas e despesas',
      route: '/finance',
      color: '#0369a1',
      bgGradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)'
    },
    {
      title: 'Fiados',
      icon: '📝',
      description: 'Gestão de pagamentos',
      route: '/fiados',
      color: '#ca8a04',
      bgGradient: 'linear-gradient(135deg, #ca8a04 0%, #eab308 100%)'
    },
    {
      title: 'Relatórios',
      icon: '📊',
      description: 'Análises e insights',
      route: '/reports',
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)'
    },
    {
      title: 'Configurações',
      icon: '⚙️',
      description: 'Ajustes do sistema',
      route: '/settings',
      color: '#475569',
      bgGradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      padding: isMobile ? '10px' : '20px'
    }}>
      {/* Header responsivo */}
      <header style={{ 
        marginBottom: isMobile ? '1.5rem' : '2rem',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Container Principal */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1.25rem' : '1.5rem 2rem',
          gap: isMobile ? '1rem' : '2rem'
        }}>
          {/* Logo e Título */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '0.75rem' : '1.5rem',
            flex: 1,
            width: '100%'
          }}>
            {/* Textos */}
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: isMobile ? '1.5rem' : '1.8rem',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                lineHeight: 1.2
              }}>
                Bem-vindo ao<br />Caderninho Digital
              </h1>
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                color: '#666', 
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                lineHeight: 1.4
              }}>
                Sua gestão empresarial simplificada
              </p>
            </div>
          </div>
          
          {/* Área do Usuário */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center', 
            gap: '0.75rem',
            width: '100%',
            marginTop: isMobile ? '0.5rem' : '0'
          }}>
            {/* Card do Usuário */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              flex: 1,
              justifyContent: 'flex-start'
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                flexShrink: 0,
                color: 'white'
              }}>
                👤
              </div>
              
              {/* Info do Usuário */}
              <div style={{ 
                textAlign: 'left',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600'
                }}>
                  Olá,
                </div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#1a1d23',
                  fontSize: '0.9rem',
                  marginTop: '0.1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.email?.split('@')[0]}
                </div>
              </div>
            </div>
            
            {/* Botão de Sair */}
            <button
              onClick={handleLogout}
              style={{
                padding: '0.75rem',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px'
              }}
            >
              🚪
            </button>
          </div>
        </div>
      </header>
      
      {/* Status da Assinatura */}
      <SubscriptionStatus />

      {/* Botões de Teste - Remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>🧪 Testes de Assinatura (Desenvolvimento)</h4>
          <div className={isMobile ? 'btn-group-mobile' : ''} style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <MobileButton
              onClick={createExpiredTestUser}
              variant="danger"
              size="sm"
              icon="🔴"
            >
              Simular Conta Expirada
            </MobileButton>
            <MobileButton
              onClick={() => activatePremiumSubscription()}
              variant="success"
              size="sm"
              icon="💎"
            >
              Ativar Premium (30 dias)
            </MobileButton>
            <MobileButton
              onClick={refreshSubscription}
              variant="primary"
              size="sm"
              icon="🔄"
            >
              Atualizar Status
            </MobileButton>
          </div>
        </div>
      )}
      
      {/* Widget de Fiados */}
      <div style={{ marginBottom: '2rem', maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
        <FiadosWidget />
      </div>
      
      {/* Grid de apps inspirado no iOS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: isMobile ? '10px' : '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              padding: isMobile ? '1.25rem 1rem' : '2rem',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: isMobile ? '1/1' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMobile ? 'center' : 'flex-start',
              justifyContent: isMobile ? 'center' : 'flex-start',
              textAlign: isMobile ? 'center' : 'left'
            }}
            onMouseOver={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseOut={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {/* Ícone do app */}
            <div style={{
              width: isMobile ? '50px' : '70px',
              height: isMobile ? '50px' : '70px',
              background: item.bgGradient,
              borderRadius: isMobile ? '14px' : '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '24px' : '32px',
              marginBottom: isMobile ? '0.75rem' : '1.5rem',
              boxShadow: `0 8px 25px ${item.color}40`,
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            
            {/* Conteúdo */}
            <div style={{ width: '100%' }}>
              <h3 style={{ 
                margin: isMobile ? '0 0 0.25rem 0' : '0 0 0.5rem 0',
                fontSize: isMobile ? '1rem' : '1.4rem',
                fontWeight: 'bold',
                color: '#1a1a1a',
                lineHeight: 1.2
              }}>
                {item.title}
              </h3>
              <p style={{ 
                margin: 0, 
                color: '#666',
                fontSize: isMobile ? '0.8rem' : '1rem',
                lineHeight: '1.4',
                display: isMobile ? 'none' : 'block'
              }}>
                {item.description}
              </p>
            </div>
            
            {/* Indicador de navegação - Ocultar no mobile para limpar */}
            {!isMobile && (
              <div style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                width: '8px',
                height: '8px',
                background: item.color,
                borderRadius: '50%',
                opacity: 0.6
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '3rem',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <p style={{ 
          margin: 0, 
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9rem'
        }}>
          📱 Caderninho Digital - Sua gestão empresarial na palma da mão
        </p>
      </div>

      <QuickActionsFab />
    </div>
  );
}
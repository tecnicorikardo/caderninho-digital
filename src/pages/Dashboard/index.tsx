import { useAuth } from '../../contexts/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '../../components/SubscriptionStatus';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {
      title: 'Clientes',
      icon: '👥',
      description: 'Gerencie seus clientes',
      route: '/clients',
      color: '#007AFF',
      bgGradient: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)'
    },
    {
      title: 'Vendas',
      icon: '💰',
      description: 'Registre suas vendas',
      route: '/sales',
      color: '#34C759',
      bgGradient: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)'
    },
    {
      title: 'Estoque',
      icon: '📦',
      description: 'Controle seus produtos',
      route: '/stock',
      color: '#5856D6',
      bgGradient: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)'
    },
    {
      title: 'Financeiro',
      icon: '💳',
      description: 'Receitas e despesas',
      route: '/finance',
      color: '#FF9500',
      bgGradient: 'linear-gradient(135deg, #FF9500 0%, #FFCC02 100%)'
    },
    {
      title: 'Relatórios',
      icon: '📊',
      description: 'Análises e insights',
      route: '/reports',
      color: '#FF2D92',
      bgGradient: 'linear-gradient(135deg, #FF2D92 0%, #FF375F 100%)'
    },
    {
      title: 'Configurações',
      icon: '⚙️',
      description: 'Ajustes do sistema',
      route: '/settings',
      color: '#8E8E93',
      bgGradient: 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header responsivo */}
      <header style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '1rem' : '0',
        marginBottom: '2rem',
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Logo e título */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: isMobile ? '40px' : '50px',
            height: isMobile ? '40px' : '50px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '20px' : '24px'
          }}>
            📓
          </div>
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: isMobile ? '1.4rem' : '1.8rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              Caderninho Digital
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#666', 
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              Sua gestão empresarial simplificada
            </p>
          </div>
        </div>
        
        {/* Controles do usuário */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '1rem' : '1.5rem',
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
          {/* Info do usuário */}
          {isMobile ? (
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666',
              textAlign: 'center',
              flex: '1'
            }}>
              👋 {user?.email?.split('@')[0]}
            </div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Bem-vindo,</div>
              <div style={{ fontWeight: 'bold', color: '#333' }}>{user?.email?.split('@')[0]}</div>
            </div>
          )}
          
          {/* Botão de sair */}
          <button 
            onClick={handleLogout}
            style={{
              padding: isMobile ? '0.75rem 1.25rem' : '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: isMobile ? '0.9rem' : '0.9rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 59, 48, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 59, 48, 0.3)';
            }}
          >
            {isMobile ? 'Sair' : 'Sair'}
          </button>
        </div>
      </header>
      
      {/* Status da Assinatura */}
      <SubscriptionStatus />
      
      {/* Grid de apps inspirado no iOS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Ícone do app */}
            <div style={{
              width: '70px',
              height: '70px',
              background: item.bgGradient,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '1.5rem',
              boxShadow: `0 8px 25px ${item.color}40`
            }}>
              {item.icon}
            </div>
            
            {/* Conteúdo */}
            <div>
              <h3 style={{ 
                margin: '0 0 0.5rem 0',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}>
                {item.title}
              </h3>
              <p style={{ 
                margin: 0, 
                color: '#666',
                fontSize: '1rem',
                lineHeight: '1.4'
              }}>
                {item.description}
              </p>
            </div>
            
            {/* Indicador de navegação */}
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
    </div>
  );
}
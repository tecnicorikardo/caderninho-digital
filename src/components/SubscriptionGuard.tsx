import type { ReactNode } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature?: string;
}

export function SubscriptionGuard({ children, feature = 'esta funcionalidade' }: SubscriptionGuardProps) {
  const { subscription, isActive } = useSubscription();
  const navigate = useNavigate();

  // Se não há assinatura ou está expirada, mostrar bloqueio
  if (!isActive || subscription?.status === 'expired') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            color: '#dc3545',
            fontSize: '1.8rem'
          }}>
            Conta Expirada
          </h2>
          
          <p style={{ 
            color: '#666', 
            marginBottom: '2rem',
            fontSize: '1.1rem',
            lineHeight: '1.5'
          }}>
            Sua assinatura expirou em{' '}
            <strong>{subscription?.endDate?.toLocaleDateString('pt-BR')}</strong>.
            <br/><br/>
            Para continuar usando {feature}, renove sua assinatura.
          </p>

          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fff3cd',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #ffc107'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#856404' }}>
              🎯 Com o Premium você terá:
            </div>
            <div style={{ fontSize: '0.95rem', color: '#856404', textAlign: 'left' }}>
              ✅ Vendas ilimitadas<br/>
              ✅ Clientes ilimitados<br/>
              ✅ Produtos ilimitados<br/>
              ✅ Relatórios avançados<br/>
              ✅ Backup automático<br/>
              ✅ Suporte prioritário
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ← Voltar
            </button>
            
            <button
              onClick={() => navigate('/upgrade')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #32BCAD 0%, #28a745 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(50, 188, 173, 0.3)'
              }}
            >
              💎 Renovar Agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
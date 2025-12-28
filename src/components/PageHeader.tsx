import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowSize } from '../hooks/useWindowSize';
import { MobileButton } from './MobileButton';

interface PageHeaderProps {
  title: string;
  icon?: string;
  subtitle?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
}

export function PageHeader({ 
  title, 
  icon, 
  subtitle, 
  actions,
  showBackButton = true 
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();

  return (
    <div style={{
      marginBottom: '2rem',
      background: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Título e Subtítulo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: actions || showBackButton ? '1rem' : '0'
      }}>
        {icon && (
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            lineHeight: 1
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: '#1a1d23'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: '#666'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      {(actions || showBackButton) && (
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.75rem' : '1rem',
          alignItems: isMobile ? 'stretch' : 'center',
          flexWrap: 'wrap'
        }}>
          {showBackButton && (
            <MobileButton
              onClick={() => navigate('/')}
              variant="secondary"
              icon="←"
              size="sm"
              style={{
                order: isMobile ? 1 : 0,
                flex: isMobile ? '0' : '0 0 auto'
              }}
            >
              Dashboard
            </MobileButton>
          )}
          
          {actions && (
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.75rem' : '1rem',
              flex: 1,
              order: isMobile ? 0 : 1
            }}>
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

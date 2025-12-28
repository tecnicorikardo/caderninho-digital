import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function QuickActionsFab() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const fabRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const actions = [
    {
      title: 'Nova Venda',
      icon: '💰',
      route: '/sales',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    },
    {
      title: 'Novo Cliente',
      icon: '👥',
      route: '/clients',
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
    },
    {
      title: 'Novo Produto',
      icon: '📦',
      route: '/stock',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
    }
  ];

  return (
    <div 
      ref={fabRef}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '1rem'
      }}
    >
      {/* Menu Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '0.5rem',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transformOrigin: 'bottom right'
      }}>
        {actions.map((action, index) => (
          <div 
            key={index}
            onClick={() => {
              navigate(action.route);
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
              padding: '0.5rem',
              justifyContent: 'flex-end'
            }}
          >
            {/* Label */}
            <div style={{
              background: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#333',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap'
            }}>
              {action.title}
            </div>
            
            {/* Button */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: action.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'white',
              boxShadow: `0 4px 12px ${action.color}66`,
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {action.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          border: 'none',
          color: 'white',
          fontSize: '2rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1)' : 'scale(1)'}
      >
        +
      </button>
    </div>
  );
}

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import './MobileNavigation.css';

interface NavigationItem {
  path: string;
  icon: string;
  label: string;
}

const navigationItems: NavigationItem[] = [
  { path: '/', icon: '🏠', label: 'Início' },
  { path: '/sales', icon: '💰', label: 'Vendas' },
  { path: '/stock', icon: '📦', label: 'Estoque' },
  { path: '/clients', icon: '👥', label: 'Clientes' },
  { path: '/reports', icon: '📊', label: 'Relatórios' }
];

export function MobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = Capacitor.isNativePlatform();

  // Não mostrar na web ou na página de login
  if (!isMobile || location.pathname === '/login') {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Header com botão voltar */}
      <div className="mobile-header">
        <button 
          className="back-button"
          onClick={handleBack}
          aria-label="Voltar"
        >
          ← Voltar
        </button>
        <h1 className="page-title">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* Navegação bottom */}
      <nav className="mobile-bottom-nav">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Espaçador para não sobrepor conteúdo */}
      <div className="mobile-nav-spacer" />
    </>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/sales': 'Vendas',
    '/stock': 'Estoque',
    '/clients': 'Clientes',
    '/finance': 'Financeiro',
    '/fiados': 'Fiados',
    '/reports': 'Relatórios',
    '/settings': 'Configurações',
    '/upgrade': 'Upgrade',
    '/admin': 'Admin'
  };
  
  return titles[pathname] || 'Caderninho Digital';
}
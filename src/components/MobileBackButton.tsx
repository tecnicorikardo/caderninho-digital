import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import './MobileBackButton.css';

interface MobileBackButtonProps {
  label?: string;
  fallbackPath?: string;
  className?: string;
}

export function MobileBackButton({ 
  label = 'Voltar', 
  fallbackPath = '/',
  className = ''
}: MobileBackButtonProps) {
  const navigate = useNavigate();
  const isMobile = Capacitor.isNativePlatform();

  // Só mostrar no mobile
  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button 
      className={`mobile-back-btn ${className}`}
      onClick={handleBack}
      aria-label={label}
    >
      <span className="back-icon">←</span>
      <span className="back-text">{label}</span>
    </button>
  );
}

// Hook para usar em qualquer componente
export function useMobileBack(fallbackPath: string = '/') {
  const navigate = useNavigate();
  
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return { goBack, isMobile: Capacitor.isNativePlatform() };
}
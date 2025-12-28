import React, { ReactNode } from 'react';
import { MobileBackButton } from './MobileBackButton';
import { Capacitor } from '@capacitor/core';
import './MobileModalWrapper.css';

interface MobileModalWrapperProps {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function MobileModalWrapper({
  children,
  title,
  onClose,
  showBackButton = true,
  className = ''
}: MobileModalWrapperProps) {
  const isMobile = Capacitor.isNativePlatform();

  if (!isMobile) {
    // Na web, retorna apenas o conteúdo sem wrapper
    return <>{children}</>;
  }

  return (
    <div className={`mobile-modal-wrapper ${className}`}>
      {/* Header do modal mobile */}
      <div className="mobile-modal-header">
        {showBackButton && (
          <MobileBackButton 
            label="Fechar"
            className="outline"
          />
        )}
        {title && <h2 className="mobile-modal-title">{title}</h2>}
        {onClose && (
          <button 
            className="mobile-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Conteúdo do modal */}
      <div className="mobile-modal-content">
        {children}
      </div>
    </div>
  );
}
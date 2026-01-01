import React, { useRef } from 'react';
import { MobileButton } from './MobileButton';
import { useWindowSize } from '../hooks/useWindowSize';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

export function ReceiptModal({ isOpen, onClose, htmlContent }: ReceiptModalProps) {
  const { isMobile } = useWindowSize();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000, // Maior que outros modais
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div 
        className="receipt-modal-content"
        style={{
          backgroundColor: 'white',
          padding: isMobile ? '1.5rem' : '2rem',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '450px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '0.5rem'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.25rem' }}>🖨️ Visualizar Recibo</h2>
          <MobileButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            style={{
              minWidth: '36px',
              padding: '0.4rem',
              fontSize: '1.2rem',
              lineHeight: 1
            }}
          >
            ✕
          </MobileButton>
        </div>

        {/* Content Area - Scrollable */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          marginBottom: '1rem',
          backgroundColor: '#f9f9f9',
          border: '1px solid #ddd',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          {/* Iframe invisível para impressão real */}
          <iframe 
            ref={iframeRef}
            srcDoc={htmlContent}
            style={{ 
              display: 'none' // Invisível, usado apenas para o comando print()
            }} 
          />
          
          {/* Visualização HTML para o usuário ver antes de imprimir */}
          <div 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
            style={{
              transform: 'scale(0.9)',
              transformOrigin: 'top center',
              width: '100%'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <MobileButton
            onClick={onClose}
            variant="secondary"
            style={{ flex: 1 }}
          >
            Fechar
          </MobileButton>
          <MobileButton
            onClick={handlePrint}
            variant="primary"
            icon="🖨️"
            style={{ flex: 2 }}
          >
            Imprimir Agora
          </MobileButton>
        </div>
      </div>
    </div>
  );
}

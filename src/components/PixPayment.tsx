import { useState } from 'react';
import toast from 'react-hot-toast';

interface PixPaymentProps {
  amount: number;
  description: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PixPayment({ amount, description, onSuccess, onCancel }: PixPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Código PIX Copia e Cola
  const pixCode = '00020126330014br.gov.bcb.pix0111105797697045204000053039865802BR5922RICARDO MARTINS SANTOS6009Sao Paulo62290525REC68F3B5314E1620027521096304AC64';

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      toast.success('Código PIX copiado!');
    } catch (error) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = pixCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Código PIX copiado!');
    }
  };

  const handlePaymentConfirmation = () => {
    setLoading(true);
    
    // Simula confirmação do pagamento
    setTimeout(() => {
      toast.success('🎉 Pagamento confirmado! Bem-vindo ao Premium!');
      onSuccess?.();
      setLoading(false);
    }, 2000);
  };

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f0f8ff',
      borderRadius: '12px',
      textAlign: 'center',
      border: '2px solid #32BCAD'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
      
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
        Pagamento PIX
      </h3>
      
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        {description}
      </p>
      
      <div style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#32BCAD',
        marginBottom: '2rem'
      }}>
        R$ {amount.toFixed(2).replace('.', ',')}
      </div>

      {/* QR Code Simulado */}
      <div style={{
        width: '200px',
        height: '200px',
        backgroundColor: 'white',
        border: '2px solid #ddd',
        borderRadius: '8px',
        margin: '0 auto 2rem auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        color: '#666',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '4rem' }}>📱</div>
        <div>QR Code PIX</div>
        <div style={{ fontSize: '0.8rem' }}>Escaneie com seu banco</div>
      </div>

      {/* Código PIX */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Código PIX Copia e Cola:
        </div>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '0.75rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          wordBreak: 'break-all',
          marginBottom: '1rem',
          fontFamily: 'monospace'
        }}>
          {pixCode}
        </div>
        <button
          onClick={copyPixCode}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#32BCAD',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          📋 Copiar Código PIX
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Cancelar
        </button>
        
        <button
          onClick={handlePaymentConfirmation}
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Confirmando...' : '✅ Já Paguei'}
        </button>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <strong>Como pagar:</strong><br />
        1. Abra o app do seu banco<br />
        2. Escaneie o QR Code ou cole o código PIX<br />
        3. Confirme o pagamento de R$ {amount.toFixed(2).replace('.', ',')}<br />
        4. Clique em "Já Paguei" após confirmar
      </div>
    </div>
  );
}
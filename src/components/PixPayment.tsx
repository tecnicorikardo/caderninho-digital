import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

interface PixPaymentProps {
  amount: number;
  description: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PixPayment({ amount, description, onSuccess, onCancel }: PixPaymentProps) {
  const [loading, setLoading] = useState(false);
  // const [showQR, setShowQR] = useState(false); // Não utilizado no momento
  const { activatePremiumSubscription } = useSubscription();
  
  // Código PIX Copia e Cola
  const pixCode = '00020126330014br.gov.bcb.pix0111105797697045204000053039865802BR5922RICARDO MARTINS SANTOS6008BRASILIA62070503***6304D91F';

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

  const handlePaymentConfirmation = async () => {
    setLoading(true);
    
    try {
      // Simula confirmação do pagamento e ativa premium
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simula processamento
      
      // Ativar assinatura premium com o valor pago
      await activatePremiumSubscription(amount);
      
      // Mensagem já é mostrada pela função activatePremiumSubscription
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao ativar premium. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      borderRadius: '20px',
      textAlign: 'center',
      border: '2px solid #32BCAD',
      boxShadow: '0 8px 32px rgba(50, 188, 173, 0.2)'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💳</div>
      
      <h2 style={{ 
        margin: '0 0 1rem 0', 
        color: '#32BCAD',
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>
        Pagamento PIX
      </h2>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '1rem',
        fontSize: '1.1rem'
      }}>
        {description}
      </p>
      
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#32BCAD',
        marginBottom: '2rem',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        R$ {amount.toFixed(2).replace('.', ',')}
      </div>

      {/* Instruções PIX */}
      <div style={{
        backgroundColor: 'rgba(50, 188, 173, 0.1)',
        padding: '1.5rem',
        borderRadius: '12px',
        margin: '0 auto 2rem auto',
        border: '1px solid rgba(50, 188, 173, 0.3)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💳</div>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
          Como pagar com PIX:
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666', textAlign: 'left', lineHeight: '1.5' }}>
          1. Copie o código PIX abaixo<br/>
          2. Abra o app do seu banco<br/>
          3. Escolha a opção "PIX Copia e Cola"<br/>
          4. Cole o código e confirme o pagamento
        </div>
      </div>

      {/* Código PIX */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '2px solid #32BCAD',
        boxShadow: '0 4px 15px rgba(50, 188, 173, 0.2)'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          fontSize: '1.2rem',
          color: '#32BCAD'
        }}>
          📋 Código PIX Copia e Cola
        </div>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          wordBreak: 'break-all',
          marginBottom: '1.5rem',
          fontFamily: 'monospace',
          border: '1px solid #e1e5e9',
          maxHeight: '120px',
          overflow: 'auto'
        }}>
          {pixCode}
        </div>
        
        <button
          onClick={copyPixCode}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #32BCAD 0%, #28a745 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            width: '100%',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(50, 188, 173, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(50, 188, 173, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(50, 188, 173, 0.3)';
          }}
        >
          📋 Copiar Código PIX
        </button>
        
        <div style={{
          marginTop: '1rem',
          fontSize: '0.9rem',
          color: '#666',
          fontStyle: 'italic'
        }}>
          💡 Após copiar, cole no seu app bancário na opção "PIX Copia e Cola"
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ❌ Cancelar
        </button>
        
        <button
          onClick={handlePaymentConfirmation}
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: loading ? 'none' : '0 4px 15px rgba(40, 167, 69, 0.3)'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
            }
          }}
        >
          {loading ? '⏳ Confirmando...' : '✅ Já Paguei'}
        </button>
      </div>

      <div style={{
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '12px',
        fontSize: '0.95rem',
        color: '#666',
        border: '1px solid rgba(50, 188, 173, 0.2)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#32BCAD' }}>
          📋 Instruções de Pagamento:
        </div>
        1. Copie o código PIX acima<br />
        2. Abra o app do seu banco<br />
        3. Escolha "PIX Copia e Cola"<br />
        4. Cole o código e confirme R$ {amount.toFixed(2).replace('.', ',')}<br />
        5. Clique em "✅ Já Paguei" após confirmar
      </div>
    </div>
  );
}
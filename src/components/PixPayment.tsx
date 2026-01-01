import { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';

interface PixPaymentProps {
  amount: number;
  description: string;
  interval: 'monthly' | 'yearly'; // Novo prop
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PixPayment({ amount, description, interval, onSuccess, onCancel }: PixPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string; paymentId: string } | null>(null);
  const { requestPremiumActivation } = useSubscription();
  const [requestSent, setRequestSent] = useState(false);

  // Gerar cobrança automaticamente ao abrir
  useEffect(() => {
    generatePixCharge();
  }, []);

  const generatePixCharge = async () => {
    setLoading(true);
    try {
      // Obter token do usuário autenticado
      const user = auth.currentUser;
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const token = await user.getIdToken();

      console.log('🔄 Iniciando geração PIX...', JSON.stringify({ amount, description }));
      console.log('🏦 Usando PagarMe API - Versão 2025');

      // Fazer requisição HTTP direta para a function PagarMe com timestamp para quebrar cache
      const timestamp = Date.now();
      const response = await fetch(`https://us-central1-bloquinhodigital.cloudfunctions.net/createPagarMeCharge?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          description: description,
          paymentMethod: 'PIX',
          interval: interval // Enviar intervalo para criar assinatura correto
        })
      });

      console.log('📡 Response status:', response.status);


        if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch {
            errorData = { error: errorText };
        }

        console.error('❌ Response error:', errorData);

        // Debug: Mostrar erro completo para o usuário
        if (errorData.debug) {
             const debugInfo = JSON.stringify(errorData.debug, null, 2);
             alert(`Erro PagarMe:\n${debugInfo}`);
        } else {
             alert(`Erro: ${errorData.error || 'Erro desconhecido'}`);
        }

        if (response.status === 400 && errorData.code === 'MISSING_CPF') {
            // Redirecionar para configurações
            setTimeout(() => {
                window.location.href = '/settings';
            }, 1000);
            return;
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorText}`);
      }

      const data = await response.json();
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ PIX gerado com sucesso:', JSON.stringify({
          hasQrCode: !!data.qrCode,
          qrCodeLength: data.qrCode ? data.qrCode.length : 0,
          hasCopyPaste: !!data.copyPaste,
          copyPasteLength: data.copyPaste ? data.copyPaste.length : 0,
          paymentId: data.paymentId
        }, null, 2));
        
        setPixData({
          qrCode: data.qrCode,
          copyPaste: data.copyPaste,
          paymentId: data.paymentId
        });
        toast.success('Cobrança PIX gerada com sucesso!');
      } else {
        console.error('❌ Resposta sem sucesso:', data);
        toast.error('Erro ao gerar cobrança.');
      }
    } catch (error) {
      console.error('❌ Erro ao chamar createAsaasCharge:', error);
      toast.error('Não foi possível gerar a cobrança no momento.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.copyPaste) return;

    try {
      await navigator.clipboard.writeText(pixData.copyPaste);
      toast.success('Código PIX copiado!');
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = pixData.copyPaste;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Código PIX copiado!');
    }
  };

  // Botão "Já Paguei" ainda é útil para solicitar ativação imediata enquanto o webhook não processa
  const handlePaymentConfirmation = async () => {
    setLoading(true);
    
    try {
      // Enviar solicitação de ativação
      await requestPremiumActivation(amount, 'pix');
      setRequestSent(true);
    } catch (error) {
      toast.error('Erro ao enviar solicitação.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (requestSent) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#e8f5e9',
        borderRadius: '16px',
        border: '2px solid #28a745'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
        <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>Solicitação Enviada!</h2>
        <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '2rem' }}>
          O sistema está verificando seu pagamento.
          <br />Assim que confirmado pelo banco, seu plano será ativado automaticamente.
        </p>

        <a 
          href={`https://wa.me/5521970902074?text=Olá, fiz o pagamento do PIX ID: ${pixData?.paymentId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            backgroundColor: '#25D366',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
          }}
        >
          <span>📱</span> Enviar Comprovante
        </a>
        
        <button
          onClick={onCancel}
          style={{
            display: 'block',
            margin: '2rem auto 0',
            background: 'none',
            border: 'none',
            color: '#666',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Fechar
        </button>
      </div>
    );
  }

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

      {loading && !pixData ? (
        <div style={{ padding: '2rem', color: '#666' }}>
          Gerando QR Code exclusivo... ⏳
        </div>
      ) : pixData ? (
        <>
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
              📋 QR Code Dinâmico
            </div>
            
            {/* Exibir QR Code do PagarMe */}
            {pixData.qrCode && (
              <div style={{ marginBottom: '1rem' }}>
                <img 
                  src={pixData.qrCode} 
                  alt="QR Code PIX" 
                  style={{ width: '200px', height: '200px', marginBottom: '1rem' }}
                />
              </div>
            )}

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
              {pixData.copyPaste}
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
            >
              📋 Copiar Código PIX
            </button>
          </div>
        </>
      ) : (
         <div style={{ padding: '2rem', color: '#d32f2f' }}>
          Erro ao gerar QR Code. Tente novamente.
          <button onClick={generatePixCharge} style={{ display: 'block', margin: '1rem auto' }}>
            Tentar Novamente
          </button>
        </div>
      )}

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
        >
          ❌ Cancelar
        </button>
        
        <button
          onClick={handlePaymentConfirmation}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
          }}
        >
          ✅ Já Paguei
        </button>
      </div>
    </div>
  );
}
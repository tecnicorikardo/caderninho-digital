import React, { useState } from 'react';
import { sendReportByEmail, isValidEmail } from '../services/emailService';
import { MobileEmailService } from '../services/mobileEmailService';
import { Capacitor } from '@capacitor/core';
import colors from '../styles/colors';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'sales' | 'stock' | 'fiados' | 'general';
  reportData: any;
  defaultSubject?: string;
}

const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  reportData,
  defaultSubject,
}) => {
  // Carregar email salvo do localStorage
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('userReportEmail') || '';
  });
  const [subject, setSubject] = useState(defaultSubject || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saveEmail, setSaveEmail] = useState(true);

  const handleSendEmail = async () => {
    // Validações
    if (!email.trim()) {
      setError('Por favor, informe um email');
      return;
    }

    if (!MobileEmailService.isValidEmail(email)) {
      setError('Email inválido');
      return;
    }

    console.log('📧 EmailReportModal - Enviando email...');
    console.log('📊 Tipo de relatório:', reportType);
    console.log('📊 Dados do relatório:', reportData);
    console.log('📱 Plataforma:', Capacitor.getPlatform());

    setLoading(true);
    setError('');

    try {
      // Usar serviço inteligente que funciona em todas as plataformas
      const result = await MobileEmailService.sendEmail({
        to: email,
        subject: subject || `Relatório ${reportType} - Caderninho Digital`,
        reportType,
        reportData,
      });
      
      console.log('✅ Email processado:', result);

      // Salvar email se o usuário quiser
      if (saveEmail) {
        localStorage.setItem('userReportEmail', email);
      } else {
        localStorage.removeItem('userReportEmail');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSubject('');
      }, 3000); // Mais tempo para ler a mensagem
    } catch (err: any) {
      console.error('❌ Erro ao processar email:', err);
      setError(err.message || 'Erro ao processar email');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, color: colors.text.primary }}>
          📧 Enviar Relatório por Email
        </h2>

        {success ? (
          <div
            style={{
              padding: '1rem',
              backgroundColor: colors.success.bg,
              color: colors.success.default,
              borderRadius: '6px',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            ✅ Email enviado com sucesso!
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: colors.text.primary,
                }}
              >
                Email do destinatário *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={saveEmail}
                  onChange={(e) => setSaveEmail(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Lembrar meu email
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: colors.text.primary,
                }}
              >
                Assunto (opcional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto do email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: colors.danger.bg,
                  color: colors.danger.default,
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '6px',
                  backgroundColor: colors.bg.secondary,
                  color: colors.text.primary,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: loading
                    ? colors.text.disabled
                    : colors.accent.default,
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {loading ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailReportModal;

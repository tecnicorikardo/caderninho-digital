import { useState } from 'react';
import * as React from 'react';
import { useAuth } from '../contexts/AuthContext';

import { sendMessageToAIWithContext } from '../services/aiService';
import { getUserBusinessData, formatBusinessDataForAI } from '../services/userDataService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou seu assistente virtual do Caderninho Digital. Como posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll automático para a última mensagem
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    // Scroll imediato após enviar
    setTimeout(() => scrollToBottom(), 100);

    try {
      console.log('🤖 Enviando para Groq AI:', userInput);
      
      // Buscar dados reais do usuário (negócio)
      console.log('📊 Buscando dados do negócio...');
      const businessData = await getUserBusinessData(user.uid);
      
      const fullContext = formatBusinessDataForAI(businessData);
      
      console.log('✅ Dados carregados - Negócio:', businessData);
      console.log('📝 Contexto completo formatado');
      
      // Usar Groq API com contexto dos dados reais (negócio)
      const response = await sendMessageToAIWithContext(userInput, fullContext);
      
      console.log('✅ Resposta recebida da Gemini:', response.substring(0, 50) + '...');
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Scroll após receber resposta
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          zIndex: 999,
          transition: 'all 0.3s ease',
          animation: isOpen ? 'none' : 'pulse 2s infinite'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Modal do chat */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '6rem',
          right: '2rem',
          width: '400px',
          maxWidth: 'calc(100vw - 4rem)',
          height: '600px',
          maxHeight: 'calc(100vh - 10rem)',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 998,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '16px 16px 0 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '2rem' }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Assistente IA</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Powered by Groq ⚡
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#f8f9fa'
          }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '0.75rem 1rem',
                  borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: message.role === 'user' ? '#667eea' : 'white',
                  color: message.role === 'user' ? 'white' : '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {message.content}
                  <div style={{
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    marginTop: '0.25rem'
                  }}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="dot-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Referência para scroll automático */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #e1e5e9',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e5e9'}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: input.trim() && !loading ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
              >
                📤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animação de pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          }
          50% {
            box-shadow: 0 4px 30px rgba(102, 126, 234, 0.8);
          }
        }

        .dot-pulse {
          display: flex;
          gap: 0.25rem;
        }

        .dot-pulse::before,
        .dot-pulse::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #667eea;
          animation: dotPulse 1.4s infinite ease-in-out;
        }

        .dot-pulse::before {
          animation-delay: -0.32s;
        }

        .dot-pulse::after {
          animation-delay: -0.16s;
        }

        @keyframes dotPulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

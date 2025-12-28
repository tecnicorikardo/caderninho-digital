import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';

export function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, signUp, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Carregar email salvo ao inicializar
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    // Validação para cadastro
    if (!isLoginMode) {
      if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }
      if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
      }
    }

    try {
      if (isLoginMode) {
        await signIn(email, password);
        // Salvar email se "lembrar" estiver marcado
        if (rememberEmail) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
      } else {
        await signUp(email, password);
      }
      navigate('/');
    } catch (error) {
      // Erro já tratado no contexto
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setPassword('');
    setConfirmPassword('');
    setShowForgotPassword(false);
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Digite seu email para recuperar a senha');
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('Email não encontrado. Verifique se está correto.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email inválido. Verifique o formato.');
      } else {
        toast.error('Erro ao enviar email de recuperação. Tente novamente.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* Logo do App */}
          <div style={{ marginBottom: '1.5rem' }}>
            <img 
              src="/icon-192.png" 
              alt="Caderninho Digital" 
              style={{ 
                width: '100px', 
                height: '100px',
                borderRadius: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }} 
            />
          </div>
          
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
            {showForgotPassword ? 'Recuperar Senha' : (isLoginMode ? 'Entrar' : 'Criar Conta')}
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            {showForgotPassword 
              ? 'Digite seu email para receber o link de recuperação' 
              : (isLoginMode ? 'Acesse sua conta' : 'Crie sua nova conta')
            }
          </p>
        </div>

        {showForgotPassword ? (
          // Formulário de Recuperação de Senha
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Email
              </label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Digite seu email cadastrado"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            <button 
              type="submit"
              disabled={resetLoading}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: resetLoading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '1rem'
              }}
            >
              {resetLoading ? 'Enviando...' : '📧 Enviar Link de Recuperação'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Voltar ao login
              </button>
            </div>
          </form>
        ) : (
          // Formulário Normal de Login/Cadastro
          <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div style={{ marginBottom: isLoginMode ? '1rem' : '1rem' }}>
            <label htmlFor="password" style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Senha
            </label>
            <input 
              type="password" 
              id="password" 
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          {!isLoginMode && (
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="confirmPassword" style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Confirmar Senha
              </label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>
          )}

          {isLoginMode && (
            <div style={{ 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <input 
                type="checkbox" 
                id="rememberEmail"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                style={{ margin: 0 }}
              />
              <label htmlFor="rememberEmail" style={{ 
                fontSize: '0.9rem',
                color: '#666',
                cursor: 'pointer'
              }}>
                Lembrar email
              </label>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '1rem'
            }}
            onMouseOver={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0056b3';
            }}
            onMouseOut={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#007bff';
            }}
          >
            {loading 
              ? (isLoginMode ? 'Entrando...' : 'Criando conta...') 
              : (isLoginMode ? 'Entrar' : 'Criar Conta')
            }
          </button>

          {/* Link Esqueci minha senha - apenas no modo login */}
          {isLoginMode && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                🔑 Esqueci minha senha
              </button>
            </div>
          )}
        </form>
        )}

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
            {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLoginMode ? 'Criar nova conta' : 'Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
}
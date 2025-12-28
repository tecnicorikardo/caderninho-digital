import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function SimpleReports() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Relatórios - Teste</h1>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        ← Voltar ao Dashboard
      </button>
      
      <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>Teste de Funcionamento</h2>
        <p>Se você está vendo esta página, o roteamento está funcionando.</p>
        <p>Usuário logado: {user?.email || 'Não logado'}</p>
      </div>
    </div>
  );
}
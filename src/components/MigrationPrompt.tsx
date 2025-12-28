import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  migrateAllDataToFirebase, 
  hasDataToMigrate, 
  cleanupLocalStorageAfterMigration,
  type MigrationResult 
} from '../utils/migrateToFirebase';

export function MigrationPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    if (user) {
      // Verificar se já foi feita a migração
      const migrationCompleted = localStorage.getItem(`migration_completed_${user.uid}`);
      
      if (!migrationCompleted && hasDataToMigrate(user.uid)) {
        setShowPrompt(true);
      }
    }
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;

    try {
      setMigrating(true);
      
      const result: MigrationResult = await migrateAllDataToFirebase(user.uid);
      
      if (result.success) {
        // Marcar migração como concluída
        localStorage.setItem(`migration_completed_${user.uid}`, 'true');
        
        // Limpar localStorage (com backup)
        cleanupLocalStorageAfterMigration(user.uid, result);
        
        setMigrationDone(true);
        
        // Fechar prompt após 3 segundos
        setTimeout(() => {
          setShowPrompt(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro na migração:', error);
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    if (user) {
      // Lembrar que o usuário dispensou o prompt
      localStorage.setItem(`migration_dismissed_${user.uid}`, 'true');
    }
    setShowPrompt(false);
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Mostrar novamente em 24 horas
    if (user) {
      const remindAt = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem(`migration_remind_${user.uid}`, remindAt.toString());
    }
  };

  if (!showPrompt || !user) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {migrationDone ? (
          // Sucesso
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>
                Migração Concluída!
              </h2>
              <p style={{ margin: 0, color: '#666' }}>
                Seus dados foram migrados com sucesso para o Firebase.
                Agora eles estão seguros e sincronizados!
              </p>
            </div>
          </>
        ) : (
          // Prompt de migração
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                Migração de Dados Disponível
              </h2>
              <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>
                Detectamos dados salvos localmente no seu navegador.
                Migre-os para o Firebase para ter:
              </p>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: '#333',
                lineHeight: '1.8'
              }}>
                <li>✅ Sincronização entre dispositivos</li>
                <li>✅ Backup automático na nuvem</li>
                <li>✅ Maior segurança dos dados</li>
                <li>✅ Acesso de qualquer lugar</li>
              </ul>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #ffc107'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>
                <strong>⚠️ Importante:</strong> Esta migração é segura e não apagará seus dados locais até confirmar que tudo foi migrado com sucesso.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleMigrate}
                disabled={migrating}
                style={{
                  padding: '1rem',
                  backgroundColor: migrating ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: migrating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {migrating ? '⏳ Migrando dados...' : '🚀 Migrar Agora'}
              </button>

              <button
                onClick={handleRemindLater}
                disabled={migrating}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'transparent',
                  color: '#007bff',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: migrating ? 'not-allowed' : 'pointer'
                }}
              >
                ⏰ Lembrar depois
              </button>

              <button
                onClick={handleDismiss}
                disabled={migrating}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  color: '#6c757d',
                  border: 'none',
                  fontSize: '0.85rem',
                  cursor: migrating ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Não mostrar novamente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

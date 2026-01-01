import React, { useState } from 'react';
import { testAsaasConnection, asaasService } from '../services/asaasService';
import colors from '../styles/colors';

export const AsaasIntegration: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [accountInfo, setAccountInfo] = useState<any>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setResult('');
    
    try {
      console.log('🧪 Testando conexão com Asaas...');
      
      const isConnected = await testAsaasConnection();
      
      if (isConnected) {
        setResult('✅ Conexão com Asaas funcionando perfeitamente!');
        
        // Buscar informações da conta
        try {
          const info = await asaasService.getAccountInfo();
          setAccountInfo(info);
        } catch (error) {
          console.log('Informações da conta não disponíveis');
        }
      } else {
        setResult('❌ Falha na conexão com Asaas. Verifique a API Key.');
      }
    } catch (error: any) {
      console.error('Erro no teste:', error);
      setResult(`❌ Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        margin: '20px 0',
      }}
    >
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🔗 Integração Asaas
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '0 0 8px 0', color: colors.text.secondary }}>
          <strong>Status:</strong> API configurada (Ambiente de Homologação)
        </p>
        <p style={{ margin: '0 0 8px 0', color: colors.text.secondary }}>
          <strong>API Key:</strong> $aact_hmlg_000...f03 (Homologação)
        </p>
        <p style={{ margin: '0', color: colors.text.secondary }}>
          <strong>Webhook:</strong> Configurado para receber pagamentos
        </p>
      </div>

      <button
        onClick={handleTestConnection}
        disabled={testing}
        style={{
          padding: '12px 24px',
          background: testing ? colors.text.disabled : colors.accent.default,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: testing ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          marginBottom: '16px',
        }}
      >
        {testing ? '🔄 Testando...' : '🧪 Testar Conexão'}
      </button>

      {result && (
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: result.includes('✅') ? colors.success.bg : colors.danger.bg,
            color: result.includes('✅') ? colors.success.default : colors.danger.default,
            marginBottom: '16px',
            fontWeight: '500',
          }}
        >
          {result}
        </div>
      )}

      {accountInfo && (
        <div
          style={{
            padding: '16px',
            background: colors.bg.secondary,
            borderRadius: '8px',
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', color: colors.text.primary }}>
            📊 Informações da Conta Asaas
          </h4>
          <div style={{ fontSize: '14px', color: colors.text.secondary }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Nome:</strong> {accountInfo.name || 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Email:</strong> {accountInfo.email || 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Ambiente:</strong> {accountInfo.environment || 'Homologação'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Status:</strong> {accountInfo.accountStatus || 'Ativo'}
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1565c0',
        }}
      >
        <strong>💡 Próximos Passos:</strong>
        <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Execute o deploy: <code>deploy-fix.bat</code></li>
          <li>Configure o webhook no painel do Asaas</li>
          <li>Teste criando uma cobrança</li>
          <li>Para produção, substitua pela API Key de produção</li>
        </ol>
      </div>
    </div>
  );
};
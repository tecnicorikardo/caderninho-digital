import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { personalFinanceService } from '../services/personalFinanceService';
import { debugPersonalFinance } from '../utils/debugPersonalFinance';

export function PersonalFinanceTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testCreateTransaction = async () => {
    if (!user) {
      addResult('❌ Usuário não logado');
      return;
    }

    setLoading(true);
    try {
      addResult('🔄 Criando transação de teste...');
      
      const testData = {
        type: 'despesa' as const,
        category: 'Teste',
        description: `Transação de teste - ${new Date().toLocaleString()}`,
        amount: 25.50,
        date: new Date(),
        paymentMethod: 'dinheiro' as const,
        isRecurring: false,
        notes: 'Criada pelo componente de teste',
        userId: user.uid
      };

      const transactionId = await personalFinanceService.createTransaction(testData, user.uid);
      addResult(`✅ Transação criada com ID: ${transactionId}`);
      
      // Verificar se foi salva
      const transactions = await personalFinanceService.getTransactions(user.uid);
      addResult(`📊 Total de transações após criação: ${transactions.length}`);
      
    } catch (error) {
      addResult(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testListTransactions = async () => {
    if (!user) {
      addResult('❌ Usuário não logado');
      return;
    }

    setLoading(true);
    try {
      addResult('🔄 Listando transações...');
      
      const transactions = await personalFinanceService.getTransactions(user.uid);
      addResult(`📊 Total de transações: ${transactions.length}`);
      
      transactions.forEach((t, index) => {
        addResult(`${index + 1}. ${t.type} - ${t.category} - R$ ${t.amount} - ${t.description}`);
      });
      
    } catch (error) {
      addResult(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testMonthlyReport = async () => {
    if (!user) {
      addResult('❌ Usuário não logado');
      return;
    }

    setLoading(true);
    try {
      addResult('🔄 Gerando relatório mensal...');
      
      const now = new Date();
      const report = await personalFinanceService.getMonthlyReport(
        user.uid, 
        now.getFullYear(), 
        now.getMonth() + 1
      );
      
      addResult(`💵 Receitas: R$ ${report.totalReceitas.toFixed(2)}`);
      addResult(`💸 Despesas: R$ ${report.totalDespesas.toFixed(2)}`);
      addResult(`💰 Saldo: R$ ${report.saldo.toFixed(2)}`);
      addResult(`📊 Transações no período: ${report.transactions.length}`);
      
    } catch (error) {
      addResult(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runDebug = async () => {
    if (!user) {
      addResult('❌ Usuário não logado');
      return;
    }

    addResult('🔍 Executando debug completo...');
    addResult('📋 Verifique o console do navegador para detalhes');
    
    try {
      await debugPersonalFinance(user.uid);
      addResult('✅ Debug concluído - verifique o console');
    } catch (error) {
      addResult(`❌ Erro no debug: ${error}`);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '1rem 0' }}>
        <p>⚠️ Faça login para usar o teste de finanças pessoais</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      margin: '1rem 0'
    }}>
      <h3 style={{ marginTop: 0, color: '#333' }}>🧪 Teste de Finanças Pessoais</h3>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Use estes botões para testar e diagnosticar problemas nas finanças pessoais.
      </p>
      
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={testCreateTransaction}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {loading ? '⏳' : '➕'} Criar Teste
        </button>
        
        <button
          onClick={testListTransactions}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {loading ? '⏳' : '📋'} Listar
        </button>
        
        <button
          onClick={testMonthlyReport}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {loading ? '⏳' : '📊'} Relatório
        </button>
        
        <button
          onClick={runDebug}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {loading ? '⏳' : '🔍'} Debug
        </button>
        
        <button
          onClick={clearResults}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          🗑️ Limpar
        </button>
      </div>

      {results.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          padding: '1rem',
          maxHeight: '300px',
          overflowY: 'auto',
          fontSize: '0.85rem',
          fontFamily: 'monospace'
        }}>
          {results.map((result, index) => (
            <div key={index} style={{ marginBottom: '0.25rem' }}>
              {result}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
        <strong>User ID:</strong> {user.uid}
      </div>
    </div>
  );
}
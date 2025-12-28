import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { personalFinanceService } from '../../services/personalFinanceService';
import { debugPersonalFinance } from '../../utils/debugPersonalFinance';

export function PersonalReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadReport();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadReport = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('📊 Carregando relatório para:', selectedMonth, '/', selectedYear);
      const reportData = await personalFinanceService.getMonthlyReport(
        user.uid,
        selectedYear,
        selectedMonth
      );
      console.log('✅ Relatório carregado:', reportData);
      setReport(reportData);
    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error);
      // Criar relatório vazio em caso de erro
      setReport({
        totalReceitas: 0,
        totalDespesas: 0,
        saldo: 0,
        despesasPorCategoria: {},
        receitasPorCategoria: {},
        transactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Carregando relatório...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Erro ao carregar relatório</div>
      </div>
    );
  }

  const despesasArray = Object.entries(report.despesasPorCategoria)
    .map(([category, amount]) => ({ category, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount);

  const receitasArray = Object.entries(report.receitasPorCategoria)
    .map(([category, amount]) => ({ category, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Voltar
        </button>
        <button
          onClick={() => {
            if (!user) return;
            console.log('🔍 DEBUG RELATÓRIOS - User ID:', user.uid);
            console.log('📅 Período selecionado:', selectedMonth, '/', selectedYear);
            console.log('📊 Dados do relatório atual:', report);
            debugPersonalFinance(user.uid);
            alert('Debug executado! Verifique o console (F12) para detalhes.');
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🔍 Debug
        </button>
        
        <button
          onClick={async () => {
            if (!user) return;
            try {
              console.log('🔄 Recarregando relatório...');
              await loadReport();
              alert('Relatório recarregado!');
            } catch (error) {
              console.error('❌ Erro ao recarregar:', error);
              alert('Erro ao recarregar relatório.');
            }
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🔄 Recarregar
        </button>
        <div>
          <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>📊 Relatórios Pessoais</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Análise detalhada das suas finanças pessoais
          </p>
        </div>
      </div>

      {/* Seletor de Período */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Mês
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Ano
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💵 Total de Receitas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {report.totalReceitas.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {receitasArray.length} transações
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💸 Total de Despesas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {report.totalDespesas.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {despesasArray.length} categorias
          </div>
        </div>

        <div style={{
          background: report.saldo >= 0
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            💰 Saldo do Período
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            R$ {report.saldo.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {report.saldo >= 0 ? 'Positivo ✅' : 'Negativo ⚠️'}
          </div>
        </div>
      </div>

      {/* Gráficos e Análises */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Despesas por Categoria */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
            💸 Despesas por Categoria
          </h3>
          
          {despesasArray.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
              Nenhuma despesa neste período
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {despesasArray.map(({ category, amount }) => {
                const percentage = (amount / report.totalDespesas) * 100;
                return (
                  <div key={category}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: '500' }}>{category}</span>
                      <span style={{ color: '#666' }}>
                        R$ {amount.toFixed(2)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Receitas por Categoria */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
            💵 Receitas por Categoria
          </h3>
          
          {receitasArray.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
              Nenhuma receita neste período
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {receitasArray.map(({ category, amount }) => {
                const percentage = (amount / report.totalReceitas) * 100;
                return (
                  <div key={category}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: '500' }}>{category}</span>
                      <span style={{ color: '#666' }}>
                        R$ {amount.toFixed(2)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>💡 Insights</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {report.saldo < 0 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fff3cd',
              borderLeft: '4px solid #ffc107',
              borderRadius: '4px'
            }}>
              ⚠️ Suas despesas superaram suas receitas em R$ {Math.abs(report.saldo).toFixed(2)}
            </div>
          )}

          {report.saldo > 0 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#d4edda',
              borderLeft: '4px solid #28a745',
              borderRadius: '4px'
            }}>
              ✅ Parabéns! Você economizou R$ {report.saldo.toFixed(2)} este mês
            </div>
          )}

          {despesasArray.length > 0 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#d1ecf1',
              borderLeft: '4px solid #17a2b8',
              borderRadius: '4px'
            }}>
              📊 Sua maior despesa foi em "{despesasArray[0].category}" (R$ {despesasArray[0].amount.toFixed(2)})
            </div>
          )}

          {report.totalDespesas > 0 && report.totalReceitas > 0 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#e7e7ff',
              borderLeft: '4px solid #667eea',
              borderRadius: '4px'
            }}>
              💰 Taxa de economia: {((report.saldo / report.totalReceitas) * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

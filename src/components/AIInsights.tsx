import { useState, useEffect } from 'react';
import { AIAnalytics, AIInsight } from '../utils/aiAnalytics';

interface AIInsightsProps {
  transactions?: any[];
  sales?: any[];
  clients?: any[];
  products?: any[];
  showSummary?: boolean;
}

export function AIInsights({ 
  transactions = [], 
  sales = [], 
  clients = [], 
  products = [],
  showSummary = true 
}: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  useEffect(() => {
    generateInsights();
  }, [transactions, sales, clients, products]);

  const generateInsights = async () => {
    setLoading(true);
    
    try {
      // Simular processamento de IA
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const allInsights: AIInsight[] = [];
      
      // Análise financeira
      if (transactions.length > 0) {
        const financialInsights = AIAnalytics.analyzeFinancialTrends(transactions);
        allInsights.push(...financialInsights);
      }
      
      // Análise de vendas
      if (sales.length > 0) {
        const salesInsights = AIAnalytics.analyzeSalesPerformance(sales, clients);
        allInsights.push(...salesInsights);
      }
      
      // Análise de estoque
      if (products.length > 0) {
        const inventoryInsights = AIAnalytics.analyzeInventory(products, sales);
        allInsights.push(...inventoryInsights);
      }
      
      // Ordenar por impacto e confiança
      const sortedInsights = allInsights.sort((a, b) => {
        const impactWeight = { high: 3, medium: 2, low: 1 };
        const aScore = impactWeight[a.impact] * (a.confidence / 100);
        const bScore = impactWeight[b.impact] * (b.confidence / 100);
        return bScore - aScore;
      });
      
      setInsights(sortedInsights);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return '📈';
      case 'warning': return '⚠️';
      case 'opportunity': return '🚀';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  const getInsightColor = (type: string, impact: string) => {
    if (type === 'warning') return '#dc3545';
    if (type === 'opportunity') return '#28a745';
    if (impact === 'high') return '#fd7e14';
    return '#007bff';
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '1rem' }}>🤖</div>
        <h3>IA Analisando seus Dados...</h3>
        <p style={{ color: '#666' }}>Processando padrões e gerando insights inteligentes</p>
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e1e5e9',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '1rem'
        }}>
          <div style={{
            width: '60%',
            height: '100%',
            backgroundColor: '#007bff',
            animation: 'loading 2s ease-in-out infinite'
          }} />
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
        <h3>IA Pronta para Analisar</h3>
        <p style={{ color: '#666' }}>
          Adicione mais dados (transações, vendas, produtos) para que eu possa gerar insights inteligentes sobre seu negócio.
        </p>
      </div>
    );
  }

  return (
    <div>
      {showSummary && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid #007bff',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🤖</span>
            <h3 style={{ margin: 0, color: '#007bff' }}>Resumo Inteligente</h3>
          </div>
          <div style={{ 
            whiteSpace: 'pre-line', 
            lineHeight: '1.6',
            color: '#333'
          }}>
            {AIAnalytics.generateExecutiveSummary(insights)}
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🧠</span>
          <h3 style={{ margin: 0 }}>Insights da IA</h3>
          <span style={{ 
            marginLeft: 'auto',
            padding: '0.25rem 0.75rem',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            {insights.length} insights encontrados
          </span>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {insights.map((insight) => (
            <div
              key={insight.id}
              style={{
                border: `2px solid ${getInsightColor(insight.type, insight.impact)}`,
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: '#fafafa',
                cursor: insight.actionable ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (insight.actionable) {
                  setExpandedInsight(expandedInsight === insight.id ? null : insight.id);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {getInsightIcon(insight.type)}
                </span>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: getInsightColor(insight.type, insight.impact) }}>
                      {insight.title}
                    </h4>
                    
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: getImpactBadgeColor(insight.impact),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {insight.impact}
                    </span>
                    
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: '#e1e5e9',
                      color: '#666',
                      borderRadius: '12px',
                      fontSize: '0.7rem'
                    }}>
                      {insight.confidence}% confiança
                    </span>
                  </div>
                  
                  <p style={{ margin: '0 0 0.5rem 0', color: '#333', lineHeight: '1.5' }}>
                    {insight.description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#666',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      border: '1px solid #e1e5e9'
                    }}>
                      {insight.category}
                    </span>
                    
                    {insight.actionable && (
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>
                        Clique para ver sugestão
                      </span>
                    )}
                  </div>
                  
                  {expandedInsight === insight.id && insight.suggestion && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '6px',
                      border: '1px solid #28a745'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ marginRight: '0.5rem' }}>💡</span>
                        <strong style={{ color: '#28a745' }}>Sugestão da IA:</strong>
                      </div>
                      <p style={{ margin: 0, color: '#155724' }}>
                        {insight.suggestion}
                      </p>
                      
                      {insight.data && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                          <strong>Dados adicionais:</strong> {JSON.stringify(insight.data, null, 2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            🤖 Análise gerada por IA offline • Dados processados localmente • 
            Atualizado automaticamente conforme novos dados são adicionados
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { AIAnalytics } from '../utils/aiAnalytics';

interface ExecutiveSummaryProps {
  data: {
    transactions: any[];
    sales: any[];
    clients: any[];
    products: any[];
  };
  reportData: any;
}

export function ExecutiveSummary({ data, reportData }: ExecutiveSummaryProps) {
  const [activeView, setActiveView] = useState<'summary' | 'detailed'>('summary');

  const generateExecutiveSummary = () => {
    const { transactions, sales, clients, products } = data;
    
    // Análise de performance
    const totalRevenue = reportData.totalRevenue || 0;
    const totalProfit = reportData.totalProfit || 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Status do negócio
    const businessStatus = 
      profitMargin > 30 ? 'EXCELENTE' :
      profitMargin > 20 ? 'BOM' :
      profitMargin > 10 ? 'REGULAR' :
      profitMargin > 0 ? 'CRÍTICO' : 'PREJUÍZO';
    
    const statusColor = 
      businessStatus === 'EXCELENTE' ? '#28a745' :
      businessStatus === 'BOM' ? '#17a2b8' :
      businessStatus === 'REGULAR' ? '#ffc107' :
      businessStatus === 'CRÍTICO' ? '#fd7e14' : '#dc3545';
    
    // Principais insights
    const growth = AIAnalytics.calculateGrowthRate(sales);
    const topClient = AIAnalytics.getTopClients(sales, clients)[0];
    const topProduct = AIAnalytics.getTopSellingProducts(sales, products)[0];
    
    // Riscos identificados
    const risks = [];
    const lowStock = products.filter(p => p.quantity <= (p.minStock || 5));
    if (lowStock.length > 0) risks.push(`${lowStock.length} produtos com estoque crítico`);
    if (growth < -10) risks.push('Vendas em declínio significativo');
    if (profitMargin < 10) risks.push('Margem de lucro muito baixa');
    
    // Oportunidades
    const opportunities = [];
    const inactiveClients = clients.filter(c => {
      const hasRecentSales = sales.some(s => {
        const saleDate = new Date(s.date || s.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return (s.clientId === c.id || s.client === c.name) && saleDate >= thirtyDaysAgo;
      });
      return !hasRecentSales;
    });
    
    if (inactiveClients.length > 0) opportunities.push(`${inactiveClients.length} clientes para reativar`);
    if (reportData.averageTicket < 100) opportunities.push('Potencial para aumentar ticket médio');
    if (growth > 0) opportunities.push('Momentum positivo para expansão');

    return {
      businessStatus,
      statusColor,
      profitMargin,
      growth,
      topClient,
      topProduct,
      risks,
      opportunities,
      totalRevenue,
      totalProfit
    };
  };

  const summary = generateExecutiveSummary();

  const renderSummaryView = () => (
    <div style={{ padding: '2rem' }}>
      {/* Status Principal */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: summary.statusColor + '15',
        borderRadius: '12px',
        border: `3px solid ${summary.statusColor}`,
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {summary.businessStatus === 'EXCELENTE' ? '🚀' :
           summary.businessStatus === 'BOM' ? '📈' :
           summary.businessStatus === 'REGULAR' ? '⚖️' :
           summary.businessStatus === 'CRÍTICO' ? '⚠️' : '🚨'}
        </div>
        <h2 style={{ margin: '0 0 0.5rem 0', color: summary.statusColor }}>
          Status: {summary.businessStatus}
        </h2>
        <p style={{ margin: 0, fontSize: '1.2rem', color: summary.statusColor }}>
          Margem de Lucro: {summary.profitMargin.toFixed(1)}%
        </p>
      </div>

      {/* Métricas Principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '2px solid #007bff',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>Receita</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            R$ {summary.totalRevenue.toLocaleString('pt-BR')}
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '2px solid #28a745',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Lucro</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            R$ {summary.totalProfit.toLocaleString('pt-BR')}
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: `2px solid ${summary.growth >= 0 ? '#28a745' : '#dc3545'}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {summary.growth >= 0 ? '📈' : '📉'}
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: summary.growth >= 0 ? '#28a745' : '#dc3545' }}>
            Crescimento
          </h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {summary.growth >= 0 ? '+' : ''}{summary.growth.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Destaques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Top Performers */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '2px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#856404' }}>🏆 Destaques</h4>
          
          {summary.topClient && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#856404' }}>Melhor Cliente:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                {summary.topClient.name} - R$ {summary.topClient.value.toLocaleString('pt-BR')}
              </div>
            </div>
          )}
          
          {summary.topProduct && (
            <div>
              <strong style={{ color: '#856404' }}>Produto Mais Vendido:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                {summary.topProduct.name} - {summary.topProduct.sales} vendas
              </div>
            </div>
          )}
        </div>

        {/* Alertas */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: summary.risks.length > 0 ? '#f8d7da' : '#d4edda',
          borderRadius: '8px',
          border: `2px solid ${summary.risks.length > 0 ? '#dc3545' : '#28a745'}`
        }}>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            color: summary.risks.length > 0 ? '#721c24' : '#155724' 
          }}>
            {summary.risks.length > 0 ? '⚠️ Alertas' : '✅ Tudo OK'}
          </h4>
          
          {summary.risks.length > 0 ? (
            <div>
              {summary.risks.slice(0, 3).map((risk, index) => (
                <div key={index} style={{ 
                  marginBottom: '0.5rem',
                  color: '#721c24',
                  fontSize: '0.9rem'
                }}>
                  • {risk}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#155724' }}>
              Nenhum risco crítico identificado no momento.
            </p>
          )}
        </div>
      </div>

      {/* Oportunidades */}
      {summary.opportunities.length > 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#d1ecf1',
          borderRadius: '8px',
          border: '2px solid #17a2b8',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0c5460' }}>🚀 Oportunidades</h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {summary.opportunities.map((opportunity, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#0c5460'
              }}>
                <span>💡</span>
                <span>{opportunity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendação Principal */}
      <div style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🎯 Recomendação Principal da IA</h3>
        <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.5' }}>
          {summary.businessStatus === 'EXCELENTE' && 
            'Seu negócio está indo muito bem! Foque em expandir e diversificar para manter o crescimento.'}
          {summary.businessStatus === 'BOM' && 
            'Performance sólida! Trabalhe nas oportunidades identificadas para alcançar o próximo nível.'}
          {summary.businessStatus === 'REGULAR' && 
            'Há espaço para melhorias. Priorize aumentar a margem de lucro e otimizar processos.'}
          {summary.businessStatus === 'CRÍTICO' && 
            'Atenção necessária! Foque em reduzir custos e aumentar vendas para melhorar a margem.'}
          {summary.businessStatus === 'PREJUÍZO' && 
            'Situação crítica! Revise urgentemente custos e estratégias de precificação.'}
        </p>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div style={{ padding: '2rem' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e1e5e9',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        whiteSpace: 'pre-line',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        {AIAnalytics.generateSystemOverview(data)}
      </div>
    </div>
  );

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>📋 Resumo Executivo</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Visão geral inteligente do seu negócio
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e1e5e9',
        backgroundColor: '#f8f9fa'
      }}>
        <button
          onClick={() => setActiveView('summary')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            backgroundColor: activeView === 'summary' ? 'white' : 'transparent',
            color: activeView === 'summary' ? '#007bff' : '#666',
            borderBottom: activeView === 'summary' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeView === 'summary' ? 'bold' : 'normal'
          }}
        >
          📊 Resumo Visual
        </button>
        <button
          onClick={() => setActiveView('detailed')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            backgroundColor: activeView === 'detailed' ? 'white' : 'transparent',
            color: activeView === 'detailed' ? '#007bff' : '#666',
            borderBottom: activeView === 'detailed' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeView === 'detailed' ? 'bold' : 'normal'
          }}
        >
          📝 Análise Completa
        </button>
      </div>

      {/* Content */}
      {activeView === 'summary' ? renderSummaryView() : renderDetailedView()}
    </div>
  );
}
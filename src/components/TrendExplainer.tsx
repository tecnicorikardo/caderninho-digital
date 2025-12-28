import { useState } from 'react';
import { AIAnalytics } from '../utils/aiAnalytics';

interface TrendExplainerProps {
  data: {
    transactions: any[];
    sales: any[];
    clients: any[];
    products: any[];
  };
}

export function TrendExplainer({ data }: TrendExplainerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'predictions' | 'recommendations'>('overview');
  // const [expandedSection, setExpandedSection] = useState<string | null>(null); // Para uso futuro

  const tabs = [
    { id: 'overview', label: '📊 Visão Geral', icon: '📊' },
    { id: 'trends', label: '📈 Tendências', icon: '📈' },
    { id: 'predictions', label: '🔮 Previsões', icon: '🔮' },
    { id: 'recommendations', label: '💡 Recomendações', icon: '💡' }
  ];

  const renderOverview = () => (
    <div style={{ padding: '1.5rem' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e1e5e9',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        whiteSpace: 'pre-line',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {AIAnalytics.generateSystemOverview(data)}
      </div>
    </div>
  );

  const renderTrends = () => {
    const salesGrowth = AIAnalytics.calculateGrowthRate(data.sales);
    const clientGrowth = AIAnalytics.calculateClientGrowthRate(data.clients);
    const topProducts = AIAnalytics.getTopSellingProducts(data.sales, data.products);
    const topClients = AIAnalytics.getTopClients(data.sales, data.clients);
    const salesByMonth = AIAnalytics.groupSalesByMonth(data.sales);

    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          
          {/* Crescimento de Vendas */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #28a745'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#28a745', display: 'flex', alignItems: 'center' }}>
              📈 Crescimento de Vendas
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: salesGrowth >= 0 ? '#28a745' : '#dc3545' }}>
              {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
            </div>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              {salesGrowth > 10 ? '🚀 Crescimento excelente! Suas vendas estão em alta.' :
               salesGrowth > 0 ? '📈 Crescimento positivo, continue assim!' :
               salesGrowth === 0 ? '➡️ Vendas estáveis, busque oportunidades de crescimento.' :
               '📉 Atenção: vendas em declínio, revise suas estratégias.'}
            </p>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              Comparação dos últimos 30 dias vs período anterior
            </div>
          </div>

          {/* Crescimento de Clientes */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #007bff'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#007bff', display: 'flex', alignItems: 'center' }}>
              👥 Crescimento da Base de Clientes
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: clientGrowth >= 0 ? '#28a745' : '#dc3545' }}>
              {clientGrowth >= 0 ? '+' : ''}{clientGrowth.toFixed(1)}%
            </div>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              {clientGrowth > 20 ? '🚀 Excelente aquisição de novos clientes!' :
               clientGrowth > 5 ? '📈 Boa captação de clientes, continue investindo!' :
               clientGrowth >= 0 ? '➡️ Crescimento moderado da base de clientes.' :
               '📉 Base de clientes estagnada, foque em captação.'}
            </p>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              Novos clientes nos últimos 30 dias
            </div>
          </div>

          {/* Top Produtos */}
          {topProducts.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #ffc107'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#ffc107', display: 'flex', alignItems: 'center' }}>
                🏆 Produtos Mais Vendidos
              </h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {topProducts.slice(0, 3).map((product: any, index: number) => (
                  <div key={product.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: index === 0 ? '#fff3cd' : '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                      {index + 1}. {product.name}
                    </span>
                    <span style={{ 
                      color: '#666',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      {product.sales} vendas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Clientes */}
          {topClients.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #17a2b8'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#17a2b8', display: 'flex', alignItems: 'center' }}>
                💎 Clientes Mais Valiosos
              </h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {topClients.slice(0, 3).map((client: any, index: number) => (
                  <div key={client.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: index === 0 ? '#d1ecf1' : '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                      {index + 1}. {client.name}
                    </span>
                    <span style={{ 
                      color: '#666',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      R$ {client.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sazonalidade */}
          {Object.keys(salesByMonth).length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #6f42c1'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#6f42c1', display: 'flex', alignItems: 'center' }}>
                📅 Padrão Sazonal
              </h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {Object.entries(salesByMonth)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 6)
                  .map(([month, sales]) => (
                    <div key={month} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      <span>{month}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: `${Math.max(20, (sales as number) * 5)}px`,
                          height: '8px',
                          backgroundColor: '#6f42c1',
                          borderRadius: '4px'
                        }} />
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                          {String(sales)} vendas
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    const predictions = AIAnalytics.generatePredictions(data);
    const avgSaleValue = data.sales.length > 0 ? 
      data.sales.reduce((sum, s) => sum + (s.total || 0), 0) / data.sales.length : 0;
    // const growth = AIAnalytics.calculateGrowthRate(data.sales); // Método não implementado

    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          
          {/* Previsão Principal */}
          <div style={{
            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>🔮 Previsão para os Próximos 30 Dias</h3>
            <div style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
              {predictions}
            </div>
          </div>

          {/* Cenários */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #28a745'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>📊 Análise de Cenários</h4>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Cenário Otimista */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#d4edda',
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>🚀 Cenário Otimista (+20%)</h5>
                <p style={{ margin: 0, color: '#155724' }}>
                  Se mantiver o crescimento atual: R$ {(avgSaleValue * 1.2).toLocaleString('pt-BR')} de ticket médio
                </p>
              </div>

              {/* Cenário Realista */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>📈 Cenário Realista (atual)</h5>
                <p style={{ margin: 0, color: '#856404' }}>
                  Mantendo a tendência: R$ {avgSaleValue.toLocaleString('pt-BR')} de ticket médio
                </p>
              </div>

              {/* Cenário Conservador */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #f5c6cb'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>⚠️ Cenário Conservador (-10%)</h5>
                <p style={{ margin: 0, color: '#721c24' }}>
                  Em caso de queda: R$ {(avgSaleValue * 0.9).toLocaleString('pt-BR')} de ticket médio
                </p>
              </div>
            </div>
          </div>

          {/* Fatores de Influência */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #6c757d'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>🎯 Fatores que Podem Influenciar</h4>
            
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📈</span>
                <span>Sazonalidade do mercado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💰</span>
                <span>Campanhas de marketing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🏪</span>
                <span>Disponibilidade de estoque</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🎯</span>
                <span>Satisfação dos clientes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🌍</span>
                <span>Condições econômicas gerais</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    const opportunities = AIAnalytics.identifyGrowthOpportunities(data);
    const risks = AIAnalytics.identifyRisks(data);
    const lowStock = data.products.filter(p => p.quantity <= (p.minStock || 5));
    const inactiveClients = data.clients.filter(c => {
      const hasRecentSales = data.sales.some(s => {
        const saleDate = new Date(s.date || s.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return (s.clientId === c.id || s.client === c.name) && saleDate >= thirtyDaysAgo;
      });
      return !hasRecentSales;
    });

    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          
          {/* Ações Prioritárias */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #dc3545'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#dc3545' }}>🚨 Ações Prioritárias</h4>
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
              {risks}
            </div>
            
            {lowStock.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ color: '#dc3545' }}>Produtos com Estoque Crítico:</h5>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {lowStock.slice(0, 5).map(product => (
                    <div key={product.id} style={{
                      padding: '0.5rem',
                      backgroundColor: '#f8d7da',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{product.name}</span>
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        {product.quantity} unidades
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Oportunidades de Crescimento */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #28a745'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>🚀 Oportunidades de Crescimento</h4>
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
              {opportunities}
            </div>
            
            {inactiveClients.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ color: '#28a745' }}>Clientes para Reativar:</h5>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {inactiveClients.slice(0, 5).map(client => (
                    <div key={client.id} style={{
                      padding: '0.5rem',
                      backgroundColor: '#d4edda',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{client.name}</span>
                      <span style={{ color: '#28a745', fontSize: '0.8rem' }}>
                        {client.email || client.phone || 'Contato disponível'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Plano de Ação */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #007bff'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#007bff' }}>📋 Plano de Ação Sugerido</h4>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>📅 Próximos 7 dias</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#1976d2' }}>
                  <li>Reabastecer produtos com estoque crítico</li>
                  <li>Entrar em contato com top 3 clientes inativos</li>
                  <li>Revisar preços de produtos com baixa margem</li>
                </ul>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f3e5f5',
                borderRadius: '8px',
                borderLeft: '4px solid #9c27b0'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#7b1fa2' }}>📅 Próximos 30 dias</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#7b1fa2' }}>
                  <li>Implementar campanha de reativação de clientes</li>
                  <li>Criar promoções para produtos de baixo giro</li>
                  <li>Analisar e otimizar processos de vendas</li>
                </ul>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#e8f5e8',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#388e3c' }}>📅 Próximos 90 dias</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#388e3c' }}>
                  <li>Desenvolver programa de fidelidade</li>
                  <li>Expandir linha de produtos mais vendidos</li>
                  <li>Implementar sistema de CRM avançado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>🧠 IA Explicativa de Tendências</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Análise detalhada e explicações inteligentes sobre seu negócio
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e1e5e9',
        backgroundColor: '#f8f9fa'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#007bff' : '#666',
              borderBottom: activeTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'predictions' && renderPredictions()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        textAlign: 'center',
        borderTop: '1px solid #e1e5e9'
      }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
          🤖 Análise gerada por IA offline • Dados processados localmente • 
          Atualizado em tempo real conforme seus dados
        </p>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { AIAnalytics } from '../utils/aiAnalytics';

interface SimpleTrendExplainerProps {
  data: {
    transactions: any[];
    sales: any[];
    clients: any[];
    products: any[];
  };
}

export function SimpleTrendExplainer({ data }: SimpleTrendExplainerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends'>('overview');

  const tabs = [
    { id: 'overview', label: '📊 Visão Geral', icon: '📊' },
    { id: 'trends', label: '📈 Tendências', icon: '📈' }
  ];

  const renderOverview = () => {
    try {
      return (
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
    } catch (error) {
      return (
        <div style={{ padding: '1.5rem' }}>
          <div style={{ color: 'red' }}>
            Erro ao gerar análise: {error.message}
          </div>
        </div>
      );
    }
  };

  const renderTrends = () => {
    try {
      const salesGrowth = data.sales.length > 0 ? 
        ((data.sales.length / Math.max(1, data.sales.length - 1)) - 1) * 100 : 0;
      
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
                📈 Análise de Vendas
              </h4>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {data.sales.length} vendas registradas
              </div>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                Total de vendas no sistema
              </p>
            </div>

            {/* Clientes */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #007bff'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#007bff', display: 'flex', alignItems: 'center' }}>
                👥 Base de Clientes
              </h4>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                {data.clients.length} clientes
              </div>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                Total de clientes cadastrados
              </p>
            </div>

            {/* Produtos */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #ffc107'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#ffc107', display: 'flex', alignItems: 'center' }}>
                📦 Estoque
              </h4>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                {data.products.length} produtos
              </div>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                Total de produtos no estoque
              </p>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div style={{ padding: '1.5rem' }}>
          <div style={{ color: 'red' }}>
            Erro ao gerar tendências: {error.message}
          </div>
        </div>
      );
    }
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
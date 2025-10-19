import { useState } from 'react';

interface MetricExplainerProps {
  metric: string;
  value: number | string;
  explanation: string;
  tips: string[];
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export function MetricExplainer({ 
  metric, 
  value, 
  explanation, 
  tips, 
  trend = 'stable',
  color = '#007bff'
}: MetricExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#28a745';
      case 'down': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '1rem',
          backgroundColor: color,
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>{metric}</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor() }}>
            {getTrendIcon()}
          </span>
          <span style={{ fontSize: '1.2rem' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1.5rem' }}>
          {/* Explanation */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            borderLeft: `4px solid ${color}`
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: color }}>
              🤖 O que significa esta métrica?
            </h5>
            <p style={{ margin: 0, lineHeight: '1.5', color: '#333' }}>
              {explanation}
            </p>
          </div>

          {/* Tips */}
          <div>
            <h5 style={{ margin: '0 0 0.75rem 0', color: '#28a745' }}>
              💡 Dicas para melhorar:
            </h5>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {tips.map((tip, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '6px',
                    border: '1px solid #c3e6cb'
                  }}
                >
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                    {index + 1}.
                  </span>
                  <span style={{ color: '#155724', lineHeight: '1.4' }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Analysis */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: getTrendColor() + '15',
            borderRadius: '8px',
            border: `1px solid ${getTrendColor()}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{getTrendIcon()}</span>
              <h5 style={{ margin: 0, color: getTrendColor() }}>
                Análise de Tendência
              </h5>
            </div>
            <p style={{ margin: 0, color: getTrendColor(), fontSize: '0.9rem' }}>
              {trend === 'up' && 'Esta métrica está em crescimento! Continue com as estratégias atuais.'}
              {trend === 'down' && 'Esta métrica está em declínio. Considere implementar as dicas acima.'}
              {trend === 'stable' && 'Esta métrica está estável. Busque oportunidades de otimização.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para explicar múltiplas métricas
export function BusinessMetricsExplainer({ data }: { data: any }) {
  const metrics = [
    {
      metric: 'Receita Total',
      value: `R$ ${data.totalRevenue?.toFixed(2) || '0,00'}`,
      explanation: 'A receita total representa todo o dinheiro que entrou no seu negócio através de vendas pagas. É o indicador mais básico de performance financeira.',
      tips: [
        'Aumente o número de vendas através de marketing direcionado',
        'Melhore o ticket médio oferecendo produtos complementares',
        'Fidelizar clientes para garantir vendas recorrentes',
        'Otimize seus preços baseado na concorrência e valor percebido'
      ],
      trend: data.totalRevenue > 1000 ? 'up' : data.totalRevenue > 500 ? 'stable' : 'down',
      color: '#007bff'
    },
    {
      metric: 'Lucro Total',
      value: `R$ ${data.totalProfit?.toFixed(2) || '0,00'}`,
      explanation: 'O lucro é a diferença entre sua receita e seus custos. É o dinheiro que realmente fica no seu bolso após pagar todos os gastos.',
      tips: [
        'Negocie melhores preços com fornecedores para reduzir custos',
        'Elimine produtos com margem muito baixa',
        'Otimize processos para reduzir desperdícios',
        'Aumente preços de produtos com alta demanda'
      ],
      trend: data.totalProfit > 500 ? 'up' : data.totalProfit > 200 ? 'stable' : 'down',
      color: '#28a745'
    },
    {
      metric: 'Ticket Médio',
      value: `R$ ${data.averageTicket?.toFixed(2) || '0,00'}`,
      explanation: 'O ticket médio é o valor médio de cada venda. Um ticket médio alto indica que você está vendendo produtos de maior valor ou mais itens por venda.',
      tips: [
        'Ofereça produtos complementares (venda cruzada)',
        'Crie combos e promoções que incentivem compras maiores',
        'Treine sua equipe para fazer upselling',
        'Desenvolva produtos premium com maior margem'
      ],
      trend: data.averageTicket > 100 ? 'up' : data.averageTicket > 50 ? 'stable' : 'down',
      color: '#ffc107'
    },
    {
      metric: 'Total de Clientes',
      value: data.totalClients || 0,
      explanation: 'O número total de clientes cadastrados mostra o tamanho da sua base. Mais clientes significa maior potencial de vendas futuras.',
      tips: [
        'Implemente programas de indicação para atrair novos clientes',
        'Use redes sociais para aumentar sua visibilidade',
        'Ofereça promoções especiais para primeiras compras',
        'Melhore a experiência do cliente para gerar recomendações'
      ],
      trend: data.totalClients > 50 ? 'up' : data.totalClients > 20 ? 'stable' : 'down',
      color: '#6f42c1'
    },
    {
      metric: 'Valor do Estoque',
      value: `R$ ${data.stockValue?.toFixed(2) || '0,00'}`,
      explanation: 'O valor do estoque representa o dinheiro investido em produtos. Um estoque bem gerenciado equilibra disponibilidade e capital investido.',
      tips: [
        'Monitore produtos com baixo giro para evitar capital parado',
        'Implemente sistema de estoque mínimo para evitar rupturas',
        'Negocie prazos de pagamento maiores com fornecedores',
        'Faça promoções para produtos próximos ao vencimento'
      ],
      trend: 'stable',
      color: '#fd7e14'
    }
  ];

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>🎓 Explicador de Métricas</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Clique em cada métrica para entender o que ela significa e como melhorá-la
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        {metrics.map((metricData, index) => (
          <MetricExplainer
            key={index}
            metric={metricData.metric}
            value={metricData.value}
            explanation={metricData.explanation}
            tips={metricData.tips}
            trend={metricData.trend}
            color={metricData.color}
          />
        ))}
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '2px solid #2196f3'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🎯</span>
          <h4 style={{ margin: 0, color: '#1976d2' }}>Dica da IA</h4>
        </div>
        <p style={{ margin: 0, color: '#1976d2', lineHeight: '1.5' }}>
          Foque primeiro nas métricas com tendência de queda (📉). Elas representam os maiores riscos para seu negócio. 
          Depois, trabalhe para melhorar as métricas estáveis (➡️) e mantenha o crescimento das que estão em alta (📈).
        </p>
      </div>
    </div>
  );
}
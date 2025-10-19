// Sistema de IA Offline para Análise de Dados Financeiros - Versão Simplificada

export interface AIInsight {
  id: string;
  type: 'trend' | 'warning' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'financial' | 'sales' | 'inventory' | 'customer';
  confidence: number; // 0-100
  actionable: boolean;
  suggestion?: string;
  data?: any;
}

export class AIAnalytics {
  
  // Análise básica de tendências financeiras
  static analyzeFinancialTrends(transactions: any[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    if (transactions.length < 3) {
      return [{
        id: 'insufficient_data',
        type: 'recommendation',
        title: 'Dados Insuficientes',
        description: 'Adicione mais transações para obter análises mais precisas.',
        impact: 'low',
        category: 'financial',
        confidence: 100,
        actionable: true,
        suggestion: 'Registre pelo menos 10 transações para análises detalhadas.'
      }];
    }

    // Análise simples de receitas vs despesas
    const receitas = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesas = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const saldo = receitas - despesas;

    if (saldo > 0) {
      insights.push({
        id: 'positive_balance',
        type: 'trend',
        title: 'Saldo Positivo',
        description: `Suas receitas (R$ ${receitas.toFixed(2)}) superam as despesas (R$ ${despesas.toFixed(2)}).`,
        impact: 'high',
        category: 'financial',
        confidence: 95,
        actionable: true,
        suggestion: 'Continue mantendo este controle financeiro positivo.'
      });
    } else if (saldo < 0) {
      insights.push({
        id: 'negative_balance',
        type: 'warning',
        title: 'Saldo Negativo',
        description: `Suas despesas (R$ ${despesas.toFixed(2)}) superam as receitas (R$ ${receitas.toFixed(2)}).`,
        impact: 'high',
        category: 'financial',
        confidence: 95,
        actionable: true,
        suggestion: 'Revise seus gastos e busque aumentar as receitas.'
      });
    }

    return insights;
  }

  // Análise básica de vendas
  static analyzeSalesPerformance(sales: any[], clients: any[]): AIInsight[] {
    const insights: AIInsight[] = [];

    if (sales.length === 0) return insights;

    // Análise de ticket médio
    const avgTicket = sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / sales.length;
    
    if (avgTicket > 100) {
      insights.push({
        id: 'good_ticket',
        type: 'opportunity',
        title: 'Bom Ticket Médio',
        description: `Seu ticket médio de R$ ${avgTicket.toFixed(2)} está em um bom patamar.`,
        impact: 'medium',
        category: 'sales',
        confidence: 80,
        actionable: true,
        suggestion: 'Continue focando em produtos de maior valor agregado.'
      });
    } else {
      insights.push({
        id: 'low_ticket',
        type: 'recommendation',
        title: 'Oportunidade de Melhoria no Ticket Médio',
        description: `Seu ticket médio de R$ ${avgTicket.toFixed(2)} pode ser melhorado.`,
        impact: 'medium',
        category: 'sales',
        confidence: 75,
        actionable: true,
        suggestion: 'Considere oferecer produtos complementares ou de maior valor.'
      });
    }

    return insights;
  }

  // Análise básica de estoque
  static analyzeInventory(products: any[], sales: any[]): AIInsight[] {
    const insights: AIInsight[] = [];

    if (products.length === 0) return insights;

    // Produtos com estoque baixo
    const lowStock = products.filter(p => (p.quantity || 0) <= 5);
    if (lowStock.length > 0) {
      insights.push({
        id: 'low_stock',
        type: 'warning',
        title: 'Produtos com Estoque Baixo',
        description: `${lowStock.length} produtos com estoque baixo ou zerado.`,
        impact: 'high',
        category: 'inventory',
        confidence: 100,
        actionable: true,
        suggestion: 'Reabasteça os produtos com estoque baixo para evitar perda de vendas.'
      });
    }

    return insights;
  }

  // Gerador de resumo executivo simples
  static generateExecutiveSummary(insights: AIInsight[]): string {
    if (insights.length === 0) {
      return "Seus dados estão sendo analisados. Continue registrando transações para obter insights mais detalhados.";
    }

    const highImpact = insights.filter(i => i.impact === 'high');
    const warnings = insights.filter(i => i.type === 'warning');
    const opportunities = insights.filter(i => i.type === 'opportunity');

    let summary = "📊 Análise Inteligente dos seus Dados:\n\n";

    if (highImpact.length > 0) {
      summary += `🎯 Pontos de Alta Prioridade: ${highImpact.length} itens detectados que requerem atenção imediata.\n\n`;
    }

    if (warnings.length > 0) {
      summary += `⚠️ Alertas: ${warnings.length} situações que podem impactar seus resultados.\n\n`;
    }

    if (opportunities.length > 0) {
      summary += `🚀 Oportunidades: ${opportunities.length} pontos de melhoria identificados.\n\n`;
    }

    const topInsight = insights.sort((a, b) => b.confidence - a.confidence)[0];
    if (topInsight) {
      summary += `💡 Insight Principal: ${topInsight.title} - ${topInsight.description}\n\n`;
    }

    summary += "📈 Continue monitorando seus dados para insights ainda mais precisos!";

    return summary;
  }
}
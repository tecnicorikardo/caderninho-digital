// Serviço de IA para o Caderninho Digital
interface AIResponse {
  success: boolean;
  message: string;
  usage?: {
    requests: number;
    limit: number;
  };
}

interface BusinessData {
  sales?: any[];
  products?: any[];
  clients?: any[];
  totalSales?: number;
  salesCount?: number;
}

// Configuração da API Gemini
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Você vai configurar
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Controles de uso
const DAILY_LIMIT = 10; // 10 perguntas por usuário por dia
const COOLDOWN_TIME = 30000; // 30 segundos entre perguntas

class AIService {
  private static instance: AIService;
  private userUsage: Map<string, { count: number; lastRequest: number; date: string }> = new Map();

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Verifica se o usuário pode fazer uma pergunta
   */
  private canUserAsk(userId: string): { canAsk: boolean; reason?: string; waitTime?: number } {
    const today = new Date().toDateString();
    const userStats = this.userUsage.get(userId);

    // Se é um novo dia, resetar contador
    if (!userStats || userStats.date !== today) {
      this.userUsage.set(userId, { count: 0, lastRequest: 0, date: today });
      return { canAsk: true };
    }

    // Verificar limite diário
    if (userStats.count >= DAILY_LIMIT) {
      return {
        canAsk: false,
        reason: `Você atingiu o limite de ${DAILY_LIMIT} perguntas por dia. Tente novamente amanhã!`
      };
    }

    // Verificar cooldown
    const timeSinceLastRequest = Date.now() - userStats.lastRequest;
    if (timeSinceLastRequest < COOLDOWN_TIME) {
      const waitTime = Math.ceil((COOLDOWN_TIME - timeSinceLastRequest) / 1000);
      return {
        canAsk: false,
        reason: `Aguarde ${waitTime} segundos antes da próxima pergunta.`,
        waitTime
      };
    }

    return { canAsk: true };
  }

  /**
   * Registra o uso da IA pelo usuário
   */
  private recordUsage(userId: string) {
    const today = new Date().toDateString();
    const userStats = this.userUsage.get(userId) || { count: 0, lastRequest: 0, date: today };

    userStats.count += 1;
    userStats.lastRequest = Date.now();
    userStats.date = today;

    this.userUsage.set(userId, userStats);
  }

  /**
   * Gera contexto do negócio baseado nos dados
   */
  private generateBusinessContext(data: BusinessData): string {
    let context = "DADOS DO NEGÓCIO:\n";

    if (data.totalSales !== undefined) {
      context += `- Faturamento total: R$ ${data.totalSales.toFixed(2)}\n`;
    }

    if (data.salesCount !== undefined) {
      context += `- Total de vendas: ${data.salesCount}\n`;
    }

    if (data.sales && data.sales.length > 0) {
      context += `- Últimas vendas:\n`;
      data.sales.slice(0, 5).forEach((sale, index) => {
        context += `  ${index + 1}. ${sale.clientName || 'Venda Direta'} - ${sale.productName || 'Produto'} - R$ ${(sale.total || 0).toFixed(2)}\n`;
      });
    }

    if (data.products && data.products.length > 0) {
      context += `- Produtos em estoque: ${data.products.length}\n`;
      const lowStock = data.products.filter(p => p.quantity <= (p.minStock || 5));
      if (lowStock.length > 0) {
        context += `- Produtos com estoque baixo: ${lowStock.map(p => p.name).join(', ')}\n`;
      }
    }

    if (data.clients && data.clients.length > 0) {
      context += `- Total de clientes: ${data.clients.length}\n`;
    }

    return context;
  }

  /**
   * Chama a API do Gemini
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      console.log('🤖 Chamando API Gemini...');

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('❌ Erro na API Gemini:', error);
      throw error;
    }
  }

  /**
   * Respostas offline para quando a IA não estiver disponível
   */
  /**
   * Respostas offline para quando a IA não estiver disponível
   */
  public getOfflineResponse(question: string, data?: BusinessData): string {
    const lowerQuestion = question.toLowerCase();

    // Vendas - Detecção mais ampla (incluindo erros de digitação comuns)
    if (lowerQuestion.includes('vend') || lowerQuestion.includes('fatur')) {
      let salesInfo = '';
      if (data) {
        salesInfo = `📊 **Raio-X de Vendas:**\n\n`;
        salesInfo += `💰 **Faturamento Hoje:** R$ ${(data.totalSales || 0).toFixed(2)}\n`;
        salesInfo += `📝 **Quantidade:** ${data.salesCount || 0} vendas\n`;
        if (data.salesCount && data.salesCount > 0) {
          salesInfo += `📈 **Ticket Médio:** R$ ${((data.totalSales || 0) / data.salesCount).toFixed(2)}\n`;
        }

        // Adicionar últimas vendas se houver (precisa garantir que businessData tenha sales)
        if (data.sales && data.sales.length > 0) {
          salesInfo += `\n🆕 **Últimas Vendas:**\n`;
          data.sales.slice(0, 3).forEach(sale => {
            salesInfo += `• R$ ${sale.total.toFixed(2)} - ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
          });
        }

        salesInfo += `\n──────────────────\n\n`;
      }

      return `${salesInfo}💡 **Dicas Rápidas:**
• Mantenha os campeões de venda sempre à vista
• Crie combos para aumentar o ticket médio
• Divulgue ofertas no status do WhatsApp`;
    }

    if (lowerQuestion.includes('estoque') || lowerQuestion.includes('produto')) {
      let stockInfo = '';
      if (data && data.products) {
        const lowStock = data.products.filter(p => p.quantity <= (p.minStock || 5));
        stockInfo = `📦 **Status do Estoque:**\n`;
        stockInfo += `• **Total de Produtos:** ${data.products.length}\n`;

        if (lowStock.length > 0) {
          stockInfo += `• **⚠️ Atenção:** ${lowStock.length} produtos em baixa!\n`;
          lowStock.slice(0, 3).forEach(p => {
            stockInfo += `   - ${p.name} (Qtd: ${p.quantity})\n`;
          });
        } else {
          stockInfo += `• **Situação:** Tudo sob controle! ✅\n`;
        }
        stockInfo += `\n──────────────────\n\n`;
      }

      return `${stockInfo}📦 **Gestão de Estoque Inteligente:**

• **Monitore produtos em baixa** - Evite rupturas de estoque
• **Calcule estoque mínimo** - Baseado no histórico de vendas
• **Organize por categoria** - Facilita controle e localização
• **Faça inventários regulares** - Mantenha dados atualizados
• **Negocie com fornecedores** - Melhores preços e prazos

⚠️ Verifique a seção **Estoque** para produtos em baixa!`;
    }

    if (lowerQuestion.includes('preço') || lowerQuestion.includes('valor') || lowerQuestion.includes('precificação')) {
      return `💰 **Estratégias de Precificação:**

• **Calcule margem de lucro** - Custo + despesas + lucro desejado
• **Pesquise concorrência** - Mantenha preços competitivos
• **Considere valor percebido** - Qualidade justifica preço maior
• **Teste preços diferentes** - A/B testing com produtos similares
• **Ofereça opções** - Produtos básicos, intermediários e premium

📈 Use os **Relatórios** para analisar performance por preço!`;
    }

    if (lowerQuestion.includes('cliente') || lowerQuestion.includes('atendimento') || lowerQuestion.includes('relacionamento')) {
      let clientInfo = '';
      if (data && data.clients) {
        clientInfo = `👥 **Sua Base de Clientes:**\n`;
        clientInfo += `• **Total Cadastrados:** ${data.clients.length}\n`;
        clientInfo += `\n──────────────────\n\n`;
      }

      return `${clientInfo}👥 **Fidelização de Clientes:**

• **Cadastre todos os clientes** - Histórico de compras e preferências
• **Ofereça atendimento personalizado** - Chame pelo nome, lembre preferências
• **Crie programa de fidelidade** - Desconto para clientes frequentes
• **Peça feedback** - Melhore baseado nas sugestões
• **Mantenha contato** - WhatsApp com ofertas especiais

📱 Use a seção **Clientes** para gerenciar relacionamentos!`;
    }

    return `🤖 **Como posso ajudar hoje?**
    
Digite sobre:
• **Vendas** - Para ver seu faturamento
• **Estoque** - Para ver produtos em falta
• **Clientes** - Para ver total de cadastros
• **Preço** - Para dicas de precificação`;
    return `🤖 **Como posso ajudar hoje?**
    
Digite sobre:
• **Vendas** - Para ver seu faturamento
• **Estoque** - Para ver produtos em falta
• **Clientes** - Para ver total de cadastros
• **Preço** - Para dicas de precificação`;
  }

  /**
   * Pergunta principal para a IA
   */
  async askAI(userId: string, question: string, businessData: BusinessData): Promise<AIResponse> {
    try {
      console.log('🤖 AIService.askAI iniciado');
      console.log('👤 Usuário:', userId);
      console.log('❓ Pergunta:', question);

      // Verificar se usuário pode fazer pergunta
      const canAsk = this.canUserAsk(userId);
      if (!canAsk.canAsk) {
        return {
          success: false,
          message: canAsk.reason || 'Limite de uso atingido',
          usage: {
            requests: this.userUsage.get(userId)?.count || 0,
            limit: DAILY_LIMIT
          }
        };
      }

      // Tentar usar IA online
      try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
          throw new Error('API Key não configurada');
        }

        // Gerar contexto do negócio
        const businessContext = this.generateBusinessContext(businessData);

        // Criar prompt completo
        const fullPrompt = `Você é um assistente especializado em gestão empresarial para pequenos negócios.

${businessContext}

PERGUNTA DO USUÁRIO: ${question}

INSTRUÇÕES:
- Responda de forma prática e objetiva
- Use os dados do negócio fornecidos para dar insights específicos
- Forneça dicas acionáveis
- Mantenha tom amigável e profissional
- Limite a resposta a 200 palavras
- Use emojis para deixar mais amigável
- Foque em soluções práticas para pequenos negócios

RESPOSTA:`;

        const aiResponse = await this.callGeminiAPI(fullPrompt);

        // Registrar uso
        this.recordUsage(userId);

        console.log('✅ Resposta da IA obtida com sucesso');

        return {
          success: true,
          message: aiResponse,
          usage: {
            requests: this.userUsage.get(userId)?.count || 0,
            limit: DAILY_LIMIT
          }
        };

      } catch (aiError) {
        console.warn('⚠️ IA indisponível, usando resposta offline:', aiError);

        // Fallback para resposta offline
        const offlineResponse = this.getOfflineResponse(question, businessData);

        return {
          success: true,
          message: offlineResponse,
          usage: {
            requests: this.userUsage.get(userId)?.count || 0,
            limit: DAILY_LIMIT
          }
        };
      }

    } catch (error) {
      console.error('❌ Erro geral no AIService:', error);

      return {
        success: false,
        message: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        usage: {
          requests: this.userUsage.get(userId)?.count || 0,
          limit: DAILY_LIMIT
        }
      };
    }
  }

  /**
   * Obter estatísticas de uso
   */
  getUsageStats(userId: string): { requests: number; limit: number; remaining: number } {
    const today = new Date().toDateString();
    const userStats = this.userUsage.get(userId);

    if (!userStats || userStats.date !== today) {
      return { requests: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT };
    }

    return {
      requests: userStats.count,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - userStats.count)
    };
  }
}

// Exportar instância singleton
export const aiService = AIService.getInstance();

// Funções de conveniência
export const askBusinessAI = (userId: string, question: string, businessData: BusinessData) =>
  aiService.askAI(userId, question, businessData);

export const getAIUsageStats = (userId: string) =>
  aiService.getUsageStats(userId);
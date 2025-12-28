import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '../config/firebase';

// Inicializar cliente Groq
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Necessário para usar no browser
});

export async function sendMessageToAIWithContext(userInput: string, businessContext: string): Promise<string> {
  try {
    console.log('🤖 Enviando para Groq AI...');
    
    // Contexto do sistema com dados reais
    const systemPrompt = `Você é um assistente virtual inteligente e consultor de negócios E finanças pessoais do "Caderninho Digital".

${businessContext}

Você é um especialista em gestão empresarial E finanças pessoais e pode:

📊 GESTÃO EMPRESARIAL:
✅ Analisar os dados REAIS do negócio do usuário
✅ Dar insights personalizados baseados nos números
✅ Sugerir ações práticas para melhorar vendas
✅ Responder perguntas sobre vendas, clientes, estoque
✅ Alertar sobre problemas (estoque baixo, fiados altos, etc)
✅ Dar dicas de gestão e estratégias comerciais

💰 GESTÃO PESSOAL:
✅ Analisar receitas e despesas pessoais
✅ Dar dicas de economia e controle financeiro
✅ Sugerir como reduzir gastos em categorias específicas
✅ Ajudar a criar metas de economia
✅ Alertar sobre gastos excessivos
✅ Dar conselhos de educação financeira

Seja sempre:
- Específico e use os dados reais fornecidos (tanto do negócio quanto pessoais)
- Prático e objetivo
- Amigável em português brasileiro
- Use emojis moderadamente
- Diferencie claramente entre finanças do negócio e pessoais quando relevante

Responda usando os DADOS REAIS acima para dar uma resposta precisa e personalizada.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      model: 'llama-3.3-70b-versatile', // Modelo rápido e eficiente da Groq
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    console.log('✅ Resposta recebida da Groq');
    
    return response;
  } catch (error: any) {
    console.error('Erro na API da Groq:', error);
    return getFallbackResponse(userInput);
  }
}

export async function sendMessageToAI(userInput: string): Promise<string> {
  try {
    console.log('🤖 Enviando para Groq AI...');
    
    // Contexto do sistema
    const systemPrompt = `Você é um assistente virtual inteligente e consultor de negócios do "Caderninho Digital", um sistema de gestão empresarial para pequenos negócios brasileiros.

Você é um especialista em:
🎯 **Gestão Empresarial**: Dicas para melhorar vendas, fidelizar clientes, controlar estoque
💡 **Estratégias de Negócio**: Como aumentar lucro, reduzir custos, precificar produtos
📊 **Análise de Dados**: Interpretar relatórios, identificar tendências, tomar decisões
💰 **Finanças**: Controle de caixa, gestão de fiados, planejamento financeiro
🎓 **Educação**: Ensinar boas práticas de gestão e uso do sistema

Funcionalidades do Caderninho Digital:
📊 Vendas: Registrar vendas (Dinheiro, PIX, Cartão, Fiado)
👥 Clientes: Cadastrar e gerenciar clientes
📦 Estoque: Controlar produtos e alertas
📝 Fiados: Gerenciar vendas a prazo
💰 Financeiro: Receitas e despesas
📈 Relatórios: Análises completas

Você pode ajudar com:
✅ Dúvidas sobre o sistema
✅ Dicas de gestão empresarial
✅ Estratégias para aumentar vendas
✅ Como lidar com clientes inadimplentes
✅ Precificação de produtos
✅ Controle de estoque eficiente
✅ Análise de dados e relatórios
✅ Planejamento financeiro
✅ Marketing para pequenos negócios
✅ Atendimento ao cliente

Seja sempre:
- Amigável e prestativo em português brasileiro
- Prático e objetivo
- Use emojis moderadamente
- Dê exemplos reais quando possível
- Seja um verdadeiro consultor de negócios`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    console.log('✅ Resposta recebida da Groq');
    
    return response;
  } catch (error: any) {
    console.error('Erro na API da Groq:', error);
    
    // Fallback para respostas básicas se a API falhar
    return getFallbackResponse(userInput);
  }
}

function getFallbackResponse(userInput: string): string {
  const input = userInput.toLowerCase();

  if (input.includes('venda') || input.includes('vendas')) {
    return '📊 Para registrar vendas, acesse a página "Vendas" no menu. Lá você pode registrar novas vendas com diferentes formas de pagamento e ver o histórico completo!';
  }
  
  if (input.includes('cliente') || input.includes('clientes')) {
    return '👥 Você pode gerenciar seus clientes na página "Clientes". Lá é possível cadastrar novos clientes e ver o histórico de compras de cada um!';
  }
  
  if (input.includes('estoque') || input.includes('produto')) {
    return '📦 Na página "Estoque" você pode adicionar produtos, controlar quantidades e ver alertas de estoque baixo!';
  }
  
  if (input.includes('fiado') || input.includes('pendente') || input.includes('dívida')) {
    return '📝 Na página "Fiados" você pode ver todas as pendências, registrar pagamentos e compartilhar cobranças via WhatsApp!';
  }
  
  if (input.includes('relatório') || input.includes('relatorio')) {
    return '📈 Acesse "Relatórios" para ver análises completas: vendas por período, produtos mais vendidos, clientes mais ativos e muito mais!';
  }
  
  if (input.includes('ajuda') || input.includes('help')) {
    return '💡 Posso te ajudar com:\n\n• Informações sobre vendas\n• Gestão de clientes\n• Controle de estoque\n• Fiados e pendências\n• Relatórios e análises\n\nO que você gostaria de saber?';
  }

  if (input.includes('oi') || input.includes('olá') || input.includes('ola')) {
    return '👋 Olá! Como posso ajudar você hoje?';
  }

  return '🤔 Entendi sua pergunta! Posso te ajudar com informações sobre vendas, clientes, estoque, fiados e relatórios. O que você gostaria de saber especificamente?';
}

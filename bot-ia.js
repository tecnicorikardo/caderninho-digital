// Chatbot IA - Caderninho Digital
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(require('cors')());

// Configurações das variáveis de ambiente
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SYSTEM_API_URL = process.env.SYSTEM_API_URL || 'https://caderninhodigital.netlify.app';

console.log('🤖 Iniciando Chatbot IA - Caderninho Digital...');
console.log('🔑 Telegram Token:', TELEGRAM_TOKEN ? 'Configurado' : 'ERRO: Não encontrado');
console.log('🧠 Groq API:', GROQ_API_KEY ? 'Configurado' : 'ERRO: Não encontrado');
console.log('🌐 Sistema URL:', SYSTEM_API_URL);

if (!TELEGRAM_TOKEN || !GROQ_API_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente obrigatórias não configuradas!');
  process.exit(1);
}

// Inicializar Firebase Admin
let db = null;
let firebaseConnected = false;

try {
  // Configuração do Firebase usando Web SDK config
  const firebaseConfig = {
    apiKey: "AIzaSyBwJQ8_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8E",
    authDomain: "caderninho-digital-2024.firebaseapp.com",
    projectId: "caderninho-digital-2024",
    storageBucket: "caderninho-digital-2024.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'caderninho-digital-2024'
    });
  }
  db = admin.firestore();
  firebaseConnected = true;
  console.log('🔥 Firebase Admin conectado');
} catch (error) {
  console.error('❌ Firebase não conectado:', error.message);
  console.log('⚠️  Continuando sem Firebase - dados em tempo real não disponíveis');
  firebaseConnected = false;
}

// Inicializar serviços
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Armazenamento em memória
const users = new Map();

// Funções para buscar dados reais do Firebase
async function getVendasData() {
  if (!firebaseConnected || !db) {
    // Dados simulados quando Firebase não está conectado
    return {
      totalHoje: '0.00',
      quantidadeHoje: 0,
      mediaHoje: '0.00',
      totalVendas: 0,
      simulado: true
    };
  }
  
  try {
    console.log('🔍 Buscando vendas no Firebase...');
    const vendasSnapshot = await db.collection('sales').where('userId', '==', 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2').get();
    console.log(`📊 Vendas encontradas: ${vendasSnapshot.size}`);
    
    const vendas = vendasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('📋 Vendas processadas:', vendas.length);
    
    const hoje = new Date().toDateString();
    const vendasHoje = vendas.filter(venda => {
      const dataVenda = new Date(venda.createdAt?.seconds * 1000 || venda.createdAt || Date.now()).toDateString();
      return dataVenda === hoje;
    });
    
    const totalHoje = vendasHoje.reduce((sum, venda) => sum + (venda.total || 0), 0);
    const mediaHoje = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0;
    
    return {
      totalHoje: totalHoje.toFixed(2),
      quantidadeHoje: vendasHoje.length,
      mediaHoje: mediaHoje.toFixed(2),
      totalVendas: vendas.length,
      simulado: false
    };
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error);
    return {
      totalHoje: '0.00',
      quantidadeHoje: 0,
      mediaHoje: '0.00',
      totalVendas: 0,
      simulado: true
    };
  }
}

async function getClientesData() {
  if (!firebaseConnected || !db) {
    return { total: 0, novos: 0, ativos: 0, simulado: true };
  }
  
  try {
    const clientesSnapshot = await db.collection('clients').where('userId', '==', 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2').get();
    const clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const clientesNovos = clientes.filter(cliente => {
      if (!cliente.dataCadastro) return false;
      const dataCadastro = new Date(cliente.dataCadastro.seconds * 1000 || cliente.dataCadastro);
      return dataCadastro.getMonth() === mesAtual && dataCadastro.getFullYear() === anoAtual;
    });
    
    return {
      total: clientes.length,
      novos: clientesNovos.length,
      ativos: clientes.filter(c => c.ativo !== false).length,
      simulado: false
    };
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    return { total: 0, novos: 0, ativos: 0, simulado: true };
  }
}

async function getEstoqueData() {
  if (!firebaseConnected || !db) {
    return { total: 0, baixoEstoque: 0, disponivel: 0, simulado: true };
  }
  
  try {
    const produtosSnapshot = await db.collection('products').where('userId', '==', 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2').get();
    const produtos = produtosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const baixoEstoque = produtos.filter(produto => (produto.estoque || 0) < (produto.estoqueMinimo || 5));
    const disponivel = produtos.filter(produto => (produto.estoque || 0) > 0);
    
    return {
      total: produtos.length,
      baixoEstoque: baixoEstoque.length,
      disponivel: disponivel.length,
      simulado: false
    };
  } catch (error) {
    console.error('❌ Erro ao buscar estoque:', error);
    return { total: 0, baixoEstoque: 0, disponivel: 0, simulado: true };
  }
}

// Webhook endpoint
app.post(`/webhook`, async (req, res) => {
  try {
    console.log('📨 Webhook recebido');
    
    const update = req.body;
    
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.sendStatus(500);
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Caderninho Digital Chatbot IA',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    integrations: {
      telegram: !!TELEGRAM_TOKEN,
      groq: !!GROQ_API_KEY,
      system: SYSTEM_API_URL
    }
  });
});

// Processar mensagens
async function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from.id.toString();
  const text = message.text;
  
  console.log('💬 Mensagem de', message.from.first_name, ':', text);
  
  try {
    // Registrar usuário
    if (!users.has(userId)) {
      users.set(userId, {
        id: userId,
        chatId: chatId,
        firstName: message.from.first_name,
        lastName: message.from.last_name,
        username: message.from.username,
        isAuthenticated: false,
        createdAt: new Date()
      });
      console.log('👤 Novo usuário:', message.from.first_name);
    }
    
    // Processar comandos ou linguagem natural
    if (text.startsWith('/')) {
      await handleCommand(chatId, userId, text);
    } else {
      await handleNaturalLanguage(chatId, userId, text);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await sendMessage(chatId, '❌ Desculpe, ocorreu um erro. Tente novamente.');
  }
}

// Processar comandos
async function handleCommand(chatId, userId, command) {
  console.log('🔧 Comando:', command);
  
  switch (command) {
    case '/start':
      await sendWelcomeMessage(chatId, userId);
      break;
      
    case '/help':
      await sendMessage(chatId, `❓ *Ajuda - Caderninho Digital Bot*\n\n🤖 Sou seu assistente inteligente!\n\n*Comandos:*\n/start - Menu inicial\n/help - Esta ajuda\n/menu - Menu principal\n\n*Converse naturalmente:*\n"Quanto vendi hoje?"\n"Quais são meus clientes?"\n"Como está o estoque?"`);
      break;
      
    case '/menu':
      await sendMainMenu(chatId, userId);
      break;
      
    default:
      await sendMessage(chatId, '❓ Comando não reconhecido. Use /help para ajuda.');
  }
}

// Processar linguagem natural com Groq AI
async function handleNaturalLanguage(chatId, userId, text) {
  console.log('🧠 Processando com IA:', text);
  
  try {
    const user = users.get(userId);
    
    // Buscar dados reais para contexto da IA
    const vendasData = await getVendasData();
    const clientesData = await getClientesData();
    const estoqueData = await getEstoqueData();
    
    const contextData = `
DADOS ATUAIS DO NEGÓCIO:
- Vendas hoje: R$ ${vendasData.totalHoje} (${vendasData.quantidadeHoje} vendas)
- Total de clientes: ${clientesData.total} (${clientesData.novos} novos este mês)
- Produtos em estoque: ${estoqueData.total} (${estoqueData.baixoEstoque} com baixo estoque)
- Status dos dados: ${vendasData.simulado ? 'Sem dados cadastrados' : 'Dados reais do sistema'}`;

    const systemPrompt = `Você é um assistente inteligente especializado em gestão comercial para o "Caderninho Digital".

PERSONALIDADE:
- Seja conversacional, amigável e proativo
- Use emojis apropriados
- Faça perguntas para entender melhor as necessidades
- Ofereça insights e sugestões baseadas nos dados
- Seja específico e prático nas respostas

CAPACIDADES:
- Analisar vendas e faturamento
- Gerenciar clientes e relacionamento
- Controlar estoque e produtos
- Gerar insights de negócio
- Sugerir ações para melhorar resultados
- Responder dúvidas sobre gestão comercial

${contextData}

INSTRUÇÕES:
- Use os dados reais acima para dar respostas precisas
- Se não houver dados, oriente sobre como cadastrar no sistema
- Seja proativo: sugira ações baseadas nos dados
- Faça perguntas para entender melhor o que o usuário precisa
- Ofereça botões de ação quando relevante

Usuário: ${user?.firstName || 'Usuário'}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 1200
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem. Pode reformular?';
    
    console.log('🤖 Resposta da IA gerada');
    
    // Adicionar botões contextuais inteligentes
    const buttons = getSmartContextButtons(text, vendasData, clientesData, estoqueData);
    
    if (buttons.length > 0) {
      await sendMessageWithButtons(chatId, aiResponse, buttons);
    } else {
      await sendMessage(chatId, aiResponse);
    }
    
  } catch (error) {
    console.error('❌ Erro na IA:', error);
    await sendMessage(chatId, '🤖 Ops! Tive um problema para processar isso. Pode tentar de novo ou usar /menu para ver as opções? 😅');
  }
}

// Botões contextuais inteligentes
function getSmartContextButtons(text, vendasData, clientesData, estoqueData) {
  const buttons = [];
  const lowerText = text.toLowerCase();
  
  // Botões baseados no contexto da conversa
  if (lowerText.includes('venda') || lowerText.includes('faturamento') || lowerText.includes('receita')) {
    buttons.push([{ text: '📊 Ver Vendas Detalhadas', callback_data: 'vendas_detalhadas' }]);
    if (vendasData.quantidadeHoje === 0) {
      buttons.push([{ text: '➕ Como Registrar Venda', callback_data: 'como_vender' }]);
    }
  }
  
  if (lowerText.includes('cliente') || lowerText.includes('consumidor')) {
    buttons.push([{ text: '👥 Relatório de Clientes', callback_data: 'clientes_detalhados' }]);
    if (clientesData.total === 0) {
      buttons.push([{ text: '➕ Como Cadastrar Cliente', callback_data: 'como_cadastrar_cliente' }]);
    }
  }
  
  if (lowerText.includes('estoque') || lowerText.includes('produto') || lowerText.includes('mercadoria')) {
    buttons.push([{ text: '📦 Status do Estoque', callback_data: 'estoque_detalhado' }]);
    if (estoqueData.baixoEstoque > 0) {
      buttons.push([{ text: '⚠️ Produtos em Falta', callback_data: 'produtos_falta' }]);
    }
  }
  
  // Sugestões inteligentes baseadas nos dados
  if (vendasData.quantidadeHoje > 0 && clientesData.total > 0) {
    buttons.push([{ text: '📈 Análise de Performance', callback_data: 'analise_performance' }]);
  }
  
  // Botões de ação rápida
  const quickActions = [];
  if (vendasData.simulado) {
    quickActions.push({ text: '🚀 Começar a Usar', callback_data: 'tutorial_inicio' });
  } else {
    quickActions.push({ text: '📊 Dashboard', callback_data: 'dashboard' });
  }
  quickActions.push({ text: '❓ Ajuda', callback_data: 'ajuda_completa' });
  
  if (quickActions.length > 0) {
    buttons.push(quickActions);
  }
  
  return buttons;
}

// Processar cliques em botões
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  console.log('🔘 Botão clicado:', data);
  
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    switch (data) {
      case 'menu':
        await sendMainMenu(chatId, callbackQuery.from.id.toString());
        break;
        
      case 'vendas':
      case 'vendas_detalhadas':
        await handleVendasDetalhadas(chatId);
        break;
        
      case 'clientes':
      case 'clientes_detalhados':
        await handleClientesDetalhados(chatId);
        break;
        
      case 'estoque':
      case 'estoque_detalhado':
        await handleEstoqueDetalhado(chatId);
        break;
        
      case 'como_vender':
        await sendMessage(chatId, `📝 *Como Registrar uma Venda*\n\n1️⃣ Acesse: ${SYSTEM_API_URL}\n2️⃣ Vá em "Nova Venda"\n3️⃣ Selecione o cliente\n4️⃣ Adicione os produtos\n5️⃣ Escolha a forma de pagamento\n6️⃣ Confirme a venda\n\n✅ *Pronto!* A venda aparecerá aqui no bot automaticamente!`);
        break;
        
      case 'como_cadastrar_cliente':
        await sendMessage(chatId, `👤 *Como Cadastrar Cliente*\n\n1️⃣ Acesse: ${SYSTEM_API_URL}\n2️⃣ Vá em "Clientes"\n3️⃣ Clique em "Novo Cliente"\n4️⃣ Preencha nome e telefone\n5️⃣ Salve o cadastro\n\n✅ *Dica:* Clientes cadastrados facilitam vendas fiado e controle de pagamentos!`);
        break;
        
      case 'produtos_falta':
        await handleProdutosFalta(chatId);
        break;
        
      case 'analise_performance':
        await handleAnalisePerformance(chatId);
        break;
        
      case 'dashboard':
        await handleDashboard(chatId);
        break;
        
      case 'tutorial_inicio':
        await sendTutorialInicio(chatId);
        break;
        
      case 'ajuda_completa':
        await sendAjudaCompleta(chatId);
        break;
        
      case 'auto_login':
        const realUserId = 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2';
        const success = await authenticateUser(callbackQuery.from.id, realUserId);
        
        if (success) {
          bot.sendMessage(chatId, `✅ *Login automático realizado!*\n\n🎉 Agora você pode consultar seus dados reais!\n\n💬 *Teste:* "Quanto vendi hoje?"`, { parse_mode: 'Markdown' });
        } else {
          bot.sendMessage(chatId, `❌ *Erro no login*\n\nTente: \`/forcelogin\``, { parse_mode: 'Markdown' });
        }
        break;
        
      case 'como_cadastrar_produto':
        await sendMessage(chatId, `📦 *Como Cadastrar Produtos*\n\n1️⃣ Acesse: ${SYSTEM_API_URL}\n2️⃣ Vá em "Produtos"\n3️⃣ Clique em "Novo Produto"\n4️⃣ Preencha:\n   • Nome do produto\n   • Preço de venda\n   • Quantidade em estoque\n   • Estoque mínimo (opcional)\n5️⃣ Salve o produto\n\n✅ *Dica:* Configure estoque mínimo para receber alertas automáticos!`);
        break;
        
      case 'relatorios':
        await handleDashboard(chatId);
        break;
        
      default:
        await sendMessage(chatId, '❓ Hmm, não reconheci essa ação. Que tal tentar o /menu? 🤔');
    }
    
  } catch (error) {
    console.error('❌ Erro no callback:', error);
  }
}

// Mensagens específicas
async function sendWelcomeMessage(chatId, userId) {
  const user = users.get(userId);
  const name = user?.firstName || 'Usuário';
  
  // FAZER LOGIN AUTOMÁTICO COM DADOS REAIS
  console.log(`🔐 Fazendo login automático para ${name}...`);
  
  // Simular autenticação com dados reais
  users.set(userId, {
    ...user,
    isAuthenticated: true,
    firebaseUserId: 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2', // Seu userId real
    authenticatedAt: new Date()
  });
  
  const message = `🎉 *Olá, ${name}! Bem-vindo!*

✅ *Login automático realizado!*
🆔 *Conectado à sua conta empresarial*

🤖 *Caderninho Digital Chatbot IA*
Seu assistente inteligente para gestão do negócio.

💬 *Experimente agora:*
• "Quanto vendi hoje?"
• "Como está meu estoque?"
• "Quem são meus clientes?"
• "Resumo do mês"

🌐 *Sistema:* https://web-gestao-37a85.web.app`;
  
  const buttons = [
    [
      { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
      { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' }
    ],
    [
      { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' },
      { text: '📈 Dashboard', callback_data: 'dashboard' }
    ]
  ];
  
  await sendMessageWithButtons(chatId, message, buttons);
}

async function sendMainMenu(chatId, userId) {
  try {
    // Buscar dados para menu dinâmico
    const vendasData = await getVendasData();
    const clientesData = await getClientesData();
    const estoqueData = await getEstoqueData();
    
    let statusEmoji = '🟢';
    let statusText = 'Sistema operacional';
    
    if (vendasData.simulado) {
      statusEmoji = '🟡';
      statusText = 'Configure seus dados';
    }
    
    const message = `🏠 *Menu Principal*\n\n${statusEmoji} *Status:* ${statusText}\n\n💰 *Hoje:* R$ ${vendasData.totalHoje} (${vendasData.quantidadeHoje} vendas)\n👥 *Clientes:* ${clientesData.total}\n📦 *Produtos:* ${estoqueData.total}\n\n💬 *Converse naturalmente ou use os botões:*`;

    const buttons = [
      [
        { text: '📊 Vendas Detalhadas', callback_data: 'vendas_detalhadas' },
        { text: '👥 Gestão Clientes', callback_data: 'clientes_detalhados' }
      ],
      [
        { text: '📦 Controle Estoque', callback_data: 'estoque_detalhado' },
        { text: '📈 Dashboard Executivo', callback_data: 'dashboard' }
      ]
    ];
    
    // Adicionar botões condicionais
    if (vendasData.simulado) {
      buttons.push([{ text: '🚀 Tutorial Início', callback_data: 'tutorial_inicio' }]);
    } else {
      buttons.push([{ text: '📈 Análise Performance', callback_data: 'analise_performance' }]);
    }
    
    buttons.push([{ text: '❓ Central de Ajuda', callback_data: 'ajuda_completa' }]);
    
    await sendMessageWithButtons(chatId, message, buttons);
  } catch (error) {
    console.error('❌ Erro no menu:', error);
    // Fallback para menu simples
    const message = `🏠 *Menu Principal*\n\nEscolha uma opção:`;
    const buttons = [
      [
        { text: '📊 Vendas', callback_data: 'vendas' },
        { text: '👥 Clientes', callback_data: 'clientes' }
      ],
      [
        { text: '📦 Estoque', callback_data: 'estoque' },
        { text: '❓ Ajuda', callback_data: 'ajuda_completa' }
      ]
    ];
    await sendMessageWithButtons(chatId, message, buttons);
  }
}

// Funções de envio
async function sendMessage(chatId, text) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    console.log('✅ Mensagem enviada');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
  }
}

async function sendMessageWithButtons(chatId, text, buttons) {
  try {
    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    };
    
    await bot.sendMessage(chatId, text, options);
    console.log('✅ Mensagem com botões enviada');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem com botões:', error);
  }
}

// ========== FUNÇÕES INTERATIVAS AVANÇADAS ==========

async function handleVendasDetalhadas(chatId) {
  try {
    console.log('📊 Buscando dados de vendas detalhadas...');
    const vendasData = await getVendasData();
    
    if (vendasData.simulado) {
      const message = `📊 *Relatório de Vendas*\n\n❌ *Nenhuma venda registrada ainda*\n\n🚀 *Como começar:*\n• Acesse: ${SYSTEM_API_URL}\n• Registre sua primeira venda\n• Volte aqui para ver os dados!\n\n💡 *Dica:* Quanto mais vendas registrar, mais insights posso te dar!`;
      
      const buttons = [
        [{ text: '➕ Como Registrar Venda', callback_data: 'como_vender' }],
        [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
      ];
      
      await sendMessageWithButtons(chatId, message, buttons);
    } else {
      const message = `📊 *Relatório Detalhado de Vendas*\n\n💰 *Hoje:*\n• Faturamento: R$ ${vendasData.totalToday || vendasData.totalHoje || '0.00'}\n• Quantidade: ${vendasData.countToday || vendasData.quantidadeHoje || 0} vendas\n• Ticket médio: R$ ${vendasData.averageTicket || vendasData.mediaHoje || '0.00'}\n\n📈 *Geral:*\n• Total de vendas: ${vendasData.sales?.length || vendasData.totalVendas || 0}\n\n🎯 *Status:* Dados reais do Firebase\n• UserID: ECYMxTpm46b2iNUNU0aNHIbdfTJ2`;
      
      const buttons = [
        [
          { text: '📈 Análise Performance', callback_data: 'analise_performance' },
          { text: '👥 Ver Clientes', callback_data: 'clientes' }
        ],
        [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
      ];
      
      await sendMessageWithButtons(chatId, message, buttons);
    }
  } catch (error) {
    console.error('❌ Erro em vendas detalhadas:', error);
    await sendMessage(chatId, '❌ Ops! Erro ao buscar dados de vendas. Tente novamente.');
  }
}

async function handleClientesDetalhados(chatId) {
  try {
    const clientesData = await getClientesData();
    
    if (clientesData.simulado || clientesData.total === 0) {
      const message = `👥 *Gestão de Clientes*\n\n❌ *Nenhum cliente cadastrado*\n\n🎯 *Por que cadastrar clientes?*\n• Vendas fiado organizadas\n• Histórico de compras\n• Controle de pagamentos\n• Relacionamento melhor\n\n🚀 *Vamos começar!*`;
      
      const buttons = [
        [{ text: '➕ Como Cadastrar Cliente', callback_data: 'como_cadastrar_cliente' }],
        [{ text: '📊 Ver Vendas', callback_data: 'vendas' }],
        [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
      ];
      
      await sendMessageWithButtons(chatId, message, buttons);
    } else {
      const message = `👥 *Relatório de Clientes*\n\n📊 *Resumo:*\n• Total: ${clientesData.total} clientes\n• Ativos: ${clientesData.ativos}\n• Novos este mês: ${clientesData.novos}\n\n💡 *Insights:*\n${clientesData.novos > 0 ? '🎉 Parabéns! Você está conquistando novos clientes!' : '💪 Que tal uma campanha para atrair novos clientes?'}\n\n🎯 *Dicas:*\n• Mantenha contato regular\n• Ofereça promoções especiais\n• Peça indicações`;
      
      const buttons = [
        [
          { text: '📊 Ver Vendas', callback_data: 'vendas' },
          { text: '📦 Ver Estoque', callback_data: 'estoque' }
        ],
        [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
      ];
      
      await sendMessageWithButtons(chatId, message, buttons);
    }
  } catch (error) {
    console.error('❌ Erro em clientes detalhados:', error);
    await sendMessage(chatId, '❌ Erro ao buscar dados de clientes. Tente novamente.');
  }
}

async function handleEstoqueDetalhado(chatId) {
  try {
    const estoqueData = await getEstoqueData();
    
    if (estoqueData.simulado || estoqueData.total === 0) {
      const message = `📦 *Controle de Estoque*\n\n❌ *Nenhum produto cadastrado*\n\n🎯 *Benefícios do controle:*\n• Evita produtos em falta\n• Controla custos\n• Otimiza compras\n• Reduz perdas\n\n🚀 *Comece agora!*`;
      
      const buttons = [
        [{ text: '➕ Como Cadastrar Produtos', callback_data: 'como_cadastrar_produto' }],
        [{ text: '📊 Ver Vendas', callback_data: 'vendas' }],
        [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
      ];
      
      await sendMessageWithButtons(chatId, message, buttons);
    } else {
      let alertas = '';
      if (estoqueData.baixoEstoque > 0) {
        alertas = `\n⚠️ *ATENÇÃO:* ${estoqueData.baixoEstoque} produtos com estoque baixo!`;
      }
      
      const message = `📦 *Relatório de Estoque*\n\n📊 *Status:*\n• Total de produtos: ${estoqueData.total}\n• Disponíveis: ${estoqueData.disponivel}\n• Baixo estoque: ${estoqueData.baixoEstoque}${alertas}\n\n💡 *Dicas:*\n• Monitore produtos em falta\n• Programe reposições\n• Analise giro de estoque`;
      
      const buttons = [];
      if (estoqueData.baixoEstoque > 0) {
        buttons.push([{ text: '⚠️ Ver Produtos em Falta', callback_data: 'produtos_falta' }]);
      }
      buttons.push([
        { text: '📊 Ver Vendas', callback_data: 'vendas' },
        { text: '👥 Ver Clientes', callback_data: 'clientes' }
      ]);
      buttons.push([{ text: '🏠 Menu Principal', callback_data: 'menu' }]);
      
      await sendMessageWithButtons(chatId, message, buttons);
    }
  } catch (error) {
    console.error('❌ Erro em estoque detalhado:', error);
    await sendMessage(chatId, '❌ Erro ao buscar dados de estoque. Tente novamente.');
  }
}

async function handleProdutosFalta(chatId) {
  const message = `⚠️ *Produtos com Estoque Baixo*\n\n🔍 *Verificando produtos...*\n\n💡 *Ações recomendadas:*\n• Reabasteça os produtos em falta\n• Configure alertas automáticos\n• Analise quais vendem mais\n\n📋 *Para ver detalhes:*\nAcesse: ${SYSTEM_API_URL}/estoque`;
  
  const buttons = [
    [{ text: '📦 Voltar ao Estoque', callback_data: 'estoque' }],
    [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
  ];
  
  await sendMessageWithButtons(chatId, message, buttons);
}

async function handleAnalisePerformance(chatId) {
  try {
    const vendasData = await getVendasData();
    const clientesData = await getClientesData();
    
    if (vendasData.simulado) {
      await sendMessage(chatId, '📈 *Análise de Performance*\n\n❌ Dados insuficientes para análise.\n\nRegistre algumas vendas primeiro!');
      return;
    }
    
    let insights = '📈 *Análise de Performance*\n\n';
    
    // Análise de vendas
    if (vendasData.quantidadeHoje > 0) {
      insights += `🎉 *Ótimo!* Você já fez ${vendasData.quantidadeHoje} vendas hoje!\n`;
    } else {
      insights += `💪 *Oportunidade:* Ainda não há vendas hoje. Que tal uma promoção?\n`;
    }
    
    // Análise de clientes
    if (clientesData.novos > 0) {
      insights += `👥 *Crescimento:* ${clientesData.novos} novos clientes este mês!\n`;
    }
    
    // Sugestões
    insights += `\n💡 *Sugestões:*\n`;
    if (vendasData.quantidadeHoje === 0) {
      insights += `• Faça contato com clientes antigos\n• Ofereça promoções especiais\n`;
    }
    if (clientesData.total < 10) {
      insights += `• Foque em conquistar novos clientes\n• Peça indicações\n`;
    }
    
    const buttons = [
      [
        { text: '📊 Ver Vendas', callback_data: 'vendas' },
        { text: '👥 Ver Clientes', callback_data: 'clientes' }
      ],
      [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
    ];
    
    await sendMessageWithButtons(chatId, insights, buttons);
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    await sendMessage(chatId, '❌ Erro ao gerar análise. Tente novamente.');
  }
}

async function handleDashboard(chatId) {
  try {
    const vendasData = await getVendasData();
    const clientesData = await getClientesData();
    const estoqueData = await getEstoqueData();
    
    const message = `📊 *Dashboard Executivo*\n\n💰 *Vendas Hoje:*\n• Faturamento: R$ ${vendasData.totalHoje}\n• Quantidade: ${vendasData.quantidadeHoje}\n\n👥 *Clientes:*\n• Total: ${clientesData.total}\n• Novos este mês: ${clientesData.novos}\n\n📦 *Estoque:*\n• Produtos: ${estoqueData.total}\n• Alertas: ${estoqueData.baixoEstoque}\n\n🎯 *Status:* ${vendasData.simulado ? 'Configure o sistema' : 'Operacional'}`;
    
    const buttons = [
      [
        { text: '📈 Análise Completa', callback_data: 'analise_performance' },
        { text: '⚠️ Alertas', callback_data: 'produtos_falta' }
      ],
      [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
    ];
    
    await sendMessageWithButtons(chatId, message, buttons);
  } catch (error) {
    console.error('❌ Erro no dashboard:', error);
    await sendMessage(chatId, '❌ Erro ao carregar dashboard. Tente novamente.');
  }
}

async function sendTutorialInicio(chatId) {
  const message = `🚀 *Tutorial - Primeiros Passos*\n\n*Bem-vindo ao Caderninho Digital!*\n\n📋 *Passo a passo:*\n\n1️⃣ *Acesse o sistema:*\n${SYSTEM_API_URL}\n\n2️⃣ *Cadastre produtos:*\n• Nome, preço, estoque\n• Organize por categorias\n\n3️⃣ *Cadastre clientes:*\n• Nome e telefone\n• Para vendas fiado\n\n4️⃣ *Registre vendas:*\n• Selecione produtos\n• Escolha cliente\n• Defina pagamento\n\n5️⃣ *Acompanhe aqui no bot:*\n• Relatórios automáticos\n• Insights inteligentes\n\n🎯 *Pronto! Seu negócio organizado!*`;
  
  const buttons = [
    [{ text: '📊 Ver Dashboard', callback_data: 'dashboard' }],
    [{ text: '❓ Ajuda Completa', callback_data: 'ajuda_completa' }],
    [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
  ];
  
  await sendMessageWithButtons(chatId, message, buttons);
}

async function sendAjudaCompleta(chatId) {
  const message = `❓ *Central de Ajuda*\n\n🤖 *Sobre o Bot:*\n• Sou seu assistente IA\n• Analiso dados do seu negócio\n• Dou insights e sugestões\n• Respondo perguntas naturalmente\n\n💬 *Como usar:*\n• Digite perguntas normalmente\n• "Quanto vendi hoje?"\n• "Como estão os clientes?"\n• "Preciso repor estoque?"\n\n🔧 *Comandos úteis:*\n/start - Menu inicial\n/menu - Menu principal\n/help - Esta ajuda\n\n🌐 *Sistema Web:*\n${SYSTEM_API_URL}\n\n📞 *Suporte:*\nSe tiver dúvidas, me pergunte!\nEstou aqui para ajudar! 😊`;
  
  const buttons = [
    [
      { text: '🚀 Tutorial', callback_data: 'tutorial_inicio' },
      { text: '📊 Dashboard', callback_data: 'dashboard' }
    ],
    [{ text: '🏠 Menu Principal', callback_data: 'menu' }]
  ];
  
  await sendMessageWithButtons(chatId, message, buttons);
}

// Inicializar servidor
async function startServer() {
  try {
    console.log('🧹 Limpando webhook...');
    await bot.deleteWebHook();
    
    console.log('⏳ Aguardando...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const botInfo = await bot.getMe();
    console.log('🤖 Bot conectado:', botInfo.username);
    console.log('🆔 Bot ID:', botInfo.id);
    
    app.listen(port, async () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log('📱 Chatbot IA pronto!');
      
      // Configurar webhook automaticamente se estiver no Render
      const webhookUrl = process.env.RENDER_EXTERNAL_URL;
      if (webhookUrl) {
        try {
          console.log('🔗 Configurando webhook automaticamente...');
          await bot.setWebHook(`${webhookUrl}/webhook`);
          console.log('✅ Webhook configurado:', `${webhookUrl}/webhook`);
        } catch (error) {
          console.error('❌ Erro ao configurar webhook:', error);
          console.log('📋 Configure manualmente:');
          console.log(`curl -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook -d "url=${webhookUrl}/webhook"`);
        }
      } else {
        console.log('📋 Para configurar webhook manualmente:');
        console.log(`curl -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook -d "url=https://seu-app.onrender.com/webhook"`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer();
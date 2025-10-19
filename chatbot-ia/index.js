// Chatbot IA - Caderninho Digital
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
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

// Inicializar serviços
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Armazenamento em memória
const users = new Map();

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
    
    const systemPrompt = `Você é um assistente inteligente para o sistema "Caderninho Digital", um sistema de gestão comercial.

Você pode ajudar com:
- Consultar vendas e faturamento
- Gerenciar clientes
- Controlar estoque
- Gerar relatórios
- Responder dúvidas sobre o negócio

Responda de forma amigável, profissional e objetiva. Use emojis quando apropriado.
Se precisar de dados específicos, sugira que o usuário use o menu ou comandos.

Usuário: ${user?.firstName || 'Usuário'}
Sistema: Caderninho Digital`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
    
    console.log('🤖 Resposta da IA gerada');
    
    // Adicionar botões contextuais
    const buttons = getContextButtons(text);
    
    if (buttons.length > 0) {
      await sendMessageWithButtons(chatId, aiResponse, buttons);
    } else {
      await sendMessage(chatId, aiResponse);
    }
    
  } catch (error) {
    console.error('❌ Erro na IA:', error);
    await sendMessage(chatId, '🤖 Desculpe, estou com dificuldades para processar sua mensagem. Tente usar /menu ou /help.');
  }
}

// Botões contextuais
function getContextButtons(text) {
  const buttons = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('venda') || lowerText.includes('faturamento')) {
    buttons.push([{ text: '📊 Ver Vendas', callback_data: 'vendas' }]);
  }
  
  if (lowerText.includes('cliente')) {
    buttons.push([{ text: '👥 Clientes', callback_data: 'clientes' }]);
  }
  
  if (lowerText.includes('estoque') || lowerText.includes('produto')) {
    buttons.push([{ text: '📦 Estoque', callback_data: 'estoque' }]);
  }
  
  // Menu sempre disponível
  buttons.push([{ text: '🏠 Menu Principal', callback_data: 'menu' }]);
  
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
        await sendMessage(chatId, '📊 *Vendas*\n\n💰 Hoje: R$ 1.250,00\n🛒 Vendas: 8\n📈 Média: R$ 156,25\n\n_Dados simulados - integração em desenvolvimento_');
        break;
        
      case 'clientes':
        await sendMessage(chatId, '👥 *Clientes*\n\n📋 Total: 45 clientes\n📞 Ativos: 38\n🆕 Novos este mês: 7\n\n_Dados simulados - integração em desenvolvimento_');
        break;
        
      case 'estoque':
        await sendMessage(chatId, '📦 *Estoque*\n\n📱 Produtos: 156\n⚠️ Baixo estoque: 12\n✅ Disponível: 144\n\n_Dados simulados - integração em desenvolvimento_');
        break;
        
      default:
        await sendMessage(chatId, '❓ Ação não reconhecida.');
    }
    
  } catch (error) {
    console.error('❌ Erro no callback:', error);
  }
}

// Mensagens específicas
async function sendWelcomeMessage(chatId, userId) {
  const user = users.get(userId);
  const name = user?.firstName || 'Usuário';
  
  const message = `🤖 *Olá, ${name}!*

Bem-vindo ao *Caderninho Digital Chatbot IA*!

Sou seu assistente inteligente powered by Groq AI. Posso te ajudar com:

🛒 *Vendas e Faturamento*
👥 *Gestão de Clientes*  
📦 *Controle de Estoque*
📊 *Relatórios e Análises*

💬 *Converse comigo naturalmente!*
Exemplos:
• "Quanto vendi hoje?"
• "Quais são meus clientes?"
• "Como está o estoque?"

Ou use o menu abaixo:`;

  const buttons = [
    [
      { text: '📊 Vendas', callback_data: 'vendas' },
      { text: '👥 Clientes', callback_data: 'clientes' }
    ],
    [
      { text: '📦 Estoque', callback_data: 'estoque' },
      { text: '❓ Ajuda', callback_data: 'help' }
    ]
  ];
  
  await sendMessageWithButtons(chatId, message, buttons);
}

async function sendMainMenu(chatId, userId) {
  const message = `🏠 *Menu Principal*

Escolha uma opção ou converse comigo naturalmente:`;

  const buttons = [
    [
      { text: '📊 Vendas', callback_data: 'vendas' },
      { text: '👥 Clientes', callback_data: 'clientes' }
    ],
    [
      { text: '📦 Estoque', callback_data: 'estoque' },
      { text: '📈 Relatórios', callback_data: 'relatorios' }
    ]
  ];
  
  await sendMessageWithButtons(chatId, message, buttons);
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
    
    app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log('📱 Chatbot IA pronto!');
      console.log('🔗 Webhook URL: /webhook');
      console.log('');
      console.log('📋 Para configurar webhook:');
      console.log(`curl -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook -d "url=https://seu-app.onrender.com/webhook"`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer();
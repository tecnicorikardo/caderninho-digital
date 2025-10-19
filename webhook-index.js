// Bot do Telegram - Caderninho Digital (Webhook)
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.TELEGRAM_BOT_TOKEN || '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';
const port = process.env.PORT || 3000;

console.log('🤖 Caderninho Digital Bot iniciando (Webhook)...');

// Criar bot SEM polling
const bot = new TelegramBot(token, { polling: false });
const app = express();

app.use(express.json());

const users = new Map();
const conversations = new Map();

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check
app.get('/', (req, res) => {
  res.send('🤖 Caderninho Digital Bot está funcionando!');
});

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📱 /start recebido de:', chatId);
  
  const message = `🤖 *Caderninho Digital Bot*

Gerencie seu negócio pelo Telegram!

🔐 *Para começar:*
/login seu@email.com senha123

📋 *Comandos disponíveis:*
• /status - Ver se está logado
• /saldo - Resumo financeiro

🛒 *Vendas:*
• /venda - Registrar nova venda (interativo)

👥 *Clientes:*
• /cliente - Cadastrar cliente (interativo)

💰 *Financeiro:*
• /receita - Adicionar receita (interativo)
• /despesa - Adicionar despesa (interativo)

*Seu Chat ID: ${chatId}*
*Status: Online ✅*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Login:', email, 'de', chatId);
  
  if (email.includes('@') && password.length >= 6) {
    users.set(chatId, { 
      email, 
      loginTime: new Date(),
      userId: 'user_' + Date.now()
    });
    
    console.log('✅ Login OK:', email);
    bot.sendMessage(chatId, `✅ *Login realizado!*\n\n👤 ${email}\n🕐 ${new Date().toLocaleString('pt-BR')}\n\n🎉 Agora você pode usar todos os comandos!`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ *Credenciais inválidas*\n\n📝 Use: /login email@exemplo.com senha123');
  }
});

// Comando /venda
bot.onText(/\/venda/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🛒 Venda iniciada por:', chatId);
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  conversations.set(chatId, {
    type: 'venda',
    step: 'cliente',
    data: {}
  });
  
  console.log('✅ Conversa de venda iniciada para:', chatId);
  bot.sendMessage(chatId, '🛒 *Nova Venda*\n\n👤 Qual o nome do cliente?\n\n_Digite o nome ou "cancelar" para sair_', { parse_mode: 'Markdown' });
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (users.has(chatId)) {
    const user = users.get(chatId);
    bot.sendMessage(chatId, `✅ *Logado como:* ${user.email}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ *Não logado*\n\nUse: /login email senha');
  }
});

// Processar mensagens (conversas)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  console.log('📨 Mensagem:', text, 'de', chatId);
  
  // Ignorar comandos
  if (text && text.startsWith('/')) return;
  
  // Verificar conversa ativa
  if (conversations.has(chatId)) {
    const conversation = conversations.get(chatId);
    console.log('💬 Processando:', conversation.type, 'step:', conversation.step);
    
    if (text && text.toLowerCase() === 'cancelar') {
      conversations.delete(chatId);
      bot.sendMessage(chatId, '❌ *Cancelado*', { parse_mode: 'Markdown' });
      return;
    }
    
    if (conversation.type === 'venda') {
      processVenda(chatId, text, conversation);
    }
  } else if (text && !text.startsWith('/')) {
    bot.sendMessage(chatId, '🤖 Use /start para ver os comandos!');
  }
});

function processVenda(chatId, text, conversation) {
  switch (conversation.step) {
    case 'cliente':
      conversation.data.cliente = text;
      conversation.step = 'produto';
      conversations.set(chatId, conversation);
      console.log('✅ Cliente definido:', text);
      bot.sendMessage(chatId, `✅ Cliente: *${text}*\n\n🛍️ Qual o produto vendido?`, { parse_mode: 'Markdown' });
      break;
      
    case 'produto':
      conversation.data.produto = text;
      conversation.step = 'valor';
      conversations.set(chatId, conversation);
      console.log('✅ Produto definido:', text);
      bot.sendMessage(chatId, `✅ Produto: *${text}*\n\n💰 Qual o valor? (ex: 150.50)`, { parse_mode: 'Markdown' });
      break;
      
    case 'valor':
      const valor = parseFloat(text.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        bot.sendMessage(chatId, '❌ Valor inválido! Digite um número (ex: 150.50)');
        return;
      }
      
      const { cliente, produto } = conversation.data;
      const resumo = `🎉 *Venda Registrada!*\n\n👤 Cliente: ${cliente}\n🛍️ Produto: ${produto}\n💰 Valor: R$ ${valor.toFixed(2).replace('.', ',')}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}`;
      
      bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
      conversations.delete(chatId);
      console.log('✅ Venda finalizada:', { cliente, produto, valor });
      break;
  }
}

// Inicializar servidor
async function startServer() {
  try {
    // Limpar webhook
    await bot.deleteWebHook();
    console.log('🧹 Webhook limpo');
    
    // Verificar bot
    const botInfo = await bot.getMe();
    console.log('🤖 Bot:', botInfo.username);
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log('📱 Bot pronto via webhook!');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

startServer();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN || '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';

console.log('🤖 Iniciando Caderninho Digital Bot...');
console.log('🔑 Token:', token ? 'Configurado' : 'Não encontrado');

// Criar bot
const bot = new TelegramBot(token, { 
  polling: {
    interval: 2000,
    autoStart: false,
    params: {
      timeout: 10
    }
  }
});

// Armazenar usuários autenticados
const authenticatedUsers = new Map();

// Função para verificar se usuário está autenticado
function isAuthenticated(chatId) {
  return authenticatedUsers.has(chatId);
}

// Inicialização
setTimeout(async () => {
  try {
    console.log('🧹 Limpando configurações...');
    await bot.deleteWebHook();
    
    console.log('⏳ Aguardando...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const botInfo = await bot.getMe();
    console.log('🤖 Bot conectado:', botInfo.username);
    
    bot.startPolling();
    console.log('✅ Bot online e funcionando!');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar:', error.message);
  }
}, 1000);

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🚀 Comando /start de:', chatId);
  
  const message = `🤖 *Caderninho Digital Bot*

Gerencie seu negócio pelo Telegram!

🔐 *Para começar:*
\`/login seu@email.com suasenha\`

📋 *Comandos disponíveis:*
• /status - Ver login
• /saldo - Resumo financeiro  
• /cliente Nome Tel - Cadastrar
• /venda Cliente Valor - Vender

*Chat ID: ${chatId}*
*Bot funcionando! ✅*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => console.log('✅ Resposta enviada'))
    .catch(err => console.error('❌ Erro ao enviar:', err));
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Tentativa login:', email, 'de', chatId);
  
  if (email.includes('@') && password.length >= 6) {
    authenticatedUsers.set(chatId, { 
      email, 
      userId: 'user_' + Date.now(),
      loginTime: new Date()
    });
    
    console.log('✅ Login aprovado:', email);
    bot.sendMessage(chatId, `✅ *Login realizado!*\n\n👤 Email: ${email}\n🕐 Horário: ${new Date().toLocaleString('pt-BR')}\n\n🎉 Agora você pode usar todos os comandos!`, { parse_mode: 'Markdown' });
  } else {
    console.log('❌ Login negado:', email);
    bot.sendMessage(chatId, '❌ *Credenciais inválidas*\n\n📝 Use: /login email@exemplo.com senha123\n\n• Email deve conter @\n• Senha deve ter 6+ caracteres');
  }
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📊 Status solicitado por:', chatId);
  
  if (isAuthenticated(chatId)) {
    const user = authenticatedUsers.get(chatId);
    bot.sendMessage(chatId, `✅ *Você está logado!*\n\n👤 Email: ${user.email}\n🕐 Login: ${user.loginTime.toLocaleString('pt-BR')}\n🆔 User ID: ${user.userId}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ *Você não está logado*\n\n🔐 Use: /login email@exemplo.com senha123');
  }
});

// Comando /saldo
bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  console.log('💰 Saldo solicitado por:', chatId);
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  const message = `💰 *Resumo Financeiro*

🏪 *Financeiro Comercial:*
📈 Receitas: R$ 0,00
📉 Despesas: R$ 0,00
💰 Lucro: R$ 0,00

👤 *Financeiro Pessoal:*
📈 Receitas: R$ 0,00
📉 Despesas: R$ 0,00
💰 Saldo: R$ 0,00

🎯 *Total Geral: R$ 0,00*

_Sistema integrado com Caderninho Digital_`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Log de mensagens
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    console.log('💬 Mensagem recebida:', msg.text, 'de', msg.chat.id);
    bot.sendMessage(msg.chat.id, '🤖 Use /start para ver os comandos disponíveis!');
  }
});

// Tratamento de erros
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

console.log('🚀 Bot inicializando...');
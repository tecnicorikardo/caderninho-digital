const TelegramBot = require('node-telegram-bot-api');

const token = '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';

// Criar bot com configurações específicas para evitar conflito
const bot = new TelegramBot(token, { 
  polling: {
    interval: 3000,
    autoStart: false,
    params: {
      timeout: 5
    }
  }
});

// Armazenar usuários autenticados
const authenticatedUsers = new Map();

// Função para verificar se usuário está autenticado
function isAuthenticated(chatId) {
  return authenticatedUsers.has(chatId);
}

// Inicialização com delay
setTimeout(async () => {
  try {
    console.log('🧹 Limpando configurações...');
    await bot.deleteWebHook();
    
    console.log('⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const botInfo = await bot.getMe();
    console.log('🤖 Bot:', botInfo.username);
    
    // Iniciar polling manualmente
    bot.startPolling();
    console.log('✅ Bot iniciado com sucesso!');
    console.log('📱 Teste agora no Telegram: @meucomercio_bot');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}, 1000);

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🚀 /start recebido de:', chatId);
  
  const message = `🤖 *Caderninho Digital Bot*

Seu negócio na palma da mão!

🔐 *Primeiro, faça login:*
\`/login seu@email.com suasenha\`

📋 *Depois use os comandos:*
/status - Ver se está logado
/saldo - Resumo financeiro
/cliente Nome 11999999999 - Cadastrar cliente
/venda Cliente 150 - Registrar venda

*Seu Chat ID: ${chatId}*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Login tentativa:', email);
  
  if (email.includes('@') && password.length >= 6) {
    authenticatedUsers.set(chatId, { 
      email, 
      userId: 'user_' + Date.now(),
      loginTime: new Date()
    });
    
    console.log('✅ Login OK:', email);
    bot.sendMessage(chatId, `✅ *Login realizado!*\n\n👤 ${email}\n🕐 ${new Date().toLocaleString('pt-BR')}\n\n🎉 Agora você pode usar todos os comandos!`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ Email deve conter @ e senha ter 6+ caracteres');
  }
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (isAuthenticated(chatId)) {
    const user = authenticatedUsers.get(chatId);
    bot.sendMessage(chatId, `✅ *Logado como:*\n👤 ${user.email}\n🕐 ${user.loginTime.toLocaleString('pt-BR')}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ Não logado. Use: /login email senha');
  }
});

// Comando /saldo
bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Faça login primeiro: /login email senha');
    return;
  }
  
  const message = `💰 *Resumo Financeiro*

🏪 *Comercial:*
📈 Vendas: R$ 0,00
📉 Despesas: R$ 0,00
💰 Lucro: R$ 0,00

👤 *Pessoal:*
📈 Receitas: R$ 0,00
📉 Despesas: R$ 0,00
💰 Saldo: R$ 0,00

🎯 *Total: R$ 0,00*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

console.log('🤖 Caderninho Digital Bot iniciando...');
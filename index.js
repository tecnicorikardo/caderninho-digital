// Bot do Telegram - Caderninho Digital
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN || '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';

console.log('🤖 Caderninho Digital Bot iniciando...');
console.log('🔑 Token configurado:', token ? 'SIM' : 'NÃO');

const bot = new TelegramBot(token, { polling: true });
const users = new Map();

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
• /cliente Nome Tel - Cadastrar cliente
• /venda Cliente Valor - Registrar venda

*Seu Chat ID: ${chatId}*
*Status: Online ✅*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => console.log('✅ Resposta enviada para:', chatId))
    .catch(err => console.error('❌ Erro ao enviar:', err));
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Tentativa de login:', email, 'de', chatId);
  
  if (email.includes('@') && password.length >= 6) {
    users.set(chatId, { 
      email, 
      loginTime: new Date(),
      userId: 'user_' + Date.now()
    });
    
    console.log('✅ Login aprovado para:', email);
    bot.sendMessage(chatId, `✅ *Login realizado com sucesso!*\n\n👤 Email: ${email}\n🕐 Horário: ${new Date().toLocaleString('pt-BR')}\n\n🎉 Agora você pode usar todos os comandos!`, { parse_mode: 'Markdown' });
  } else {
    console.log('❌ Login negado para:', email);
    bot.sendMessage(chatId, '❌ *Credenciais inválidas*\n\n📝 Formato correto:\n/login email@exemplo.com senha123\n\n• Email deve conter @\n• Senha deve ter 6+ caracteres');
  }
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📊 Status solicitado por:', chatId);
  
  if (users.has(chatId)) {
    const user = users.get(chatId);
    bot.sendMessage(chatId, `✅ *Você está logado!*\n\n👤 Email: ${user.email}\n🕐 Login: ${user.loginTime.toLocaleString('pt-BR')}\n🆔 User ID: ${user.userId}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ *Você não está logado*\n\n🔐 Use: /login email@exemplo.com senha123');
  }
});

// Comando /saldo
bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  console.log('💰 Saldo solicitado por:', chatId);
  
  if (!users.has(chatId)) {
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

_Integrado com Caderninho Digital_`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Log de todas as mensagens
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    console.log('💬 Mensagem:', msg.text, 'de', msg.chat.id);
    bot.sendMessage(msg.chat.id, '🤖 Use /start para ver os comandos disponíveis!');
  }
});

// Tratamento de erros
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

console.log('🚀 Bot configurado e aguardando mensagens...');
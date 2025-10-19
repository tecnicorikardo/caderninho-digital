const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN || '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';

console.log('🤖 Iniciando bot...');

const bot = new TelegramBot(token, { polling: true });

const users = new Map();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('Start de:', chatId);
  
  bot.sendMessage(chatId, `🤖 *Caderninho Digital Bot*

Gerencie seu negócio pelo Telegram!

🔐 *Faça login:*
/login seu@email.com senha123

📋 *Comandos:*
• /status - Ver login
• /saldo - Resumo financeiro

*Chat ID: ${chatId}*`, { parse_mode: 'Markdown' });
});

bot.onText(/\/login (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('Login:', email, 'de', chatId);
  
  if (email.includes('@') && password.length >= 6) {
    users.set(chatId, { email, time: new Date() });
    bot.sendMessage(chatId, `✅ *Login OK!*\n\n👤 ${email}\n🕐 ${new Date().toLocaleString('pt-BR')}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ Email deve ter @ e senha 6+ chars');
  }
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (users.has(chatId)) {
    const user = users.get(chatId);
    bot.sendMessage(chatId, `✅ Logado: ${user.email}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ Não logado. Use: /login email senha');
  }
});

bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 Faça login primeiro');
    return;
  }
  
  bot.sendMessage(chatId, `💰 *Resumo Financeiro*

🏪 Comercial: R$ 0,00
👤 Pessoal: R$ 0,00
🎯 Total: R$ 0,00`, { parse_mode: 'Markdown' });
});

console.log('✅ Bot online!');
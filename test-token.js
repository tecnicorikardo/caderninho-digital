const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔍 Token sendo usado:', token);
console.log('📏 Tamanho do token:', token ? token.length : 'undefined');

if (!token) {
  console.error('❌ Token não encontrado no .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

bot.getMe()
  .then((botInfo) => {
    console.log('✅ Token válido!');
    console.log('🤖 Nome do bot:', botInfo.first_name);
    console.log('📝 Username:', botInfo.username);
    console.log('🆔 ID:', botInfo.id);
  })
  .catch((error) => {
    console.error('❌ Token inválido:', error.message);
    console.log('💡 Verifique se o token está correto no BotFather');
  });
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

async function resetBot() {
  try {
    console.log('🧹 Limpando webhook...');
    await bot.deleteWebHook();
    
    console.log('🔄 Parando polling...');
    await bot.stopPolling();
    
    console.log('✅ Bot resetado com sucesso!');
    console.log('🚀 Agora você pode rodar: node index.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resetar:', error.message);
    process.exit(1);
  }
}

resetBot();
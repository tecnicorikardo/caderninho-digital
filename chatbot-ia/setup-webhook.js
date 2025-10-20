require('dotenv').config();
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://caderninho-chatbot-ia.onrender.com/webhook';

async function setupWebhook() {
  try {
    console.log('🔧 Configurando webhook do Telegram...');
    console.log(`📡 URL: ${WEBHOOK_URL}`);
    
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      url: WEBHOOK_URL
    });
    
    if (response.data.ok) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log('📋 Detalhes:', response.data.description);
    } else {
      console.error('❌ Erro ao configurar webhook:', response.data);
    }
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  }
}

async function getWebhookInfo() {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    console.log('📊 Status do webhook:', response.data.result);
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.message);
  }
}

// Executar configuração
if (process.argv[2] === 'setup') {
  setupWebhook();
} else if (process.argv[2] === 'info') {
  getWebhookInfo();
} else {
  console.log('📋 Uso:');
  console.log('node setup-webhook.js setup  - Configurar webhook');
  console.log('node setup-webhook.js info   - Ver status do webhook');
}
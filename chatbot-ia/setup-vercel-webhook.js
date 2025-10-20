const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';

async function setupWebhook() {
  console.log('🔧 Configurando webhook para Vercel...\n');
  
  // Pedir URL do usuário
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('🌐 Digite a URL do seu projeto Vercel (ex: https://seu-projeto.vercel.app): ', async (url) => {
    try {
      const webhookUrl = `${url.replace(/\/$/, '')}/webhook`;
      
      console.log(`📡 Configurando webhook: ${webhookUrl}`);
      
      const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
        url: webhookUrl
      });
      
      if (response.data.ok) {
        console.log('\n✅ WEBHOOK CONFIGURADO COM SUCESSO!');
        console.log('📋 Resposta:', response.data.description);
        console.log('\n🎉 SEU BOT ESTÁ ONLINE!');
        console.log('📱 Teste no Telegram:');
        console.log('   1. Procure seu bot');
        console.log('   2. Digite /start');
        console.log('   3. Faça login');
        console.log('   4. Teste: "Quanto vendi hoje?"');
      } else {
        console.error('\n❌ ERRO AO CONFIGURAR WEBHOOK:');
        console.error(response.data);
      }
    } catch (error) {
      console.error('\n❌ ERRO:', error.message);
    }
    
    readline.close();
  });
}

async function checkWebhook() {
  try {
    console.log('🔍 Verificando status do webhook...\n');
    
    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const info = response.data.result;
    
    console.log('📊 STATUS DO WEBHOOK:');
    console.log(`   URL: ${info.url || 'Não configurado'}`);
    console.log(`   Status: ${info.url ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`   Último erro: ${info.last_error_message || 'Nenhum'}`);
    console.log(`   Certificado válido: ${info.has_custom_certificate ? 'Sim' : 'Não'}`);
    
    if (info.pending_update_count > 0) {
      console.log(`   ⚠️ Updates pendentes: ${info.pending_update_count}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error.message);
  }
}

// Verificar argumentos da linha de comando
const command = process.argv[2];

if (command === 'setup') {
  setupWebhook();
} else if (command === 'check') {
  checkWebhook();
} else {
  console.log('🤖 CONFIGURAÇÃO DE WEBHOOK PARA VERCEL\n');
  console.log('📋 Comandos disponíveis:');
  console.log('   node setup-vercel-webhook.js setup  - Configurar webhook');
  console.log('   node setup-vercel-webhook.js check  - Verificar status');
  console.log('\n💡 Use "setup" após fazer deploy no Vercel');
}
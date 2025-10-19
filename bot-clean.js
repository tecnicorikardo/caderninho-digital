const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
require('dotenv').config();

// Configuração do Firebase Admin (usando as mesmas credenciais do projeto web)
admin.initializeApp({
  projectId: "web-gestao-37a85"
});

const db = admin.firestore();

// Configuração do Bot com timeout maior
const token = process.env.TELEGRAM_BOT_TOKEN;

// Criar bot sem polling inicialmente
const bot = new TelegramBot(token, { polling: false });

// Armazenar usuários autenticados
const authenticatedUsers = new Map();

// Função para verificar se usuário está autenticado
function isAuthenticated(chatId) {
  return authenticatedUsers.has(chatId);
}

// Função para formatar valores monetários
function formatMoney(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// Função para formatar data
function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

// Inicialização segura
async function startBot() {
  try {
    console.log('🧹 Limpando configurações antigas...');
    
    // Limpar webhook
    await bot.deleteWebHook();
    console.log('✅ Webhook limpo');
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar bot
    const botInfo = await bot.getMe();
    console.log('🤖 Bot:', botInfo.username);
    
    // Iniciar polling com configurações específicas
    await bot.startPolling({
      restart: true,
      polling: {
        interval: 2000,
        autoStart: false,
        params: {
          timeout: 10
        }
      }
    });
    
    console.log('✅ Bot iniciado com sucesso!');
    console.log('📱 Aguardando mensagens...');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar bot:', error.message);
    process.exit(1);
  }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  console.log('🚀 Comando /start recebido do chat:', chatId);
  
  const welcomeMessage = `🤖 *Bem-vindo ao Caderninho Digital Bot!*

Gerencie seu negócio direto pelo Telegram!

📋 *Comandos disponíveis:*

🔐 *Autenticação:*
/login email senha - Fazer login

👥 *Clientes:*
/cliente nome telefone - Cadastrar cliente
/clientes - Listar clientes

🛒 *Vendas:*
/venda cliente valor - Registrar venda
/vendas - Ver vendas do dia

💰 *Financeiro:*
/receita categoria valor descrição - Adicionar receita
/despesa categoria valor descrição - Adicionar despesa
/saldo - Ver resumo financeiro

📊 *Relatórios:*
/hoje - Resumo do dia
/status - Ver seu status de login

❓ /help - Ver esta mensagem novamente

*Para começar, faça login com:*
\`/login seu@email.com suasenha\`

*Seu Chat ID: ${chatId}*`;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })
    .then(() => {
      console.log('✅ Mensagem de boas-vindas enviada para:', chatId);
    })
    .catch((error) => {
      console.error('❌ Erro ao enviar mensagem:', error);
    });
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Tentativa de login:', { chatId, email, passwordLength: password.length });
  
  try {
    if (email.includes('@') && password.length >= 6) {
      const userId = Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      
      authenticatedUsers.set(chatId, { 
        email, 
        userId,
        loginTime: new Date()
      });
      
      console.log('✅ Login bem-sucedido para:', email);
      
      bot.sendMessage(chatId, `✅ *Login realizado com sucesso!*\n\n👤 Email: ${email}\n🕐 Logado em: ${new Date().toLocaleString('pt-BR')}\n\nAgora você pode usar todos os comandos do bot! 🚀`, { parse_mode: 'Markdown' });
    } else {
      console.log('❌ Credenciais inválidas');
      bot.sendMessage(chatId, '❌ Credenciais inválidas.\n\n📝 Use: /login email@exemplo.com suasenha\n(Senha deve ter pelo menos 6 caracteres)');
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    bot.sendMessage(chatId, '❌ Erro no login. Tente novamente.');
  }
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você não está logado.\n\nUse: /login email senha');
    return;
  }
  
  const user = authenticatedUsers.get(chatId);
  const loginTime = user.loginTime.toLocaleString('pt-BR');
  
  bot.sendMessage(chatId, `✅ *Você está logado!*\n\n👤 *Email:* ${user.email}\n🕐 *Login:* ${loginTime}\n🆔 *User ID:* ${user.userId}\n\n🤖 Bot funcionando perfeitamente!`, { parse_mode: 'Markdown' });
});

// Comando /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Use /start para ver todos os comandos disponíveis.');
});

// Log de mensagens para debug
bot.on('message', (msg) => {
  console.log('📨 Mensagem:', {
    chatId: msg.chat.id,
    text: msg.text,
    from: msg.from?.first_name
  });
});

// Tratamento de erros
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

// Iniciar o bot
startBot();
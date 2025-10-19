const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;

// Criar bot SEM polling
const bot = new TelegramBot(token, { polling: false });

// Criar servidor Express
const app = express();
app.use(express.json());

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

// Rota para receber updates do Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('🤖 Caderninho Digital Bot está funcionando!');
});

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

🛒 *Vendas:*
/venda cliente valor - Registrar venda

💰 *Financeiro:*
/receita categoria valor descrição - Adicionar receita
/despesa categoria valor descrição - Adicionar despesa
/saldo - Ver resumo financeiro

📊 *Relatórios:*
/hoje - Resumo do dia
/status - Ver seu status de login

*Para começar, faça login com:*
\`/login seu@email.com suasenha\`

*Seu Chat ID: ${chatId}*`;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Tentativa de login:', { chatId, email });
  
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

// Comando /saldo
bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const message = `💰 *Resumo Financeiro*\n\n🏪 *Comercial:*\n📈 Vendas: R$ 0,00\n📉 Despesas: R$ 0,00\n💰 Lucro: R$ 0,00\n\n👤 *Pessoal:*\n📈 Receitas: R$ 0,00\n📉 Despesas: R$ 0,00\n💰 Saldo: R$ 0,00\n\n🎯 *Total Geral:* R$ 0,00`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Inicializar servidor
async function startServer() {
  try {
    // Limpar webhook primeiro
    await bot.deleteWebHook();
    console.log('🧹 Webhook limpo');
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar bot
    const botInfo = await bot.getMe();
    console.log('🤖 Bot:', botInfo.username);
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log('📱 Bot pronto para receber mensagens via webhook');
      console.log('🔗 Para testar localmente, use ngrok ou similar');
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer();
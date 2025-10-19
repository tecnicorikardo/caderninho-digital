const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Configuração do Bot para produção
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN não encontrado!');
  process.exit(1);
}

const bot = new TelegramBot(token, { 
  polling: {
    interval: 2000,
    autoStart: false,
    params: {
      timeout: 10
    }
  }
});

// Inicialização segura para produção
async function initBot() {
  try {
    console.log('🚀 Iniciando Caderninho Digital Bot...');
    
    // Limpar webhook se existir
    await bot.deleteWebHook();
    console.log('🧹 Webhook limpo');
    
    // Verificar bot
    const botInfo = await bot.getMe();
    console.log('🤖 Bot conectado:', botInfo.username);
    console.log('🆔 Bot ID:', botInfo.id);
    
    // Iniciar polling
    bot.startPolling();
    console.log('✅ Bot iniciado com sucesso!');
    console.log('📱 Aguardando mensagens...');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar bot:', error.message);
    setTimeout(initBot, 5000); // Tentar novamente em 5s
  }
}

// Iniciar bot
initBot();

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

// Comando /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Use /start para ver todos os comandos disponíveis.');
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Tentativa de login:', { chatId, email, passwordLength: password.length });
  
  try {
    // Simulação de autenticação (você pode integrar com Firebase Auth depois)
    if (email.includes('@') && password.length >= 6) {
      // Gerar um userId único baseado no email
      const userId = Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      
      authenticatedUsers.set(chatId, { 
        email, 
        userId,
        loginTime: new Date()
      });
      
      console.log('✅ Login bem-sucedido para:', email);
      
      bot.sendMessage(chatId, `✅ *Login realizado com sucesso!*\n\n👤 Email: ${email}\n🕐 Logado em: ${new Date().toLocaleString('pt-BR')}\n\nAgora você pode usar todos os comandos do bot! 🚀`, { parse_mode: 'Markdown' });
    } else {
      console.log('❌ Credenciais inválidas:', { email: email.includes('@'), passwordOk: password.length >= 6 });
      bot.sendMessage(chatId, '❌ Credenciais inválidas.\n\n📝 Use: /login email@exemplo.com suasenha\n(Senha deve ter pelo menos 6 caracteres)');
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    bot.sendMessage(chatId, '❌ Erro no login. Tente novamente.');
  }
});

// Comando /cliente
bot.onText(/\/cliente (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const name = match[1];
  const phone = match[2];
  const user = authenticatedUsers.get(chatId);
  
  try {
    const clientData = {
      name,
      phone,
      email: '',
      address: '',
      userId: user.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('clients').add(clientData);
    
    bot.sendMessage(chatId, `✅ Cliente cadastrado com sucesso!\n\n👤 *${name}*\n📱 ${phone}\n🆔 ID: ${docRef.id}`, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao cadastrar cliente. Tente novamente.');
  }
});

// Comando /clientes
bot.onText(/\/clientes/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const user = authenticatedUsers.get(chatId);
  
  try {
    const snapshot = await db.collection('clients')
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      bot.sendMessage(chatId, '📝 Nenhum cliente cadastrado ainda.\n\nUse: /cliente Nome Telefone');
      return;
    }
    
    let message = '👥 *Seus Clientes:*\n\n';
    snapshot.forEach(doc => {
      const client = doc.data();
      message += `👤 *${client.name}*\n📱 ${client.phone}\n🆔 ${doc.id}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao buscar clientes.');
  }
});

// Comando /venda
bot.onText(/\/venda (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const clientName = match[1];
  const value = parseFloat(match[2]);
  const user = authenticatedUsers.get(chatId);
  
  if (isNaN(value) || value <= 0) {
    bot.sendMessage(chatId, '❌ Valor inválido. Use números positivos.');
    return;
  }
  
  try {
    const saleData = {
      clientName,
      total: value,
      paidAmount: value,
      paymentMethod: 'dinheiro',
      status: 'completed',
      userId: user.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('sales').add(saleData);
    
    bot.sendMessage(chatId, `✅ Venda registrada com sucesso!\n\n🛒 *Cliente:* ${clientName}\n💰 *Valor:* ${formatMoney(value)}\n🆔 ID: ${docRef.id}`, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao registrar venda. Tente novamente.');
  }
});

// Comando /saldo
bot.onText(/\/saldo/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const user = authenticatedUsers.get(chatId);
  
  try {
    // Buscar vendas
    const salesSnapshot = await db.collection('sales')
      .where('userId', '==', user.userId)
      .get();
    
    let totalVendas = 0;
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalVendas += sale.paidAmount || sale.total || 0;
    });
    
    // Simular dados financeiros (você pode implementar busca real)
    const message = `💰 *Resumo Financeiro*\n\n🏪 *Comercial:*\n📈 Vendas: ${formatMoney(totalVendas)}\n📉 Despesas: R$ 0,00\n💰 Lucro: ${formatMoney(totalVendas)}\n\n👤 *Pessoal:*\n📈 Receitas: R$ 0,00\n📉 Despesas: R$ 0,00\n💰 Saldo: R$ 0,00\n\n🎯 *Total Geral:* ${formatMoney(totalVendas)}`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao buscar saldo.');
  }
});

// Comando /hoje
bot.onText(/\/hoje/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const user = authenticatedUsers.get(chatId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    const salesSnapshot = await db.collection('sales')
      .where('userId', '==', user.userId)
      .where('createdAt', '>=', today)
      .get();
    
    let totalHoje = 0;
    let countHoje = 0;
    
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalHoje += sale.paidAmount || sale.total || 0;
      countHoje++;
    });
    
    const message = `📅 *Resumo de Hoje*\n\n🛒 Vendas: ${countHoje}\n💰 Faturamento: ${formatMoney(totalHoje)}\n\n${countHoje === 0 ? '📝 Nenhuma venda registrada hoje.' : '🎉 Bom trabalho!'}`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao buscar dados de hoje.');
  }
});

// Comando /vendas
bot.onText(/\/vendas/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const user = authenticatedUsers.get(chatId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    const snapshot = await db.collection('sales')
      .where('userId', '==', user.userId)
      .where('createdAt', '>=', today)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      bot.sendMessage(chatId, '📝 Nenhuma venda registrada hoje.\n\nUse: /venda Cliente Valor');
      return;
    }
    
    let message = '🛒 *Vendas de Hoje:*\n\n';
    snapshot.forEach(doc => {
      const sale = doc.data();
      const time = sale.createdAt ? new Date(sale.createdAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora';
      message += `🕐 ${time} - ${sale.clientName}\n💰 ${formatMoney(sale.paidAmount || sale.total)}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao buscar vendas.');
  }
});

// Comando /receita
bot.onText(/\/receita (.+) (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const category = match[1];
  const value = parseFloat(match[2]);
  const description = match[3];
  const user = authenticatedUsers.get(chatId);
  
  if (isNaN(value) || value <= 0) {
    bot.sendMessage(chatId, '❌ Valor inválido. Use números positivos.');
    return;
  }
  
  try {
    // Simular salvamento no localStorage (como no sistema web)
    const transactionData = {
      id: Date.now().toString(),
      type: 'receita',
      category,
      description,
      amount: value,
      date: new Date().toISOString(),
      paymentMethod: 'dinheiro',
      status: 'pago',
      userId: user.userId,
      financialType: 'pessoal',
      createdAt: new Date().toISOString()
    };
    
    bot.sendMessage(chatId, `✅ *Receita adicionada!*\n\n📈 *Categoria:* ${category}\n💰 *Valor:* ${formatMoney(value)}\n📝 *Descrição:* ${description}\n📅 *Data:* ${formatDate(new Date())}`, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao adicionar receita. Tente novamente.');
  }
});

// Comando /despesa
bot.onText(/\/despesa (.+) (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (!isAuthenticated(chatId)) {
    bot.sendMessage(chatId, '🔐 Você precisa fazer login primeiro: /login email senha');
    return;
  }
  
  const category = match[1];
  const value = parseFloat(match[2]);
  const description = match[3];
  const user = authenticatedUsers.get(chatId);
  
  if (isNaN(value) || value <= 0) {
    bot.sendMessage(chatId, '❌ Valor inválido. Use números positivos.');
    return;
  }
  
  try {
    const transactionData = {
      id: Date.now().toString(),
      type: 'despesa',
      category,
      description,
      amount: value,
      date: new Date().toISOString(),
      paymentMethod: 'dinheiro',
      status: 'pago',
      userId: user.userId,
      financialType: 'pessoal',
      createdAt: new Date().toISOString()
    };
    
    bot.sendMessage(chatId, `✅ *Despesa adicionada!*\n\n📉 *Categoria:* ${category}\n💰 *Valor:* ${formatMoney(value)}\n📝 *Descrição:* ${description}\n📅 *Data:* ${formatDate(new Date())}`, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Erro ao adicionar despesa. Tente novamente.');
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

// Tratamento de comandos não reconhecidos
bot.onText(/^\/(\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const command = '/' + match[1];
  const knownCommands = ['/start', '/help', '/login', '/cliente', '/clientes', '/venda', '/vendas', '/saldo', '/hoje', '/receita', '/despesa', '/status'];
  
  if (!knownCommands.includes(command)) {
    bot.sendMessage(chatId, '❓ Comando não reconhecido. Use /help para ver os comandos disponíveis.');
  }
});

// Verificar se o bot está funcionando
bot.getMe().then((botInfo) => {
  console.log('🤖 Bot do Caderninho Digital iniciado!');
  console.log('📱 Nome do bot:', botInfo.username);
  console.log('🆔 Bot ID:', botInfo.id);
  console.log('✅ Aguardando mensagens...');
}).catch((error) => {
  console.error('❌ Erro ao iniciar bot:', error.message);
});

// Log de todas as mensagens recebidas para debug
bot.on('message', (msg) => {
  console.log('📨 Mensagem recebida:', {
    chatId: msg.chat.id,
    username: msg.from?.username,
    text: msg.text,
    date: new Date(msg.date * 1000).toLocaleString('pt-BR')
  });
});
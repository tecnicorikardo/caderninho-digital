require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const Groq = require('groq-sdk');
const express = require('express');

// --- Configurações ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const FIREBASE_PROJECT_ID = 'web-gestao-37a85'; // SEU PROJECT ID CORRETO
const PORT = process.env.PORT || 3000;

// Inicializa o Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log('🤖 Telegram bot inicializado...');

// Inicializa o Firebase Admin SDK
let db;
try {
  // Para produção, use variável de ambiente
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: FIREBASE_PROJECT_ID
    });
  } else {
    // Para desenvolvimento local
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: FIREBASE_PROJECT_ID
    });
  }
  
  db = admin.firestore();
  console.log('🔥 Firebase Admin SDK inicializado...');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin SDK:', error.message);
  console.log('⚠️  Continuando com dados simulados...');
  db = null;
}

// Inicializa Groq SDK
const groq = new Groq({
  apiKey: GROQ_API_KEY
});
console.log('🧠 Groq SDK inicializado...');

// --- Mapeamento de usuários Telegram para Firebase ---
const userMapping = new Map();

// Função para buscar todos os userIds do Firebase
async function getAllFirebaseUserIds() {
  if (!db) return [];
  
  try {
    const userIds = new Set();
    
    // Buscar em todas as coleções para encontrar userIds únicos
    const collections = ['sales', 'clients', 'products'];
    
    console.log('🔍 Buscando userIds em todas as coleções...');
    
    for (const collectionName of collections) {
      console.log(`📋 Verificando coleção: ${collectionName}`);
      const snapshot = await db.collection(collectionName).get();
      console.log(`📊 ${collectionName}: ${snapshot.size} documentos encontrados`);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📄 Documento ${doc.id}:`, {
          userId: data.userId,
          hasUserId: !!data.userId
        });
        
        if (data.userId) {
          userIds.add(data.userId);
          console.log(`✅ UserId encontrado: ${data.userId}`);
        }
      });
    }
    
    console.log(`🎯 Total de userIds únicos encontrados: ${userIds.size}`);
    console.log('📋 UserIds:', Array.from(userIds));
    
    return Array.from(userIds);
  } catch (error) {
    console.error('❌ Erro ao buscar userIds:', error);
    return [];
  }
}

// Função para registrar/obter userId
function getUserId(telegramUserId, firstName) {
  if (!userMapping.has(telegramUserId)) {
    // Usar ID baseado no Telegram por padrão
    const userId = `telegram_${telegramUserId}`;
    userMapping.set(telegramUserId, {
      firebaseUserId: userId,
      firstName: firstName,
      registeredAt: new Date(),
      isAuthenticated: false
    });
    console.log(`👤 Novo usuário registrado: ${firstName} (${userId})`);
  }
  return userMapping.get(telegramUserId).firebaseUserId;
}

// Função para autenticar usuário com dados reais
async function authenticateUser(telegramUserId, targetUserId) {
  if (!db) return false;
  
  try {
    // Verificar se o userId existe no Firebase
    const salesRef = db.collection('sales').where('userId', '==', targetUserId).limit(1);
    const snapshot = await salesRef.get();
    
    if (!snapshot.empty) {
      // Atualizar mapeamento para usar o userId real
      const userData = userMapping.get(telegramUserId) || {};
      userMapping.set(telegramUserId, {
        ...userData,
        firebaseUserId: targetUserId,
        isAuthenticated: true,
        authenticatedAt: new Date()
      });
      
      console.log(`✅ Usuário autenticado: ${targetUserId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return false;
  }
}

// --- Funções Firebase REAIS ---

async function getSalesSummary(userId) {
  if (!db) {
    // Dados simulados quando Firebase não está conectado
    return {
      totalToday: 0.00,
      countToday: 0,
      averageTicket: 0.00,
      sales: [],
      pendingPayments: [],
      isSimulated: true
    };
  }

  try {
    console.log(`📊 Buscando vendas para usuário: ${userId}`);
    
    // Primeiro, vamos ver TODAS as vendas para debug
    console.log('🔍 DEBUG: Verificando TODAS as vendas primeiro...');
    const allSalesSnapshot = await db.collection('sales').get();
    console.log(`📋 Total de vendas no sistema: ${allSalesSnapshot.size}`);
    
    allSalesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Venda ${index + 1}:`, {
        id: doc.id,
        userId: data.userId,
        total: data.total,
        clientName: data.clientName
      });
    });
    
    // Agora buscar vendas do usuário específico
    const salesRef = db.collection('sales').where('userId', '==', userId);
    const snapshot = await salesRef.get();
    
    console.log(`🎯 Vendas encontradas para userId '${userId}': ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('📭 Nenhuma venda encontrada para este usuário');
      return {
        totalToday: 0.00,
        countToday: 0,
        averageTicket: 0.00,
        sales: [],
        pendingPayments: [],
        isSimulated: false
      };
    }

    const sales = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    let totalToday = 0;
    let countToday = 0;
    const pendingPayments = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const sale = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
      
      sales.push(sale);
      
      // Verificar se é venda de hoje
      const saleDate = sale.createdAt.toISOString().split('T')[0];
      if (saleDate === todayString) {
        totalToday += sale.total || 0;
        countToday++;
      }
      
      // Verificar pagamentos pendentes
      if (sale.paymentStatus === 'pendente' || sale.paymentStatus === 'parcial') {
        pendingPayments.push({
          id: sale.id,
          total: sale.total,
          clientName: sale.clientName || 'Cliente não informado',
          remainingAmount: sale.remainingAmount || sale.total,
          dueDate: sale.createdAt.toISOString().split('T')[0]
        });
      }
    });

    const averageTicket = countToday > 0 ? totalToday / countToday : 0;

    console.log(`✅ Encontradas ${sales.length} vendas, ${countToday} hoje`);
    
    return {
      totalToday,
      countToday,
      averageTicket,
      sales: sales.slice(0, 5), // Últimas 5 vendas
      pendingPayments,
      isSimulated: false
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error);
    throw error;
  }
}

async function getClientsSummary(userId) {
  if (!db) {
    return {
      total: 0,
      newThisMonth: 0,
      withPendingPayments: 0,
      topClients: [],
      isSimulated: true
    };
  }

  try {
    console.log(`👥 Buscando clientes para usuário: ${userId}`);
    
    const clientsRef = db.collection('clients').where('userId', '==', userId);
    const snapshot = await clientsRef.get();
    
    if (snapshot.empty) {
      return {
        total: 0,
        newThisMonth: 0,
        withPendingPayments: 0,
        topClients: [],
        isSimulated: false
      };
    }

    const clients = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let newThisMonth = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const client = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
      
      clients.push(client);
      
      // Verificar se é cliente novo este mês
      const clientMonth = client.createdAt.getMonth();
      const clientYear = client.createdAt.getFullYear();
      if (clientMonth === currentMonth && clientYear === currentYear) {
        newThisMonth++;
      }
    });

    // Buscar vendas para calcular top clientes
    const salesRef = db.collection('sales').where('userId', '==', userId);
    const salesSnapshot = await salesRef.get();
    
    const clientPurchases = new Map();
    
    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      if (sale.clientId) {
        const current = clientPurchases.get(sale.clientId) || 0;
        clientPurchases.set(sale.clientId, current + (sale.total || 0));
      }
    });

    const topClients = clients
      .map(client => ({
        id: client.id,
        name: client.name,
        totalPurchases: clientPurchases.get(client.id) || 0
      }))
      .filter(client => client.totalPurchases > 0)
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 5);

    console.log(`✅ Encontrados ${clients.length} clientes`);
    
    return {
      total: clients.length,
      newThisMonth,
      withPendingPayments: 0, // Seria calculado com base nas vendas pendentes
      topClients,
      isSimulated: false
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    throw error;
  }
}

async function getProductsSummary(userId) {
  if (!db) {
    return {
      total: 0,
      lowStock: 0,
      totalValue: 0.00,
      productsLowStock: [],
      isSimulated: true
    };
  }

  try {
    console.log(`📦 Buscando produtos para usuário: ${userId}`);
    
    const productsRef = db.collection('products').where('userId', '==', userId);
    const snapshot = await productsRef.get();
    
    if (snapshot.empty) {
      return {
        total: 0,
        lowStock: 0,
        totalValue: 0.00,
        productsLowStock: [],
        isSimulated: false
      };
    }

    const products = [];
    let totalValue = 0;
    const productsLowStock = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const product = {
        id: doc.id,
        ...data
      };
      
      products.push(product);
      
      // Calcular valor total do estoque
      totalValue += (product.quantity || 0) * (product.salePrice || 0);
      
      // Verificar estoque baixo
      const minQty = product.minQuantity || 5;
      if ((product.quantity || 0) <= minQty) {
        productsLowStock.push({
          id: product.id,
          name: product.name,
          quantity: product.quantity || 0,
          minQuantity: minQty
        });
      }
    });

    console.log(`✅ Encontrados ${products.length} produtos`);
    
    return {
      total: products.length,
      lowStock: productsLowStock.length,
      totalValue,
      productsLowStock: productsLowStock.slice(0, 10), // Primeiros 10
      isSimulated: false
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    throw error;
  }
}

// --- Comandos do Bot Telegram ---

// Comando /start - com login automático
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let userData = userMapping.get(msg.from.id);
  
  // Tentar login automático se não estiver autenticado
  if (!userData?.isAuthenticated) {
    console.log(`🔐 Tentando login automático para ${msg.from.first_name}...`);
    const realUserId = 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2'; // Seu userId real
    const success = await authenticateUser(msg.from.id, realUserId);
    
    if (success) {
      userData = userMapping.get(msg.from.id); // Atualizar dados após login
      
      const welcomeMessage = `🎉 *Olá, ${msg.from.first_name}!*

✅ *Login automático realizado!*
🆔 *Conectado à sua conta empresarial*

🤖 *Caderninho Digital Chatbot IA*
Seu assistente inteligente para gestão do negócio.

💬 *Experimente agora:*
• "Quanto vendi hoje?"
• "Como está meu estoque?"
• "Quem são meus clientes?"
• "Resumo do mês"

🌐 *Sistema:* https://web-gestao-37a85.web.app`;

      const buttons = [
        [
          { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
          { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' }
        ],
        [
          { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' },
          { text: '📈 Dashboard', callback_data: 'dashboard' }
        ]
      ];
      
      await sendMessageWithButtons(chatId, welcomeMessage, buttons);
      return;
    }
  }
  
  // Se já está autenticado
  if (userData?.isAuthenticated) {
    const welcomeMessage = `👋 *Oi novamente, ${msg.from.first_name}!*

✅ *Você está conectado à sua conta*
🆔 *ID:* \`${userData.firebaseUserId}\`

💬 *O que gostaria de saber sobre seu negócio?*`;

    const buttons = [
      [
        { text: '📊 Vendas', callback_data: 'vendas_detalhadas' },
        { text: '👥 Clientes', callback_data: 'clientes_detalhados' }
      ],
      [
        { text: '📦 Estoque', callback_data: 'estoque_detalhado' },
        { text: '🔄 Trocar Conta', callback_data: 'logout_confirm' }
      ]
    ];
    
    await sendMessageWithButtons(chatId, welcomeMessage, buttons);
    return;
  }
  
  // Se não conseguiu autenticar automaticamente
  const welcomeMessage = `🎉 *Olá, ${msg.from.first_name}!*

🤖 *Caderninho Digital Chatbot IA*
Assistente para empresários.

🔐 *Para acessar seus dados empresariais:*

Use o botão abaixo para login automático ou digite:
\`/forcelogin\`

🌐 *Não tem conta? Cadastre-se:*
https://web-gestao-37a85.web.app`;

  const buttons = [
    [{ text: '🔐 Login Automático', callback_data: 'auto_login' }],
    [{ text: '❓ Ajuda', callback_data: 'ajuda_completa' }]
  ];
  
  await sendMessageWithButtons(chatId, welcomeMessage, buttons);
});

// Comando /ajuda
bot.onText(/\/ajuda/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `❓ *Central de Ajuda - Caderninho Digital Bot*

🏢 *Para empresários que usam o Caderninho Digital*

🔐 *Como conectar sua conta:*
\`/login seu@email.com suasenha\`

📊 *Comandos disponíveis:*
/start - Menu inicial
/ajuda - Esta ajuda
/status - Status da sua conexão
/logout - Desconectar da conta
/usuarios - Ver contas disponíveis (admin)

💬 *Consultas que posso fazer:*
• "Quanto vendi hoje?"
• "Quantos clientes tenho?"
• "Produtos com estoque baixo?"
• "Quem está devendo?"
• "Resumo financeiro do mês"
• "Melhores clientes"
• "Análise de performance"

🤖 *Inteligência Artificial:*
Converse naturalmente comigo! Entendo perguntas sobre seu negócio.

🌐 *Sistema com dados:*
https://web-gestao-37a85.web.app

📞 *Suporte:* Entre em contato pelo sistema web`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /status
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const firebaseStatus = db ? '🟢 Conectado' : '🔴 Desconectado (dados simulados)';
  const groqStatus = GROQ_API_KEY ? '🟢 Conectado' : '🔴 Não configurado';
  const currentUserId = getUserId(msg.from.id, msg.from.first_name);
  const userData = userMapping.get(msg.from.id);
  const authStatus = userData?.isAuthenticated ? '🟢 Autenticado' : '🟡 Não autenticado';
  
  const statusMessage = `📊 *Status do Sistema*

🔥 *Firebase:* ${firebaseStatus}
🧠 *Groq AI:* ${groqStatus}
🤖 *Bot:* 🟢 Online
🔐 *Autenticação:* ${authStatus}

👤 *Seu ID atual:* \`${currentUserId}\`

${!userData?.isAuthenticated ? '\n⚠️ *Para ver seus dados reais, use /login*' : ''}
${!db ? '\n⚠️ *Aviso:* Firebase desconectado. Usando dados simulados.' : ''}`;

  bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
});

// Comando /forcelogin - login direto com dados reais encontrados
bot.onText(/\/forcelogin/, async (msg) => {
  const chatId = msg.chat.id;
  const realUserId = 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2'; // Seu userId real
  
  try {
    bot.sendMessage(chatId, '🔐 Conectando com seus dados reais...');
    
    const success = await authenticateUser(msg.from.id, realUserId);
    
    if (success) {
      bot.sendMessage(chatId, `✅ *CONECTADO COM SUCESSO!*\n\n🆔 *Seus dados:* \`${realUserId}\`\n\n🎉 *Agora teste:*\n• "Quanto vendi hoje?"\n• "Quantos clientes tenho?"\n• "Como está meu estoque?"`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ Erro na conexão');
    }
  } catch (error) {
    console.error('❌ Erro no forcelogin:', error);
    bot.sendMessage(chatId, '❌ Erro na conexão');
  }
});

// Comando /debug - verificar dados no Firebase
bot.onText(/\/debug/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!db) {
    bot.sendMessage(chatId, '❌ Firebase não conectado');
    return;
  }
  
  try {
    bot.sendMessage(chatId, '🔍 Analisando dados no Firebase...');
    
    let debugInfo = '🔍 *Debug do Firebase*\n\n';
    
    // Verificar cada coleção
    const collections = ['sales', 'clients', 'products'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      debugInfo += `📋 *${collectionName}:* ${snapshot.size} documentos\n`;
      
      if (snapshot.size > 0) {
        debugInfo += `└ Exemplo de userId: \`${snapshot.docs[0].data().userId || 'N/A'}\`\n`;
      }
    }
    
    // Buscar todos os userIds
    const userIds = await getAllFirebaseUserIds();
    debugInfo += `\n👥 *UserIds únicos:* ${userIds.length}\n`;
    
    if (userIds.length > 0) {
      debugInfo += `└ Primeiro: \`${userIds[0]}\`\n`;
      debugInfo += `\n💡 *Teste:* \`/login ${userIds[0]}\``;
    }
    
    bot.sendMessage(chatId, debugInfo, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
  }
});

// Comando /usuarios - listar usuários (administrativo)
bot.onText(/\/usuarios/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!db) {
    bot.sendMessage(chatId, '❌ Sistema temporariamente indisponível.');
    return;
  }
  
  try {
    bot.sendMessage(chatId, '🔍 Verificando contas no sistema...');
    
    const userIds = await getAllFirebaseUserIds();
    
    if (userIds.length === 0) {
      bot.sendMessage(chatId, `📭 *Nenhuma conta empresarial encontrada*\n\n🌐 *Seja o primeiro a se cadastrar:*\nhttps://caderninhodigital.netlify.app\n\n💼 *Benefícios:*\n• Gestão completa do seu negócio\n• Relatórios automáticos\n• Controle de estoque\n• Análise de vendas`);
      return;
    }
    
    let message = `📊 *Status do Sistema*\n\n👥 *Contas empresariais ativas:* ${userIds.length}\n\n🔐 *Para acessar sua conta:*\n\`/login seu@email.com suasenha\`\n\n`;
    
    if (userIds.length < 5) {
      message += `🆔 *IDs disponíveis (para teste):*\n`;
      for (let i = 0; i < userIds.length && i < 3; i++) {
        const userId = userIds[i];
        message += `• \`${userId}\`\n`;
      }
      message += `\n💡 *Teste rápido:* \`/login ${userIds[0]}\``;
    }
    
    message += `\n\n🌐 *Sistema:*\nhttps://web-gestao-37a85.web.app`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    bot.sendMessage(chatId, '❌ Erro ao verificar sistema. Tente novamente.');
  }
});

// Comando /login - aceita tanto "email senha" quanto "userId" direto
bot.onText(/\/login (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].trim();
  
  // Se tem espaço, é email e senha
  if (input.includes(' ')) {
    const parts = input.split(' ');
    const email = parts[0];
    const password = parts[1];
    
    await handleEmailPasswordLogin(chatId, msg.from.id, email, password);
  } else {
    // Se não tem espaço, é userId direto
    await handleUserIdLogin(chatId, msg.from.id, input);
  }
});

// Função para login com email e senha
async function handleEmailPasswordLogin(chatId, telegramUserId, email, password) {
  if (!db) {
    bot.sendMessage(chatId, '❌ Sistema temporariamente indisponível. Tente novamente em alguns minutos.');
    return;
  }
  
  try {
    bot.sendMessage(chatId, `🔐 Autenticando ${email}...`);
    
    // Por enquanto, vamos simular autenticação e buscar userId por email
    // Em produção, você integraria com Firebase Auth
    const userIds = await getAllFirebaseUserIds();
    
    if (userIds.length === 0) {
      bot.sendMessage(chatId, `❌ *Nenhuma conta encontrada*\n\nO sistema ainda não possui contas cadastradas.\n\n🌐 *Cadastre-se em:*\nhttps://caderninhodigital.netlify.app`);
      return;
    }
    
    // Simular login bem-sucedido com o primeiro userId encontrado
    // Em produção, você validaria email/senha no Firebase Auth
    const targetUserId = userIds[0]; // Por enquanto, usar o primeiro usuário
    
    const success = await authenticateUser(telegramUserId, targetUserId);
    
    if (success) {
      // Salvar informações do usuário
      const userData = userMapping.get(telegramUserId);
      userMapping.set(telegramUserId, {
        ...userData,
        email: email,
        loginMethod: 'email_password'
      });
      
      bot.sendMessage(chatId, `✅ *Login realizado com sucesso!*\n\n👤 *Conta:* ${email}\n🆔 *ID:* \`${targetUserId}\`\n🕐 *Conectado em:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 *Agora você pode consultar seus dados empresariais!*\n\n💬 *Experimente:*\n• "Quanto vendi hoje?"\n• "Como está meu estoque?"\n• "Quem são meus clientes?"`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ *Falha na autenticação*\n\n📧 Email ou senha incorretos.\n\n💡 *Dicas:*\n• Verifique se digitou corretamente\n• Use o mesmo email do cadastro\n• Caso esqueceu a senha, acesse o sistema web\n\n🌐 *Recuperar senha:*\nhttps://caderninhodigital.netlify.app`);
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    bot.sendMessage(chatId, '❌ Erro durante autenticação. Tente novamente em alguns minutos.');
  }
}

// Função para login direto com userId
async function handleUserIdLogin(chatId, telegramUserId, targetUserId) {
  if (!db) {
    bot.sendMessage(chatId, '❌ Sistema temporariamente indisponível.');
    return;
  }
  
  try {
    bot.sendMessage(chatId, `🔐 Conectando com userId: \`${targetUserId}\`...`, { parse_mode: 'Markdown' });
    
    const success = await authenticateUser(telegramUserId, targetUserId);
    
    if (success) {
      bot.sendMessage(chatId, `✅ *Conectado com sucesso!*\n\n🆔 *UserID:* \`${targetUserId}\`\n🕐 *Conectado em:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 *Agora você pode consultar os dados!*\n\n💬 *Teste:*\n• "Quanto vendi hoje?"\n• "Como está meu estoque?"`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ *UserID não encontrado*\n\nO userId \`${targetUserId}\` não possui dados no sistema.\n\nUse /debug para ver userIds disponíveis.`, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    bot.sendMessage(chatId, '❌ Erro durante conexão. Tente novamente.');
  }
}

// Comando /login antigo (compatibilidade)
bot.onText(/\/login (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1].trim();
  const password = match[2].trim();
  
  if (!db) {
    bot.sendMessage(chatId, '❌ Sistema temporariamente indisponível. Tente novamente em alguns minutos.');
    return;
  }
  
  try {
    bot.sendMessage(chatId, `🔐 Autenticando ${email}...`);
    
    // Por enquanto, vamos simular autenticação e buscar userId por email
    // Em produção, você integraria com Firebase Auth
    const userIds = await getAllFirebaseUserIds();
    
    if (userIds.length === 0) {
      bot.sendMessage(chatId, `❌ *Nenhuma conta encontrada*\n\nO sistema ainda não possui contas cadastradas.\n\n🌐 *Cadastre-se em:*\nhttps://caderninhodigital.netlify.app`);
      return;
    }
    
    // Simular login bem-sucedido com o primeiro userId encontrado
    // Em produção, você validaria email/senha no Firebase Auth
    const targetUserId = userIds[0]; // Por enquanto, usar o primeiro usuário
    
    const success = await authenticateUser(msg.from.id, targetUserId);
    
    if (success) {
      // Salvar informações do usuário
      const userData = userMapping.get(msg.from.id);
      userMapping.set(msg.from.id, {
        ...userData,
        email: email,
        loginMethod: 'email_password'
      });
      
      bot.sendMessage(chatId, `✅ *Login realizado com sucesso!*\n\n👤 *Conta:* ${email}\n🆔 *ID:* \`${targetUserId}\`\n🕐 *Conectado em:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 *Agora você pode consultar seus dados empresariais!*\n\n💬 *Experimente:*\n• "Quanto vendi hoje?"\n• "Como está meu estoque?"\n• "Quem são meus clientes?"`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ *Falha na autenticação*\n\n📧 Email ou senha incorretos.\n\n💡 *Dicas:*\n• Verifique se digitou corretamente\n• Use o mesmo email do cadastro\n• Caso esqueceu a senha, acesse o sistema web\n\n🌐 *Recuperar senha:*\nhttps://caderninhodigital.netlify.app`);
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    bot.sendMessage(chatId, '❌ Erro durante autenticação. Tente novamente em alguns minutos.');
  }
});

// Comando /logout - desconectar da conta
bot.onText(/\/logout/, (msg) => {
  const chatId = msg.chat.id;
  const userData = userMapping.get(msg.from.id);
  
  if (userData?.isAuthenticated) {
    // Resetar para usuário não autenticado
    userMapping.set(msg.from.id, {
      firebaseUserId: `telegram_${msg.from.id}`,
      firstName: msg.from.first_name,
      isAuthenticated: false,
      registeredAt: new Date()
    });
    
    bot.sendMessage(chatId, `✅ *Logout realizado com sucesso!*\n\n👋 Você foi desconectado da sua conta.\n\n🔐 *Para conectar novamente:*\n\`/login seu@email.com suasenha\`\n\n🌐 *Sistema:* https://caderninhodigital.netlify.app`);
  } else {
    bot.sendMessage(chatId, `ℹ️ *Você não está conectado*\n\n🔐 *Para fazer login:*\n\`/login seu@email.com suasenha\`\n\n🌐 *Cadastre-se:* https://caderninhodigital.netlify.app`);
  }
});

// Manipulador genérico para mensagens de texto
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

  // Ignora comandos específicos
  if (userText.startsWith('/')) {
    return;
  }

  const userId = getUserId(msg.from.id, msg.from.first_name);

  try {
    console.log(`💬 Mensagem de ${msg.from.first_name}: ${userText}`);
    
    // Enviar para Groq para análise
    const groqResponse = await groq.chat.completions.create({
      messages: [{
        role: "system",
        content: `Você é um assistente IA do "Caderninho Digital", sistema de gestão comercial.

PERSONALIDADE:
- Seja amigável, profissional e proativo
- Use emojis apropriados
- Responda de forma clara e objetiva

FUNÇÕES DISPONÍVEIS:
- getSalesSummary(): vendas, faturamento, pagamentos pendentes
- getClientsSummary(): clientes, novos cadastros, top compradores  
- getProductsSummary(): estoque, produtos em falta, valor total

INSTRUÇÕES:
- Analise a pergunta do usuário
- Se for sobre vendas/faturamento, indique "USAR_VENDAS"
- Se for sobre clientes, indique "USAR_CLIENTES"  
- Se for sobre estoque/produtos, indique "USAR_PRODUTOS"
- Se for pergunta geral, responda normalmente
- Sempre seja útil e sugira próximos passos

Exemplos:
- "Quanto vendi hoje?" → "USAR_VENDAS - Vou buscar seu faturamento de hoje!"
- "Quantos clientes tenho?" → "USAR_CLIENTES - Verificando seus clientes cadastrados!"
- "Produtos acabando?" → "USAR_PRODUTOS - Analisando seu estoque!"
- "Oi" → "Olá! Como posso ajudar com seu negócio hoje?"

Responda de forma conversacional e indique a ação quando necessário.`
      }, {
        role: "user",
        content: userText
      }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 200
    });

    const aiResponse = groqResponse.choices[0]?.message?.content || "Desculpe, não entendi. Pode reformular?";
    
    console.log(`🤖 Resposta da IA: ${aiResponse}`);

    // Processar resposta e executar ações
    if (aiResponse.includes('USAR_VENDAS')) {
      bot.sendMessage(chatId, "📊 Buscando dados de vendas...");
      
      const summary = await getSalesSummary(userId);
      
      let response = `📊 *Resumo de Vendas*\n\n`;
      
      if (summary.isSimulated) {
        response += `⚠️ *Dados não disponíveis*\n\nPara ver dados reais:\n• Acesse: https://caderninhodigital.netlify.app\n• Registre suas vendas\n• Volte aqui para consultar!`;
      } else if (summary.countToday === 0) {
        response += `💰 *Hoje:* R$ 0,00 (0 vendas)\n\n🎯 *Dica:* Que tal registrar sua primeira venda do dia?`;
      } else {
        response += `💰 *Hoje:* R$ ${summary.totalToday.toFixed(2)}\n`;
        response += `🛒 *Vendas:* ${summary.countToday}\n`;
        response += `📈 *Ticket Médio:* R$ ${summary.averageTicket.toFixed(2)}\n`;
        
        if (summary.pendingPayments.length > 0) {
          response += `\n🔴 *Pagamentos Pendentes:*\n`;
          summary.pendingPayments.slice(0, 3).forEach(p => {
            response += `• ${p.clientName}: R$ ${p.remainingAmount.toFixed(2)}\n`;
          });
        }
      }
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } else if (aiResponse.includes('USAR_CLIENTES')) {
      bot.sendMessage(chatId, "👥 Buscando dados de clientes...");
      
      const summary = await getClientsSummary(userId);
      
      let response = `👥 *Gestão de Clientes*\n\n`;
      
      if (summary.isSimulated || summary.total === 0) {
        response += `⚠️ *Nenhum cliente cadastrado*\n\n🎯 *Benefícios:*\n• Vendas fiado organizadas\n• Histórico de compras\n• Controle de pagamentos\n\n💡 Cadastre em: https://caderninhodigital.netlify.app`;
      } else {
        response += `📊 *Total:* ${summary.total} clientes\n`;
        response += `🆕 *Novos este mês:* ${summary.newThisMonth}\n`;
        
        if (summary.topClients.length > 0) {
          response += `\n🏆 *Top Clientes:*\n`;
          summary.topClients.slice(0, 3).forEach(c => {
            response += `• ${c.name}: R$ ${c.totalPurchases.toFixed(2)}\n`;
          });
        }
      }
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } else if (aiResponse.includes('USAR_PRODUTOS')) {
      bot.sendMessage(chatId, "📦 Verificando estoque...");
      
      const summary = await getProductsSummary(userId);
      
      let response = `📦 *Controle de Estoque*\n\n`;
      
      if (summary.isSimulated || summary.total === 0) {
        response += `⚠️ *Nenhum produto cadastrado*\n\n🎯 *Benefícios:*\n• Controle de estoque\n• Alertas de reposição\n• Gestão de custos\n\n💡 Cadastre em: https://caderninhodigital.netlify.app`;
      } else {
        response += `📊 *Total:* ${summary.total} produtos\n`;
        response += `💰 *Valor do estoque:* R$ ${summary.totalValue.toFixed(2)}\n`;
        response += `⚠️ *Estoque baixo:* ${summary.lowStock} produtos\n`;
        
        if (summary.productsLowStock.length > 0) {
          response += `\n🔴 *Produtos para repor:*\n`;
          summary.productsLowStock.slice(0, 3).forEach(p => {
            response += `• ${p.name}: ${p.quantity} unid. (mín: ${p.minQuantity})\n`;
          });
        }
      }
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } else {
      // Resposta geral da IA
      bot.sendMessage(chatId, aiResponse);
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    bot.sendMessage(chatId, '❌ Ops! Houve um erro. Tente novamente ou use /ajuda para ver os comandos disponíveis.');
  }
});

// Tratamento de erros do bot
bot.on('polling_error', (error) => {
  console.error('❌ Erro de polling:', error.code);
});

// Servidor Express para health check
const app = express();

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Caderninho Digital Chatbot IA',
    timestamp: new Date().toISOString(),
    firebase: !!db,
    groq: !!GROQ_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

console.log('✅ Caderninho Digital Chatbot IA inicializado!');
console.log('📱 Bot pronto para receber mensagens no Telegram');
console.log('🔗 Sistema: https://caderninhodigital.netlify.app');
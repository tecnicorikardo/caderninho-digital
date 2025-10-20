require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const Groq = require('groq-sdk');
const express = require('express');

// --- Configurações ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const FIREBASE_PROJECT_ID = 'web-gestao-37a85'; // SEU PROJECT ID CORRETO
const PORT = process.env.PORT || 10000;

// Inicializa o Telegram Bot
let bot;
if (process.env.NODE_ENV === 'production') {
  // Em produção, usar webhook
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  console.log('🤖 Telegram bot inicializado (webhook mode)...');
} else {
  // Em desenvolvimento, usar polling
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('🤖 Telegram bot inicializado (polling mode)...');
}

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
  console.log('🔥 Firebase Admin SDK inicializado com sucesso!');
  console.log('📊 Conectado ao projeto:', FIREBASE_PROJECT_ID);
  
  // Testar conexão imediatamente
  db.collection('sales').limit(1).get()
    .then(snapshot => {
      console.log('✅ Teste de conexão Firebase: OK');
      console.log(`📋 Coleção sales: ${snapshot.size} documentos encontrados`);
    })
    .catch(err => {
      console.error('❌ Erro no teste de conexão:', err.message);
    });
    
} catch (error) {
  console.error('❌ ERRO CRÍTICO ao inicializar Firebase:', error.message);
  console.error('🔍 Detalhes:', error);
  console.log('⚠️  ATENÇÃO: Sistema funcionará com dados simulados!');
  db = null;
}

// Inicializa Groq SDK
const groq = new Groq({
  apiKey: GROQ_API_KEY
});
console.log('🧠 Groq SDK inicializado...');

// --- Mapeamento de usuários Telegram para Firebase ---
const userMapping = new Map();

// --- Funções para extrair dados dos textos ---

function extractSaleData(text) {
  const saleData = {
    total: 0,
    clientName: 'Cliente não informado',
    productName: 'Produto não informado',
    quantity: 1
  };
  
  // Extrair valor (R$ 50, 50 reais, 50.00, etc.)
  const valueRegex = /(?:R\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?/i;
  const valueMatch = text.match(valueRegex);
  if (valueMatch) {
    saleData.total = parseFloat(valueMatch[1].replace(',', '.'));
  }
  
  // Extrair nome do cliente (para João, cliente Maria, etc.)
  const clientRegex = /(?:para|cliente)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s|$|produto|R\$|\d)/i;
  const clientMatch = text.match(clientRegex);
  if (clientMatch) {
    saleData.clientName = clientMatch[1].trim();
  }
  
  // Extrair produto
  const productRegex = /(?:produto|item)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s|$|R\$|\d)/i;
  const productMatch = text.match(productRegex);
  if (productMatch) {
    saleData.productName = productMatch[1].trim();
  }
  
  return saleData;
}

function extractClientData(text) {
  const clientData = {
    name: '',
    phone: '',
    email: ''
  };
  
  // Extrair nome (cliente João Silva, cadastrar Maria Santos, etc.)
  const nameRegex = /(?:cliente|cadastrar|novo)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s|$|telefone|email|\d)/i;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    clientData.name = nameMatch[1].trim();
  }
  
  // Extrair telefone
  const phoneRegex = /(?:telefone|fone|cel)\s*(\d{10,11})/i;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    clientData.phone = phoneMatch[1];
  }
  
  // Extrair email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    clientData.email = emailMatch[1];
  }
  
  return clientData;
}

function extractProductData(text) {
  const productData = {
    name: '',
    price: 0,
    quantity: 0
  };
  
  // Extrair nome do produto
  const nameRegex = /(?:produto|item|cadastrar)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s|$|preço|R\$|\d)/i;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    productData.name = nameMatch[1].trim();
  }
  
  // Extrair preço
  const priceRegex = /(?:preço|R\$)\s*(\d+(?:[.,]\d{1,2})?)/i;
  const priceMatch = text.match(priceRegex);
  if (priceMatch) {
    productData.price = parseFloat(priceMatch[1].replace(',', '.'));
  }
  
  // Extrair quantidade/estoque
  const qtyRegex = /(?:estoque|quantidade)\s*(\d+)/i;
  const qtyMatch = text.match(qtyRegex);
  if (qtyMatch) {
    productData.quantity = parseInt(qtyMatch[1]);
  }
  
  return productData;
}

// Função para buscar todos os userIds do Firebase
async function getAllFirebaseUserIds() {
  if (!db) {
    console.log('⚠️ Firebase não conectado - retornando lista vazia');
    return [];
  }
  
  try {
    const userIds = new Set();
    
    // Buscar em todas as coleções para encontrar userIds únicos
    const collections = ['sales', 'clients', 'products', 'users'];
    
    console.log('🔍 Buscando contas de clientes no Firebase...');
    
    for (const collectionName of collections) {
      try {
        console.log(`📋 Verificando coleção: ${collectionName}`);
        const snapshot = await db.collection(collectionName).get();
        console.log(`📊 ${collectionName}: ${snapshot.size} documentos encontrados`);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          
          if (data.userId) {
            userIds.add(data.userId);
            console.log(`✅ Cliente encontrado: ${data.userId}`);
          }
          
          // Para coleção users, também verificar o ID do documento
          if (collectionName === 'users') {
            userIds.add(doc.id);
            console.log(`✅ Usuário encontrado: ${doc.id}`);
          }
        });
      } catch (collectionError) {
        console.error(`❌ Erro na coleção ${collectionName}:`, collectionError.message);
      }
    }
    
    const userIdArray = Array.from(userIds);
    console.log(`🎯 Total de contas encontradas: ${userIdArray.length}`);
    console.log('📋 Contas disponíveis:', userIdArray);
    
    return userIdArray;
  } catch (error) {
    console.error('❌ Erro ao buscar contas:', error);
    return [];
  }
}

// Função para buscar dados do usuário por email (para login público)
async function findUserByEmail(email) {
  if (!db) return null;
  
  try {
    console.log(`🔍 Buscando usuário por email: ${email}`);
    
    // Buscar na coleção users primeiro
    const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      console.log(`✅ Usuário encontrado na coleção users: ${userDoc.id}`);
      return {
        userId: userDoc.id,
        userData: userDoc.data()
      };
    }
    
    // Se não encontrou na coleção users, buscar em sales por email
    const salesSnapshot = await db.collection('sales').where('userEmail', '==', email).limit(1).get();
    
    if (!salesSnapshot.empty) {
      const saleDoc = salesSnapshot.docs[0];
      const saleData = saleDoc.data();
      console.log(`✅ Usuário encontrado via vendas: ${saleData.userId}`);
      return {
        userId: saleData.userId,
        userData: { email: email }
      };
    }
    
    console.log(`❌ Usuário não encontrado: ${email}`);
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por email:', error);
    return null;
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

// Função para registrar nova venda
async function registerSale(userId, saleData) {
  if (!db) {
    throw new Error('Firebase não conectado');
  }
  
  try {
    const sale = {
      userId: userId,
      total: saleData.total,
      clientName: saleData.clientName || 'Cliente não informado',
      productName: saleData.productName || 'Produto não informado',
      quantity: saleData.quantity || 1,
      paymentStatus: saleData.paymentStatus || 'pago',
      paymentMethod: saleData.paymentMethod || 'dinheiro',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('sales').add(sale);
    console.log(`✅ Venda registrada: ${docRef.id}`);
    
    return {
      success: true,
      id: docRef.id,
      sale: sale
    };
  } catch (error) {
    console.error('❌ Erro ao registrar venda:', error);
    throw error;
  }
}

// Função para cadastrar cliente
async function registerClient(userId, clientData) {
  if (!db) {
    throw new Error('Firebase não conectado');
  }
  
  try {
    const client = {
      userId: userId,
      name: clientData.name,
      phone: clientData.phone || '',
      email: clientData.email || '',
      address: clientData.address || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('clients').add(client);
    console.log(`✅ Cliente cadastrado: ${docRef.id}`);
    
    return {
      success: true,
      id: docRef.id,
      client: client
    };
  } catch (error) {
    console.error('❌ Erro ao cadastrar cliente:', error);
    throw error;
  }
}

// Função para cadastrar produto
async function registerProduct(userId, productData) {
  if (!db) {
    throw new Error('Firebase não conectado');
  }
  
  try {
    const product = {
      userId: userId,
      name: productData.name,
      price: productData.price,
      salePrice: productData.salePrice || productData.price,
      quantity: productData.quantity || 0,
      minQuantity: productData.minQuantity || 5,
      category: productData.category || 'Geral',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('products').add(product);
    console.log(`✅ Produto cadastrado: ${docRef.id}`);
    
    return {
      success: true,
      id: docRef.id,
      product: product
    };
  } catch (error) {
    console.error('❌ Erro ao cadastrar produto:', error);
    throw error;
  }
}

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
    
    // Primeiro, buscar clientes na coleção clients
    const clientsRef = db.collection('clients').where('userId', '==', userId);
    const snapshot = await clientsRef.get();
    
    console.log(`📋 Clientes na coleção clients: ${snapshot.size}`);
    
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

    // Se não há clientes cadastrados, extrair das vendas
    let clientsFromSales = new Map();
    const salesRef = db.collection('sales').where('userId', '==', userId);
    const salesSnapshot = await salesRef.get();
    
    console.log(`📊 Vendas encontradas: ${salesSnapshot.size}`);
    
    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      if (sale.clientName && sale.clientName.trim() !== '') {
        const clientKey = sale.clientName.toLowerCase();
        if (!clientsFromSales.has(clientKey)) {
          clientsFromSales.set(clientKey, {
            name: sale.clientName,
            totalPurchases: 0,
            purchaseCount: 0
          });
        }
        const client = clientsFromSales.get(clientKey);
        client.totalPurchases += sale.total || 0;
        client.purchaseCount += 1;
      }
    });

    // Se não há clientes cadastrados, usar dados das vendas
    let topClients = [];
    if (clients.length === 0 && clientsFromSales.size > 0) {
      console.log(`📝 Extraindo ${clientsFromSales.size} clientes das vendas`);
      
      topClients = Array.from(clientsFromSales.values())
        .sort((a, b) => b.totalPurchases - a.totalPurchases)
        .slice(0, 5);
        
      return {
        total: clientsFromSales.size,
        newThisMonth: 0, // Não temos data de cadastro das vendas
        withPendingPayments: 0,
        topClients,
        isSimulated: false,
        source: 'sales' // Indicar que veio das vendas
      };
    }

    // Calcular top clientes da coleção clients
    const clientPurchases = new Map();
    
    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      if (sale.clientId) {
        const current = clientPurchases.get(sale.clientId) || 0;
        clientPurchases.set(sale.clientId, current + (sale.total || 0));
      }
    });

    topClients = clients
      .map(client => ({
        id: client.id,
        name: client.name,
        totalPurchases: clientPurchases.get(client.id) || 0
      }))
      .filter(client => client.totalPurchases > 0)
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 5);

    console.log(`✅ Encontrados ${clients.length} clientes cadastrados`);
    
    return {
      total: clients.length,
      newThisMonth,
      withPendingPayments: 0,
      topClients,
      isSimulated: false,
      source: 'clients'
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    return {
      total: 0,
      newThisMonth: 0,
      withPendingPayments: 0,
      topClients: [],
      isSimulated: false,
      error: error.message
    };
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
    
    // Buscar produtos na coleção products
    const productsRef = db.collection('products').where('userId', '==', userId);
    const snapshot = await productsRef.get();
    
    console.log(`📋 Produtos na coleção products: ${snapshot.size}`);

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
      totalValue += (product.quantity || 0) * (product.salePrice || product.price || 0);
      
      // Verificar estoque baixo
      const minQty = product.minQuantity || 5;
      if ((product.quantity || 0) <= minQty) {
        productsLowStock.push({
          id: product.id,
          name: product.name || 'Produto sem nome',
          quantity: product.quantity || 0,
          minQuantity: minQty
        });
      }
    });

    // Se não há produtos cadastrados, extrair das vendas
    if (products.length === 0) {
      console.log(`📊 Nenhum produto cadastrado, extraindo das vendas...`);
      
      const salesRef = db.collection('sales').where('userId', '==', userId);
      const salesSnapshot = await salesRef.get();
      
      const productsFromSales = new Map();
      
      salesSnapshot.forEach((doc) => {
        const sale = doc.data();
        
        // Verificar se há produtos na venda
        if (sale.products && Array.isArray(sale.products)) {
          sale.products.forEach(product => {
            if (product.name) {
              const key = product.name.toLowerCase();
              if (!productsFromSales.has(key)) {
                productsFromSales.set(key, {
                  name: product.name,
                  totalSold: 0,
                  revenue: 0,
                  price: product.price || 0
                });
              }
              const p = productsFromSales.get(key);
              p.totalSold += product.quantity || 1;
              p.revenue += (product.quantity || 1) * (product.price || 0);
            }
          });
        }
        
        // Se não há array de produtos, usar campos diretos
        if (sale.productName || sale.product) {
          const productName = sale.productName || sale.product;
          const key = productName.toLowerCase();
          if (!productsFromSales.has(key)) {
            productsFromSales.set(key, {
              name: productName,
              totalSold: 0,
              revenue: 0,
              price: sale.productPrice || 0
            });
          }
          const p = productsFromSales.get(key);
          p.totalSold += sale.quantity || 1;
          p.revenue += sale.total || 0;
        }
      });
      
      if (productsFromSales.size > 0) {
        console.log(`📝 Extraídos ${productsFromSales.size} produtos das vendas`);
        
        return {
          total: productsFromSales.size,
          lowStock: 0, // Não temos controle de estoque das vendas
          totalValue: Array.from(productsFromSales.values()).reduce((sum, p) => sum + p.revenue, 0),
          productsFromSales: Array.from(productsFromSales.values()).slice(0, 10),
          isSimulated: false,
          source: 'sales'
        };
      }
      
      return {
        total: 0,
        lowStock: 0,
        totalValue: 0.00,
        productsLowStock: [],
        isSimulated: false,
        source: 'empty'
      };
    }

    console.log(`✅ Encontrados ${products.length} produtos cadastrados`);
    
    return {
      total: products.length,
      lowStock: productsLowStock.length,
      totalValue,
      productsLowStock: productsLowStock.slice(0, 10),
      isSimulated: false,
      source: 'products'
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return {
      total: 0,
      lowStock: 0,
      totalValue: 0.00,
      productsLowStock: [],
      isSimulated: false,
      error: error.message
    };
  }
}

// --- Comandos do Bot Telegram ---

// --- Função auxiliar para enviar mensagens com botões ---
async function sendMessageWithButtons(chatId, message, buttons) {
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  };
  
  try {
    await bot.sendMessage(chatId, message, options);
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem com botões:', error);
    // Fallback: enviar mensagem sem botões
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
}

// Comando /start - SOLICITA LOGIN
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let userData = userMapping.get(msg.from.id);
  
  // Se já está autenticado, mostrar menu principal
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
  
  // Se não está autenticado, PERGUNTAR para fazer login
  const welcomeMessage = `🎉 *Olá, ${msg.from.first_name}!*

🤖 *Caderninho Digital - Assistente IA*
💼 *Chatbot PÚBLICO para empresários*

🔐 *FAÇA LOGIN COM SUA CONTA:*

📧 *Login com email e senha:*
\`/login seu@email.com suasenha\`

🆔 *Login direto com ID:*
\`/login seu_user_id\`

❓ *Não tem conta empresarial?*
🌐 *Cadastre-se GRÁTIS:* https://web-gestao-37a85.web.app

👥 *Este bot é público - seus clientes podem usar!*
📱 *Compartilhe este bot com outros empresários*

💡 *Dica:* Use os botões para ajuda!`;

  const buttons = [
    [
      { text: '🔐 Como fazer login?', callback_data: 'help_login' },
      { text: '📋 Ver contas disponíveis', callback_data: 'list_users' }
    ],
    [
      { text: '❓ Ajuda completa', callback_data: 'ajuda_completa' },
      { text: '🌐 Acessar sistema', callback_data: 'open_system' }
    ]
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

📋 *Comandos de cadastro:*
/venda - Registrar nova venda
/cliente - Cadastrar cliente
/produto - Cadastrar produto
/pagamento - Registrar pagamento

💬 *Consultas que posso fazer:*
• "Quanto vendi hoje?"
• "Quantos clientes tenho?"
• "Produtos com estoque baixo?"
• "Quem está devendo?"
• "Resumo financeiro do mês"

📝 *Cadastros que posso fazer:*
• "Registrar venda de R$ 50 para João"
• "Cadastrar cliente Maria Silva"
• "Adicionar produto Camiseta R$ 25"
• "Cliente João pagou R$ 30"

🤖 *Inteligência Artificial:*
Converse naturalmente comigo! Entendo tanto consultas quanto cadastros.

🌐 *Sistema completo:*
https://web-gestao-37a85.web.app`;

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

// Comando /forcelogin - login automático com primeira conta encontrada
bot.onText(/\/forcelogin/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '🔐 Buscando contas disponíveis...');
    
    if (!db) {
      bot.sendMessage(chatId, '❌ *Firebase não conectado*\n\nSistema está usando dados simulados.\n\n🔧 Verifique a configuração do Firebase.', { parse_mode: 'Markdown' });
      return;
    }
    
    const userIds = await getAllFirebaseUserIds();
    
    if (userIds.length === 0) {
      bot.sendMessage(chatId, '❌ *Nenhuma conta encontrada*\n\n📭 O sistema não possui dados cadastrados ainda.\n\n🌐 *Cadastre-se primeiro em:*\nhttps://web-gestao-37a85.web.app\n\n💡 *Depois volte e use:* `/forcelogin`', { parse_mode: 'Markdown' });
      return;
    }
    
    // Usar a primeira conta encontrada
    const targetUserId = userIds[0];
    bot.sendMessage(chatId, `🔐 Conectando com conta: \`${targetUserId}\`...`, { parse_mode: 'Markdown' });
    
    const success = await authenticateUser(msg.from.id, targetUserId);
    
    if (success) {
      bot.sendMessage(chatId, `✅ *CONECTADO COM DADOS REAIS!*\n\n🆔 *Conta:* \`${targetUserId}\`\n🕐 *Conectado:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 *Agora você pode consultar dados reais!*\n\n💬 *Teste estas perguntas:*\n• "Quanto vendi hoje?"\n• "Quantos clientes tenho?"\n• "Como está meu estoque?"\n• "Resumo do mês"\n\n🤖 *Ou use os botões:*`, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
              { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' }
            ],
            [
              { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' },
              { text: '📈 Dashboard', callback_data: 'dashboard' }
            ]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, `❌ *Erro na conexão*\n\nNão foi possível conectar com a conta \`${targetUserId}\`\n\n🔄 *Tente:*\n• \`/debug\` - verificar dados\n• \`/usuarios\` - ver contas disponíveis`, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('❌ Erro no forcelogin:', error);
    bot.sendMessage(chatId, `❌ *Erro no login automático*\n\n\`${error.message}\`\n\n🔧 Use \`/debug\` para verificar o sistema.`, { parse_mode: 'Markdown' });
  }
});

// Comando /debug - verificar dados REAIS no Firebase
bot.onText(/\/debug/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!db) {
    bot.sendMessage(chatId, '❌ *Firebase não conectado*\n\n⚠️ Sistema está usando dados simulados.\n\n🔧 *Verifique:*\n• Arquivo serviceAccountKey.json\n• Variáveis de ambiente\n• Conexão com internet', { parse_mode: 'Markdown' });
    return;
  }
  
  try {
    bot.sendMessage(chatId, '🔍 Analisando dados REAIS no Firebase...');
    
    let debugInfo = '🔍 *Status dos Dados REAIS*\n\n';
    debugInfo += `🔥 *Firebase:* ✅ Conectado\n`;
    debugInfo += `📊 *Projeto:* ${FIREBASE_PROJECT_ID}\n\n`;
    
    // Verificar cada coleção com mais detalhes
    const collections = ['sales', 'clients', 'products', 'users'];
    let totalDocs = 0;
    const userId = 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2'; // Seu userId
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const userSnapshot = await db.collection(collectionName).where('userId', '==', userId).get();
        
        totalDocs += snapshot.size;
        debugInfo += `📋 *${collectionName}:*\n`;
        debugInfo += `└ Total: ${snapshot.size} documentos\n`;
        debugInfo += `└ Seus dados: ${userSnapshot.size} documentos\n`;
        
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0].data();
          debugInfo += `└ Exemplo userId: \`${firstDoc.userId || firstDoc.id || 'N/A'}\`\n`;
          
          // Mostrar alguns campos do primeiro documento
          if (collectionName === 'sales' && firstDoc.total) {
            debugInfo += `└ Exemplo venda: R$ ${firstDoc.total}\n`;
          }
          if (collectionName === 'clients' && firstDoc.name) {
            debugInfo += `└ Exemplo cliente: ${firstDoc.name}\n`;
          }
          if (collectionName === 'products' && firstDoc.name) {
            debugInfo += `└ Exemplo produto: ${firstDoc.name}\n`;
          }
        }
        
        // Mostrar dados específicos do usuário
        if (userSnapshot.size > 0) {
          const userDoc = userSnapshot.docs[0].data();
          if (collectionName === 'sales') {
            debugInfo += `└ Sua venda: R$ ${userDoc.total || 0}\n`;
          }
          if (collectionName === 'clients') {
            debugInfo += `└ Seu cliente: ${userDoc.name || 'N/A'}\n`;
          }
          if (collectionName === 'products') {
            debugInfo += `└ Seu produto: ${userDoc.name || 'N/A'}\n`;
          }
        }
        debugInfo += '\n';
      } catch (collError) {
        debugInfo += `📋 *${collectionName}:* ❌ Erro de acesso\n\n`;
      }
    }
    
    // Buscar todos os userIds
    const userIds = await getAllFirebaseUserIds();
    debugInfo += `👥 *Contas encontradas:* ${userIds.length}\n`;
    
    if (userIds.length > 0) {
      debugInfo += `\n🎯 *Contas disponíveis:*\n`;
      userIds.slice(0, 3).forEach((id, index) => {
        debugInfo += `${index + 1}. \`${id}\`\n`;
      });
      debugInfo += `\n💡 *Teste login:* \`/login ${userIds[0]}\``;
    }
    
    debugInfo += `\n\n📊 *Resumo:*\n`;
    debugInfo += `• Total de documentos: ${totalDocs}\n`;
    debugInfo += `• Status: ${totalDocs > 0 ? '✅ Dados encontrados' : '⚠️ Sem dados'}`;
    
    bot.sendMessage(chatId, debugInfo, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    bot.sendMessage(chatId, `❌ *Erro no debug:*\n\n\`${error.message}\`\n\n🔧 Verifique a configuração do Firebase.`, { parse_mode: 'Markdown' });
  }
});

// Comando /testall - testar todas as funções
bot.onText(/\/testall/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2';
  
  if (!db) {
    bot.sendMessage(chatId, '❌ Firebase não conectado');
    return;
  }
  
  try {
    bot.sendMessage(chatId, '🧪 Testando todas as funções...');
    
    // Testar vendas
    bot.sendMessage(chatId, '📊 Testando vendas...');
    const salesSummary = await getSalesSummary(userId);
    bot.sendMessage(chatId, `✅ Vendas: ${salesSummary.countToday} hoje, R$ ${salesSummary.totalToday.toFixed(2)}`);
    
    // Testar clientes
    bot.sendMessage(chatId, '👥 Testando clientes...');
    const clientsSummary = await getClientsSummary(userId);
    bot.sendMessage(chatId, `✅ Clientes: ${clientsSummary.total} total, ${clientsSummary.newThisMonth} novos`);
    
    // Testar produtos
    bot.sendMessage(chatId, '📦 Testando produtos...');
    const productsSummary = await getProductsSummary(userId);
    bot.sendMessage(chatId, `✅ Produtos: ${productsSummary.total} total, R$ ${productsSummary.totalValue.toFixed(2)} em estoque`);
    
    bot.sendMessage(chatId, '🎉 Teste completo finalizado!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
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

// Função para login com email e senha (SISTEMA PÚBLICO)
async function handleEmailPasswordLogin(chatId, telegramUserId, email, password) {
  if (!db) {
    bot.sendMessage(chatId, '❌ Sistema temporariamente indisponível. Tente novamente em alguns minutos.');
    return;
  }
  
  try {
    bot.sendMessage(chatId, `🔐 Verificando conta: ${email}...`);
    
    // Buscar usuário por email no Firebase
    const userResult = await findUserByEmail(email);
    
    if (!userResult) {
      bot.sendMessage(chatId, `❌ *Email não encontrado*\n\n📧 *Email:* ${email}\n\n💡 *Verifique se:*\n• Digitou o email corretamente\n• Já se cadastrou no sistema\n• Já registrou vendas/produtos\n\n🌐 *Cadastre-se em:*\nhttps://web-gestao-37a85.web.app\n\n📋 *Ver contas disponíveis:* /usuarios`, { parse_mode: 'Markdown' });
      return;
    }
    
    // Por enquanto, aceitar qualquer senha (em produção, validar com Firebase Auth)
    // Simular validação de senha
    if (password.length < 3) {
      bot.sendMessage(chatId, `❌ *Senha muito simples*\n\nUse uma senha com pelo menos 3 caracteres.\n\n💡 *Tente novamente:*\n\`/login ${email} suasenha123\``);
      return;
    }
    
    const success = await authenticateUser(telegramUserId, userResult.userId);
    
    if (success) {
      // Salvar informações do usuário
      const userData = userMapping.get(telegramUserId);
      userMapping.set(telegramUserId, {
        ...userData,
        email: email,
        loginMethod: 'email_password',
        realUserData: userResult.userData
      });
      
      bot.sendMessage(chatId, `✅ *BEM-VINDO AO SEU ASSISTENTE!*\n\n👤 *Conta:* ${email}\n🆔 *ID:* \`${userResult.userId}\`\n🕐 *Conectado:* ${new Date().toLocaleString('pt-BR')}\n\n🎉 *Agora você pode consultar seus dados!*\n\n💬 *Experimente perguntar:*\n• "Quanto vendi hoje?"\n• "Como está meu estoque?"\n• "Quem são meus clientes?"\n• "Resumo do mês"\n\n🤖 *Ou use os botões abaixo:*`, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
              { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' }
            ],
            [
              { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' },
              { text: '📈 Resumo Geral', callback_data: 'dashboard' }
            ]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, `❌ *Erro na autenticação*\n\nNão foi possível conectar à sua conta.\n\n🔄 *Tente novamente:*\n\`/login ${email} ${password}\`\n\n📞 *Suporte:* Entre em contato pelo sistema web`);
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

// Comando /venda - registrar nova venda
bot.onText(/\/venda/, (msg) => {
  const chatId = msg.chat.id;
  const userData = userMapping.get(msg.from.id);
  
  if (!userData?.isAuthenticated) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro!*\n\nUse: `/login seu@email.com senha`', { parse_mode: 'Markdown' });
    return;
  }
  
  const helpMessage = `🛒 *Registrar Nova Venda*

📝 *Formato:*
\`/venda [valor] [cliente] [produto]\`

💡 *Exemplos:*
\`/venda 50.00 João Silva Camiseta\`
\`/venda 25 Maria Calça Jeans\`
\`/venda 100.50 Pedro Santos Tênis Nike\`

📋 *Ou use o formato completo:*
\`Registrar venda de R$ 50 para João\`
\`Venda de 25 reais produto camiseta\`

🎯 *Dica:* Você também pode conversar naturalmente!
"Registrei uma venda de R$ 30 para a Maria"`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /cliente - cadastrar cliente
bot.onText(/\/cliente/, (msg) => {
  const chatId = msg.chat.id;
  const userData = userMapping.get(msg.from.id);
  
  if (!userData?.isAuthenticated) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro!*', { parse_mode: 'Markdown' });
    return;
  }
  
  const helpMessage = `👥 *Cadastrar Novo Cliente*

📝 *Formato:*
\`/cliente [nome] [telefone] [email]\`

💡 *Exemplos:*
\`/cliente João Silva 11999887766 joao@email.com\`
\`/cliente Maria Santos 11888776655\`
\`/cliente Pedro Costa\`

📋 *Ou converse naturalmente:*
"Cadastrar cliente João Silva telefone 11999887766"
"Novo cliente Maria Santos"

🎯 *Campos opcionais:* telefone e email`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /produto - cadastrar produto
bot.onText(/\/produto/, (msg) => {
  const chatId = msg.chat.id;
  const userData = userMapping.get(msg.from.id);
  
  if (!userData?.isAuthenticated) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro!*', { parse_mode: 'Markdown' });
    return;
  }
  
  const helpMessage = `📦 *Cadastrar Novo Produto*

📝 *Formato:*
\`/produto [nome] [preço] [quantidade]\`

💡 *Exemplos:*
\`/produto Camiseta 25.00 50\`
\`/produto Calça Jeans 80.50 20\`
\`/produto Tênis Nike 150\`

📋 *Ou converse naturalmente:*
"Cadastrar produto Camiseta preço R$ 25"
"Novo produto Calça Jeans R$ 80 estoque 20"

🎯 *Campos opcionais:* quantidade (padrão: 0)`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
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
CONSULTAS:
- getSalesSummary(): vendas, faturamento, pagamentos pendentes
- getClientsSummary(): clientes, novos cadastros, top compradores  
- getProductsSummary(): estoque, produtos em falta, valor total

CADASTROS:
- registerSale(): registrar nova venda
- registerClient(): cadastrar cliente
- registerProduct(): cadastrar produto

INSTRUÇÕES:
- Analise a pergunta/comando do usuário
- Para CONSULTAS, use: "USAR_VENDAS", "USAR_CLIENTES", "USAR_PRODUTOS"
- Para CADASTROS, use: "CADASTRAR_VENDA", "CADASTRAR_CLIENTE", "CADASTRAR_PRODUTO"
- Se for pergunta geral, responda normalmente

Exemplos de CONSULTAS:
- "Quanto vendi hoje?" → "USAR_VENDAS - Vou buscar seu faturamento!"
- "Quantos clientes tenho?" → "USAR_CLIENTES - Verificando seus clientes!"
- "Como está o estoque?" → "USAR_PRODUTOS - Analisando seu estoque!"

Exemplos de CADASTROS:
- "Registrar venda de R$ 50 para João" → "CADASTRAR_VENDA - Vou registrar essa venda!"
- "Cadastrar cliente Maria Silva" → "CADASTRAR_CLIENTE - Vou cadastrar esse cliente!"
- "Adicionar produto Camiseta R$ 25" → "CADASTRAR_PRODUTO - Vou cadastrar esse produto!"
- "Vendi 30 reais para Pedro" → "CADASTRAR_VENDA - Registrando sua venda!"

EXTRAÇÃO DE DADOS:
Para cadastros, extraia:
- VENDA: valor, cliente, produto
- CLIENTE: nome, telefone, email
- PRODUTO: nome, preço, quantidade

Responda de forma conversacional e execute a ação apropriada.`
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
      
      if (summary.error) {
        response += `❌ *Erro:* ${summary.error}\n\n🔧 Verifique a conexão com o Firebase.`;
      } else if (summary.isSimulated || summary.total === 0) {
        response += `⚠️ *Nenhum cliente encontrado*\n\n🎯 *Para ter dados de clientes:*\n• Cadastre clientes no sistema\n• Registre vendas com nome do cliente\n• Use o campo "Cliente" nas vendas\n\n💡 Cadastre em: https://web-gestao-37a85.web.app`;
      } else {
        response += `📊 *Total:* ${summary.total} clientes`;
        
        if (summary.source === 'sales') {
          response += ` (extraídos das vendas)`;
        }
        response += `\n`;
        
        if (summary.newThisMonth > 0) {
          response += `🆕 *Novos este mês:* ${summary.newThisMonth}\n`;
        }
        
        if (summary.topClients.length > 0) {
          response += `\n🏆 *Principais Clientes:*\n`;
          summary.topClients.slice(0, 3).forEach(c => {
            response += `• ${c.name}: R$ ${c.totalPurchases.toFixed(2)}\n`;
          });
        }
        
        if (summary.source === 'sales') {
          response += `\n💡 *Dica:* Cadastre clientes no sistema para ter mais controle!`;
        }
      }
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } else if (aiResponse.includes('USAR_PRODUTOS')) {
      bot.sendMessage(chatId, "📦 Verificando estoque...");
      
      const summary = await getProductsSummary(userId);
      
      let response = `📦 *Controle de Estoque*\n\n`;
      
      if (summary.error) {
        response += `❌ *Erro:* ${summary.error}\n\n🔧 Verifique a conexão com o Firebase.`;
      } else if (summary.isSimulated || (summary.total === 0 && summary.source === 'empty')) {
        response += `⚠️ *Nenhum produto encontrado*\n\n🎯 *Para ter controle de estoque:*\n• Cadastre produtos no sistema\n• Registre vendas com produtos\n• Use o campo "Produto" nas vendas\n\n💡 Cadastre em: https://web-gestao-37a85.web.app`;
      } else {
        response += `📊 *Total:* ${summary.total} produtos`;
        
        if (summary.source === 'sales') {
          response += ` (extraídos das vendas)`;
        }
        response += `\n`;
        
        response += `💰 *Valor total:* R$ ${summary.totalValue.toFixed(2)}\n`;
        
        if (summary.source === 'products') {
          response += `⚠️ *Estoque baixo:* ${summary.lowStock} produtos\n`;
          
          if (summary.productsLowStock.length > 0) {
            response += `\n🔴 *Produtos para repor:*\n`;
            summary.productsLowStock.slice(0, 3).forEach(p => {
              response += `• ${p.name}: ${p.quantity} unid.\n`;
            });
          }
        } else if (summary.source === 'sales' && summary.productsFromSales) {
          response += `\n📈 *Produtos mais vendidos:*\n`;
          summary.productsFromSales.slice(0, 3).forEach(p => {
            response += `• ${p.name}: ${p.totalSold} vendidos\n`;
          });
        }
        
        if (summary.source === 'sales') {
          response += `\n💡 *Dica:* Cadastre produtos no sistema para controle de estoque!`;
        }
      }
      
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
      
    } else if (aiResponse.includes('CADASTRAR_VENDA')) {
      // Extrair dados da venda do texto do usuário
      const saleData = extractSaleData(userText);
      
      if (!saleData.total) {
        bot.sendMessage(chatId, '❌ *Valor da venda não encontrado*\n\n💡 *Exemplos:*\n• "Venda de R$ 50 para João"\n• "Registrar venda 25 reais"\n• `/venda 30.00 Maria Camiseta`', { parse_mode: 'Markdown' });
        return;
      }
      
      try {
        bot.sendMessage(chatId, '💾 Registrando venda...');
        
        const result = await registerSale(userId, saleData);
        
        if (result.success) {
          bot.sendMessage(chatId, `✅ *Venda registrada com sucesso!*\n\n💰 *Valor:* R$ ${saleData.total.toFixed(2)}\n👤 *Cliente:* ${saleData.clientName}\n📦 *Produto:* ${saleData.productName}\n🆔 *ID:* \`${result.id}\`\n\n🎉 *Venda adicionada ao seu faturamento!*`, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        bot.sendMessage(chatId, `❌ *Erro ao registrar venda:*\n\n\`${error.message}\`\n\n🔄 Tente novamente ou use /venda para ver exemplos.`, { parse_mode: 'Markdown' });
      }
      
    } else if (aiResponse.includes('CADASTRAR_CLIENTE')) {
      // Extrair dados do cliente do texto do usuário
      const clientData = extractClientData(userText);
      
      if (!clientData.name) {
        bot.sendMessage(chatId, '❌ *Nome do cliente não encontrado*\n\n💡 *Exemplos:*\n• "Cadastrar cliente João Silva"\n• "Novo cliente Maria Santos telefone 11999887766"\n• `/cliente Pedro Costa`', { parse_mode: 'Markdown' });
        return;
      }
      
      try {
        bot.sendMessage(chatId, '💾 Cadastrando cliente...');
        
        const result = await registerClient(userId, clientData);
        
        if (result.success) {
          let response = `✅ *Cliente cadastrado com sucesso!*\n\n👤 *Nome:* ${clientData.name}`;
          if (clientData.phone) response += `\n📱 *Telefone:* ${clientData.phone}`;
          if (clientData.email) response += `\n📧 *Email:* ${clientData.email}`;
          response += `\n🆔 *ID:* \`${result.id}\`\n\n🎉 *Cliente adicionado à sua base!*`;
          
          bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        bot.sendMessage(chatId, `❌ *Erro ao cadastrar cliente:*\n\n\`${error.message}\`\n\n🔄 Tente novamente ou use /cliente para ver exemplos.`, { parse_mode: 'Markdown' });
      }
      
    } else if (aiResponse.includes('CADASTRAR_PRODUTO')) {
      // Extrair dados do produto do texto do usuário
      const productData = extractProductData(userText);
      
      if (!productData.name || !productData.price) {
        bot.sendMessage(chatId, '❌ *Nome ou preço do produto não encontrado*\n\n💡 *Exemplos:*\n• "Cadastrar produto Camiseta R$ 25"\n• "Novo produto Calça Jeans preço 80 reais"\n• `/produto Tênis 150.00 10`', { parse_mode: 'Markdown' });
        return;
      }
      
      try {
        bot.sendMessage(chatId, '💾 Cadastrando produto...');
        
        const result = await registerProduct(userId, productData);
        
        if (result.success) {
          let response = `✅ *Produto cadastrado com sucesso!*\n\n📦 *Nome:* ${productData.name}\n💰 *Preço:* R$ ${productData.price.toFixed(2)}`;
          if (productData.quantity > 0) response += `\n📊 *Estoque:* ${productData.quantity} unidades`;
          response += `\n🆔 *ID:* \`${result.id}\`\n\n🎉 *Produto adicionado ao seu catálogo!*`;
          
          bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        bot.sendMessage(chatId, `❌ *Erro ao cadastrar produto:*\n\n\`${error.message}\`\n\n🔄 Tente novamente ou use /produto para ver exemplos.`, { parse_mode: 'Markdown' });
      }
      
    } else {
      // Resposta geral da IA
      bot.sendMessage(chatId, aiResponse);
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    bot.sendMessage(chatId, '❌ Ops! Houve um erro. Tente novamente ou use /ajuda para ver os comandos disponíveis.');
  }
});

// --- Handlers para botões interativos ---
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = getUserId(callbackQuery.from.id, callbackQuery.from.first_name);
  const userData = userMapping.get(callbackQuery.from.id);

  // Confirmar recebimento do callback
  await bot.answerCallbackQuery(callbackQuery.id);

  try {
    switch (data) {
      case 'help_login':
        const loginHelp = `🔐 *Como fazer login no bot:*

📧 *Método 1 - Email e senha:*
\`/login seu@email.com suasenha\`

🆔 *Método 2 - ID direto:*
\`/login ECYMxTpm46b2iNUNU0aNHIbdfTJ2\`

🔍 *Método 3 - Ver contas disponíveis:*
\`/usuarios\`

⚡ *Login rápido (teste):*
\`/forcelogin\`

💡 *Dica:* Use o mesmo email e senha do sistema web!`;
        
        await bot.editMessageText(loginHelp, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Voltar ao início', callback_data: 'back_start' }]
            ]
          }
        });
        break;

      case 'list_users':
        await bot.editMessageText('🔍 Verificando contas no sistema...', {
          chat_id: chatId,
          message_id: messageId
        });
        
        if (!db) {
          await bot.editMessageText('❌ Sistema temporariamente indisponível.', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Voltar', callback_data: 'back_start' }]
              ]
            }
          });
          break;
        }
        
        const userIds = await getAllFirebaseUserIds();
        let usersMessage = `📊 *Contas no sistema:* ${userIds.length}\n\n`;
        
        if (userIds.length === 0) {
          usersMessage += `📭 *Nenhuma conta encontrada*\n\n🌐 *Cadastre-se primeiro:*\nhttps://web-gestao-37a85.web.app`;
        } else {
          usersMessage += `🆔 *IDs disponíveis para teste:*\n`;
          userIds.slice(0, 3).forEach((id, index) => {
            usersMessage += `${index + 1}. \`${id}\`\n`;
          });
          usersMessage += `\n💡 *Teste:* \`/login ${userIds[0]}\``;
        }
        
        await bot.editMessageText(usersMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Voltar ao início', callback_data: 'back_start' }]
            ]
          }
        });
        break;

      case 'vendas_detalhadas':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*\n\nUse: `/login seu@email.com senha`', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        await bot.editMessageText('📊 Carregando dados de vendas...', {
          chat_id: chatId,
          message_id: messageId
        });
        
        const salesSummary = await getSalesSummary(userId);
        let salesMessage = `📊 *Relatório de Vendas*\n\n`;
        
        if (salesSummary.isSimulated || salesSummary.countToday === 0) {
          salesMessage += `💰 *Hoje:* R$ 0,00 (0 vendas)\n\n`;
          salesMessage += `📈 *Dicas para aumentar vendas:*\n`;
          salesMessage += `• Registre todas as vendas no sistema\n`;
          salesMessage += `• Acompanhe o ticket médio\n`;
          salesMessage += `• Monitore pagamentos pendentes\n\n`;
          salesMessage += `🌐 *Registrar venda:* https://web-gestao-37a85.web.app`;
        } else {
          salesMessage += `💰 *Hoje:* R$ ${salesSummary.totalToday.toFixed(2)}\n`;
          salesMessage += `🛒 *Vendas:* ${salesSummary.countToday}\n`;
          salesMessage += `📈 *Ticket Médio:* R$ ${salesSummary.averageTicket.toFixed(2)}\n`;
          
          if (salesSummary.pendingPayments.length > 0) {
            salesMessage += `\n🔴 *Pagamentos Pendentes:*\n`;
            salesSummary.pendingPayments.slice(0, 3).forEach(p => {
              salesMessage += `• ${p.clientName}: R$ ${p.remainingAmount.toFixed(2)}\n`;
            });
          }
        }
        
        await bot.editMessageText(salesMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' },
                { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' }
              ],
              [{ text: '🔙 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        break;

      case 'clientes_detalhados':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        await bot.editMessageText('👥 Carregando dados de clientes...', {
          chat_id: chatId,
          message_id: messageId
        });
        
        const clientsSummary = await getClientsSummary(userId);
        let clientsMessage = `👥 *Gestão de Clientes*\n\n`;
        
        if (clientsSummary.isSimulated || clientsSummary.total === 0) {
          clientsMessage += `📊 *Total:* 0 clientes\n\n`;
          clientsMessage += `🎯 *Benefícios de cadastrar clientes:*\n`;
          clientsMessage += `• Vendas fiado organizadas\n`;
          clientsMessage += `• Histórico de compras\n`;
          clientsMessage += `• Controle de pagamentos\n\n`;
          clientsMessage += `💡 *Cadastre em:* https://web-gestao-37a85.web.app`;
        } else {
          clientsMessage += `📊 *Total:* ${clientsSummary.total} clientes\n`;
          clientsMessage += `🆕 *Novos este mês:* ${clientsSummary.newThisMonth}\n`;
          
          if (clientsSummary.topClients.length > 0) {
            clientsMessage += `\n🏆 *Top Clientes:*\n`;
            clientsSummary.topClients.slice(0, 3).forEach(c => {
              clientsMessage += `• ${c.name}: R$ ${c.totalPurchases.toFixed(2)}\n`;
            });
          }
        }
        
        await bot.editMessageText(clientsMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
                { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' }
              ],
              [{ text: '🔙 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        break;

      case 'estoque_detalhado':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        await bot.editMessageText('📦 Verificando estoque...', {
          chat_id: chatId,
          message_id: messageId
        });
        
        const productsSummary = await getProductsSummary(userId);
        let productsMessage = `📦 *Controle de Estoque*\n\n`;
        
        if (productsSummary.isSimulated || productsSummary.total === 0) {
          productsMessage += `📊 *Total:* 0 produtos\n\n`;
          productsMessage += `🎯 *Benefícios do controle de estoque:*\n`;
          productsMessage += `• Evitar produtos em falta\n`;
          productsMessage += `• Alertas de reposição\n`;
          productsMessage += `• Gestão de custos\n\n`;
          productsMessage += `💡 *Cadastre em:* https://web-gestao-37a85.web.app`;
        } else {
          productsMessage += `📊 *Total:* ${productsSummary.total} produtos\n`;
          productsMessage += `💰 *Valor do estoque:* R$ ${productsSummary.totalValue.toFixed(2)}\n`;
          productsMessage += `⚠️ *Estoque baixo:* ${productsSummary.lowStock} produtos\n`;
          
          if (productsSummary.productsLowStock.length > 0) {
            productsMessage += `\n🔴 *Produtos para repor:*\n`;
            productsSummary.productsLowStock.slice(0, 3).forEach(p => {
              productsMessage += `• ${p.name}: ${p.quantity} unid.\n`;
            });
          }
        }
        
        await bot.editMessageText(productsMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
                { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' }
              ],
              [{ text: '🔙 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        break;

      case 'logout_confirm':
        const logoutMessage = `🔐 *Confirmar Logout*\n\nTem certeza que deseja sair da sua conta?\n\n⚠️ *Você precisará fazer login novamente para acessar seus dados.*`;
        
        await bot.editMessageText(logoutMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Sim, sair', callback_data: 'logout_confirm_yes' },
                { text: '❌ Cancelar', callback_data: 'back_main' }
              ]
            ]
          }
        });
        break;

      case 'logout_confirm_yes':
        // Resetar para usuário não autenticado
        userMapping.set(callbackQuery.from.id, {
          firebaseUserId: `telegram_${callbackQuery.from.id}`,
          firstName: callbackQuery.from.first_name,
          isAuthenticated: false,
          registeredAt: new Date()
        });
        
        await bot.editMessageText(`✅ *Logout realizado!*\n\n👋 Você foi desconectado da sua conta.\n\n🔐 *Para conectar novamente:*\n\`/login seu@email.com suasenha\``, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Fazer Login', callback_data: 'help_login' }]
            ]
          }
        });
        break;

      case 'back_start':
        // Voltar para a mensagem inicial
        const startMessage = `🎉 *Olá, ${callbackQuery.from.first_name}!*

🤖 *Caderninho Digital - Assistente IA*
💼 *Chatbot PÚBLICO para empresários*

🔐 *FAÇA LOGIN COM SUA CONTA:*

📧 *Login com email e senha:*
\`/login seu@email.com suasenha\`

🆔 *Login direto com ID:*
\`/login seu_user_id\`

❓ *Não tem conta empresarial?*
🌐 *Cadastre-se GRÁTIS:* https://web-gestao-37a85.web.app

👥 *Este bot é público - compartilhe com outros empresários!*`;

        await bot.editMessageText(startMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔐 Como fazer login?', callback_data: 'help_login' },
                { text: '📋 Ver contas disponíveis', callback_data: 'list_users' }
              ],
              [
                { text: '❓ Ajuda completa', callback_data: 'ajuda_completa' },
                { text: '🌐 Acessar sistema', callback_data: 'open_system' }
              ]
            ]
          }
        });
        break;

      case 'back_main':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        const mainMessage = `👋 *Menu Principal*

✅ *Conectado como:* ${userData.firstName}
🆔 *ID:* \`${userData.firebaseUserId}\`

💬 *Escolha uma opção ou converse naturalmente:*`;

        await bot.editMessageText(mainMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Ver Vendas', callback_data: 'vendas_detalhadas' },
                { text: '👥 Ver Clientes', callback_data: 'clientes_detalhados' }
              ],
              [
                { text: '📦 Ver Estoque', callback_data: 'estoque_detalhado' },
                { text: '🛒 Nova Venda', callback_data: 'nova_venda' }
              ],
              [
                { text: '👤 Novo Cliente', callback_data: 'novo_cliente' },
                { text: '📦 Novo Produto', callback_data: 'novo_produto' }
              ],
              [
                { text: '🔄 Trocar Conta', callback_data: 'logout_confirm' }
              ]
            ]
          }
        });
        break;

      case 'ajuda_completa':
        const helpMessage = `❓ *Central de Ajuda*

🔐 *Como conectar:*
\`/login seu@email.com senha\`
\`/login userID\` (direto)

📊 *Comandos:*
/start - Menu inicial
/ajuda - Esta ajuda  
/status - Status da conexão
/usuarios - Ver contas (admin)
/forcelogin - Login rápido

💬 *Perguntas que entendo:*
• "Quanto vendi hoje?"
• "Quantos clientes tenho?"
• "Produtos acabando?"
• "Quem está devendo?"

🤖 *IA Conversacional:*
Converse naturalmente! Entendo perguntas sobre seu negócio.`;

        await bot.editMessageText(helpMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Voltar ao início', callback_data: 'back_start' }]
            ]
          }
        });
        break;

      case 'open_system':
        await bot.editMessageText(`🌐 *Acessar Sistema Web*\n\n🔗 *Link:* https://web-gestao-37a85.web.app\n\n📱 *Funcionalidades:*\n• Cadastro de produtos\n• Registro de vendas\n• Gestão de clientes\n• Relatórios completos\n\n💡 *Após cadastrar dados, volte aqui para consultar via bot!*`, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Voltar ao início', callback_data: 'back_start' }]
            ]
          }
        });
        break;

      case 'nova_venda':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        const vendaMessage = `🛒 *Registrar Nova Venda*\n\n💬 *Digite naturalmente:*\n• "Venda de R$ 50 para João"\n• "Registrar venda 25 reais cliente Maria"\n• "Vendi 30 para Pedro produto Camiseta"\n\n📝 *Ou use o comando:*\n\`/venda 50.00 João Silva Camiseta\`\n\n💡 *Dica:* Apenas digite sua mensagem que eu entendo!`;
        
        await bot.editMessageText(vendaMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        break;

      case 'novo_cliente':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        const clienteMessage = `👥 *Cadastrar Novo Cliente*\n\n💬 *Digite naturalmente:*\n• "Cadastrar cliente João Silva"\n• "Novo cliente Maria telefone 11999887766"\n• "Cliente Pedro email pedro@email.com"\n\n📝 *Ou use o comando:*\n\`/cliente João Silva 11999887766 joao@email.com\`\n\n💡 *Campos opcionais:* telefone e email`;
        
        await bot.editMessageText(clienteMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        break;

      case 'novo_produto':
        if (!userData?.isAuthenticated) {
          await bot.editMessageText('🔐 *Faça login primeiro!*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          break;
        }
        
        const produtoMessage = `📦 *Cadastrar Novo Produto*\n\n💬 *Digite naturalmente:*\n• "Cadastrar produto Camiseta R$ 25"\n• "Novo produto Calça preço 80 reais"\n• "Produto Tênis 150 estoque 10"\n\n📝 *Ou use o comando:*\n\`/produto Camiseta 25.00 50\`\n\n💡 *Campos opcionais:* quantidade em estoque`;
        
        await bot.editMessageText(produtoMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        break;

      default:
        await bot.editMessageText('❓ Opção não reconhecida. Use /start para voltar ao menu.', {
          chat_id: chatId,
          message_id: messageId
        });
    }
  } catch (error) {
    console.error('❌ Erro no callback:', error);
    await bot.sendMessage(chatId, '❌ Erro ao processar ação. Tente novamente com /start');
  }
});

// Tratamento de erros do bot
bot.on('polling_error', (error) => {
  console.error('❌ Erro de polling:', error.code);
});

// Servidor Express para health check e webhook
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Caderninho Digital Chatbot IA',
    timestamp: new Date().toISOString(),
    firebase: !!db,
    groq: !!GROQ_API_KEY,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Webhook endpoint para produção
app.post('/webhook', (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.sendStatus(500);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

console.log('✅ Caderninho Digital Chatbot IA inicializado!');
console.log('📱 Bot pronto para receber mensagens no Telegram');
console.log('🔗 Sistema: https://caderninhodigital.netlify.app');
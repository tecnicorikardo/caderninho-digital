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
// Em produção, isso deveria ser um banco de dados
const userMapping = new Map();

// Função para registrar/obter userId
function getUserId(telegramUserId, firstName) {
  if (!userMapping.has(telegramUserId)) {
    // Por enquanto, vamos usar um ID baseado no Telegram
    // Em produção, você implementaria um processo de login
    const userId = `telegram_${telegramUserId}`;
    userMapping.set(telegramUserId, {
      firebaseUserId: userId,
      firstName: firstName,
      registeredAt: new Date()
    });
    console.log(`👤 Novo usuário registrado: ${firstName} (${userId})`);
  }
  return userMapping.get(telegramUserId).firebaseUserId;
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
    
    // Buscar todas as vendas do usuário
    const salesRef = db.collection('sales').where('userId', '==', userId);
    const snapshot = await salesRef.get();
    
    if (snapshot.empty) {
      console.log('📭 Nenhuma venda encontrada');
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

// Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = getUserId(msg.from.id, msg.from.first_name);
  
  const welcomeMessage = `🎉 Olá, ${msg.from.first_name}! 

Bem-vindo ao *Caderninho Digital Chatbot IA*!

🤖 Sou seu assistente inteligente para gestão do seu negócio.

💬 *Experimente perguntar:*
• "Quanto vendi hoje?"
• "Quais produtos estão acabando?"
• "Quem são meus clientes devedores?"
• "Como está meu estoque?"

📋 Use /ajuda para ver todos os comandos disponíveis.

🔗 *Sistema Web:* https://caderninhodigital.netlify.app`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Comando /ajuda
bot.onText(/\/ajuda/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `❓ *Central de Ajuda*

🤖 *Comandos disponíveis:*
/start - Inicia a conversa
/ajuda - Esta mensagem de ajuda
/status - Status da conexão com dados

💬 *Perguntas que posso responder:*
• "Qual o faturamento de hoje?"
• "Quantos clientes tenho?"
• "Produtos com estoque baixo?"
• "Quem está devendo?"
• "Resumo do mês"
• "Melhores clientes"

🧠 *Powered by Groq AI* - Converse naturalmente comigo!

🌐 *Sistema:* https://caderninhodigital.netlify.app`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const firebaseStatus = db ? '🟢 Conectado' : '🔴 Desconectado (dados simulados)';
  const groqStatus = GROQ_API_KEY ? '🟢 Conectado' : '🔴 Não configurado';
  
  const statusMessage = `📊 *Status do Sistema*

🔥 *Firebase:* ${firebaseStatus}
🧠 *Groq AI:* ${groqStatus}
🤖 *Bot:* 🟢 Online

👤 *Seu ID:* \`${getUserId(msg.from.id, msg.from.first_name)}\`

${!db ? '\n⚠️ *Aviso:* Firebase desconectado. Usando dados simulados.' : ''}`;

  bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
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
      model: "llama3-8b-8192",
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
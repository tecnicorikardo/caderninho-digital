// Bot do Telegram - Caderninho Digital
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN || '7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw';

console.log('🤖 Caderninho Digital Bot iniciando...');
console.log('🔑 Token configurado:', token ? 'SIM' : 'NÃO');

const bot = new TelegramBot(token, { polling: true });
const users = new Map();
const conversations = new Map(); // Para armazenar conversas ativas

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📱 /start recebido de:', chatId);
  
  const message = `🤖 *Caderninho Digital Bot*

Gerencie seu negócio pelo Telegram!

🔐 *Para começar:*
/login seu@email.com senha123

📋 *Comandos disponíveis:*
• /status - Ver se está logado
• /saldo - Resumo financeiro

🛒 *Vendas:*
• /venda - Registrar nova venda (interativo)

👥 *Clientes:*
• /cliente - Cadastrar cliente (interativo)

💰 *Financeiro:*
• /receita - Adicionar receita (interativo)
• /despesa - Adicionar despesa (interativo)

*Seu Chat ID: ${chatId}*
*Status: Online ✅*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => console.log('✅ Resposta enviada para:', chatId))
    .catch(err => console.error('❌ Erro ao enviar:', err));
});

// Comando /login
bot.onText(/\/login (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];
  const password = match[2];
  
  console.log('🔐 Tentativa de login:', email, 'de', chatId);
  
  if (email.includes('@') && password.length >= 6) {
    users.set(chatId, { 
      email, 
      loginTime: new Date(),
      userId: 'user_' + Date.now()
    });
    
    console.log('✅ Login aprovado para:', email);
    bot.sendMessage(chatId, `✅ *Login realizado com sucesso!*\n\n👤 Email: ${email}\n🕐 Horário: ${new Date().toLocaleString('pt-BR')}\n\n🎉 Agora você pode usar todos os comandos!`, { parse_mode: 'Markdown' });
  } else {
    console.log('❌ Login negado para:', email);
    bot.sendMessage(chatId, '❌ *Credenciais inválidas*\n\n📝 Formato correto:\n/login email@exemplo.com senha123\n\n• Email deve conter @\n• Senha deve ter 6+ caracteres');
  }
});

// Comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📊 Status solicitado por:', chatId);
  
  if (users.has(chatId)) {
    const user = users.get(chatId);
    bot.sendMessage(chatId, `✅ *Você está logado!*\n\n👤 Email: ${user.email}\n🕐 Login: ${user.loginTime.toLocaleString('pt-BR')}\n🆔 User ID: ${user.userId}`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ *Você não está logado*\n\n🔐 Use: /login email@exemplo.com senha123');
  }
});

// Comando /saldo
bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  console.log('💰 Saldo solicitado por:', chatId);
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  const message = `💰 *Resumo Financeiro*

🏪 *Financeiro Comercial:*
📈 Receitas: R$ 0,00
📉 Despesas: R$ 0,00
💰 Lucro: R$ 0,00

👤 *Financeiro Pessoal:*
📈 Receitas: R$ 0,00
📉 Despesas: R$ 0,00
💰 Saldo: R$ 0,00

🎯 *Total Geral: R$ 0,00*

_Integrado com Caderninho Digital_`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /venda - Interativo
bot.onText(/\/venda/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🛒 Venda iniciada por:', chatId);
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  // Iniciar conversa de venda
  conversations.set(chatId, {
    type: 'venda',
    step: 'cliente',
    data: {}
  });
  
  bot.sendMessage(chatId, '🛒 *Nova Venda*\n\n👤 Qual o nome do cliente?\n\n_Digite o nome ou "cancelar" para sair_', { parse_mode: 'Markdown' });
});

// Comando /cliente - Interativo
bot.onText(/\/cliente/, (msg) => {
  const chatId = msg.chat.id;
  console.log('👤 Cliente iniciado por:', chatId);
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  // Iniciar conversa de cliente
  conversations.set(chatId, {
    type: 'cliente',
    step: 'nome',
    data: {}
  });
  
  bot.sendMessage(chatId, '👤 *Novo Cliente*\n\n📝 Qual o nome do cliente?\n\n_Digite o nome ou "cancelar" para sair_', { parse_mode: 'Markdown' });
});

// Comando /receita - Interativo
bot.onText(/\/receita/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📈 Receita iniciada por:', chatId);
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  // Iniciar conversa de receita
  conversations.set(chatId, {
    type: 'receita',
    step: 'categoria',
    data: {}
  });
  
  const categorias = ['Freelance', 'Salário', 'Investimentos', 'Vendas', 'Outros'];
  const message = `📈 *Nova Receita*\n\n📂 Escolha uma categoria:\n\n${categorias.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}\n\n_Digite o número ou "cancelar" para sair_`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /despesa - Interativo
bot.onText(/\/despesa/, (msg) => {
  const chatId = msg.chat.id;
  console.log('📉 Despesa iniciada por:', chatId);
  
  if (!users.has(chatId)) {
    bot.sendMessage(chatId, '🔐 *Faça login primeiro*\n\nUse: /login email@exemplo.com senha123');
    return;
  }
  
  // Iniciar conversa de despesa
  conversations.set(chatId, {
    type: 'despesa',
    step: 'categoria',
    data: {}
  });
  
  const categorias = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'];
  const message = `📉 *Nova Despesa*\n\n📂 Escolha uma categoria:\n\n${categorias.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}\n\n_Digite o número ou "cancelar" para sair_`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Processar conversas ativas
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Ignorar comandos
  if (text && text.startsWith('/')) return;
  
  // Verificar se há conversa ativa
  if (conversations.has(chatId)) {
    const conversation = conversations.get(chatId);
    console.log('💬 Processando conversa:', conversation.type, 'step:', conversation.step);
    
    // Cancelar conversa
    if (text && text.toLowerCase() === 'cancelar') {
      conversations.delete(chatId);
      bot.sendMessage(chatId, '❌ *Operação cancelada*\n\nUse /start para ver os comandos disponíveis.', { parse_mode: 'Markdown' });
      return;
    }
    
    // Processar cada tipo de conversa
    if (conversation.type === 'venda') {
      processVendaConversation(chatId, text, conversation);
    } else if (conversation.type === 'cliente') {
      processClienteConversation(chatId, text, conversation);
    } else if (conversation.type === 'receita') {
      processReceitaConversation(chatId, text, conversation);
    } else if (conversation.type === 'despesa') {
      processDespesaConversation(chatId, text, conversation);
    }
  } else if (text && !text.startsWith('/')) {
    console.log('💬 Mensagem sem conversa:', text, 'de', chatId);
    bot.sendMessage(chatId, '🤖 Use /start para ver os comandos disponíveis!');
  }
});

// Processar conversa de venda
function processVendaConversation(chatId, text, conversation) {
  switch (conversation.step) {
    case 'cliente':
      conversation.data.cliente = text;
      conversation.step = 'produto';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Cliente: *${text}*\n\n🛍️ Qual o produto/serviço vendido?\n\n_Digite o produto ou "cancelar"_`, { parse_mode: 'Markdown' });
      break;
      
    case 'produto':
      conversation.data.produto = text;
      conversation.step = 'valor';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Produto: *${text}*\n\n💰 Qual o valor da venda?\n\n_Digite apenas o número (ex: 150.50)_`, { parse_mode: 'Markdown' });
      break;
      
    case 'valor':
      const valor = parseFloat(text.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        bot.sendMessage(chatId, '❌ Valor inválido!\n\n💰 Digite um valor válido (ex: 150.50)');
        return;
      }
      
      conversation.data.valor = valor;
      conversation.step = 'pagamento';
      conversations.set(chatId, conversation);
      
      const opcoesPagamento = ['1. 💵 Dinheiro', '2. 📱 PIX', '3. 💳 Cartão', '4. 🏦 Transferência'];
      bot.sendMessage(chatId, `✅ Valor: *R$ ${valor.toFixed(2).replace('.', ',')}*\n\n💳 Como foi o pagamento?\n\n${opcoesPagamento.join('\n')}\n\n_Digite o número da opção_`, { parse_mode: 'Markdown' });
      break;
      
    case 'pagamento':
      const pagamentos = ['dinheiro', 'pix', 'cartao', 'transferencia'];
      const opcao = parseInt(text) - 1;
      
      if (opcao < 0 || opcao >= pagamentos.length) {
        bot.sendMessage(chatId, '❌ Opção inválida!\n\n💳 Digite um número de 1 a 4');
        return;
      }
      
      conversation.data.pagamento = pagamentos[opcao];
      
      // Finalizar venda
      const { cliente, produto, valor, pagamento } = conversation.data;
      const pagamentoTexto = ['💵 Dinheiro', '📱 PIX', '💳 Cartão', '🏦 Transferência'][opcao];
      
      const resumo = `🎉 *Venda Registrada com Sucesso!*\n\n👤 *Cliente:* ${cliente}\n🛍️ *Produto:* ${produto}\n💰 *Valor:* R$ ${valor.toFixed(2).replace('.', ',')}\n💳 *Pagamento:* ${pagamentoTexto}\n📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n✅ Venda salva no sistema!`;
      
      bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
      conversations.delete(chatId);
      console.log('✅ Venda registrada:', conversation.data);
      break;
  }
}

// Processar conversa de cliente
function processClienteConversation(chatId, text, conversation) {
  switch (conversation.step) {
    case 'nome':
      conversation.data.nome = text;
      conversation.step = 'telefone';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Nome: *${text}*\n\n📱 Qual o telefone do cliente?\n\n_Digite o telefone (ex: 11999999999)_`, { parse_mode: 'Markdown' });
      break;
      
    case 'telefone':
      const telefone = text.replace(/\D/g, ''); // Remove caracteres não numéricos
      if (telefone.length < 10) {
        bot.sendMessage(chatId, '❌ Telefone inválido!\n\n📱 Digite um telefone válido (ex: 11999999999)');
        return;
      }
      
      conversation.data.telefone = telefone;
      conversation.step = 'email';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Telefone: *${telefone}*\n\n📧 Qual o email do cliente?\n\n_Digite o email ou "pular" se não tiver_`, { parse_mode: 'Markdown' });
      break;
      
    case 'email':
      let email = '';
      if (text.toLowerCase() !== 'pular') {
        if (!text.includes('@')) {
          bot.sendMessage(chatId, '❌ Email inválido!\n\n📧 Digite um email válido ou "pular"');
          return;
        }
        email = text;
      }
      
      // Finalizar cliente
      const { nome, telefone } = conversation.data;
      
      const resumo = `🎉 *Cliente Cadastrado com Sucesso!*\n\n👤 *Nome:* ${nome}\n📱 *Telefone:* ${telefone}\n📧 *Email:* ${email || 'Não informado'}\n📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n✅ Cliente salvo no sistema!`;
      
      bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
      conversations.delete(chatId);
      console.log('✅ Cliente cadastrado:', { nome, telefone, email });
      break;
  }
}

// Processar conversa de receita
function processReceitaConversation(chatId, text, conversation) {
  const categorias = ['Freelance', 'Salário', 'Investimentos', 'Vendas', 'Outros'];
  
  switch (conversation.step) {
    case 'categoria':
      const opcao = parseInt(text) - 1;
      if (opcao < 0 || opcao >= categorias.length) {
        bot.sendMessage(chatId, '❌ Opção inválida!\n\n📂 Digite um número de 1 a 5');
        return;
      }
      
      conversation.data.categoria = categorias[opcao];
      conversation.step = 'valor';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Categoria: *${categorias[opcao]}*\n\n💰 Qual o valor da receita?\n\n_Digite apenas o número (ex: 500.00)_`, { parse_mode: 'Markdown' });
      break;
      
    case 'valor':
      const valor = parseFloat(text.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        bot.sendMessage(chatId, '❌ Valor inválido!\n\n💰 Digite um valor válido (ex: 500.00)');
        return;
      }
      
      conversation.data.valor = valor;
      conversation.step = 'descricao';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Valor: *R$ ${valor.toFixed(2).replace('.', ',')}*\n\n📝 Digite uma descrição para esta receita:\n\n_Ex: "Pagamento projeto website"_`, { parse_mode: 'Markdown' });
      break;
      
    case 'descricao':
      // Finalizar receita
      const { categoria, valor } = conversation.data;
      const descricao = text;
      
      const resumo = `🎉 *Receita Registrada com Sucesso!*\n\n📂 *Categoria:* ${categoria}\n💰 *Valor:* R$ ${valor.toFixed(2).replace('.', ',')}\n📝 *Descrição:* ${descricao}\n📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n✅ Receita salva no sistema!`;
      
      bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
      conversations.delete(chatId);
      console.log('✅ Receita registrada:', { categoria, valor, descricao });
      break;
  }
}

// Processar conversa de despesa
function processDespesaConversation(chatId, text, conversation) {
  const categorias = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'];
  
  switch (conversation.step) {
    case 'categoria':
      const opcao = parseInt(text) - 1;
      if (opcao < 0 || opcao >= categorias.length) {
        bot.sendMessage(chatId, '❌ Opção inválida!\n\n📂 Digite um número de 1 a 6');
        return;
      }
      
      conversation.data.categoria = categorias[opcao];
      conversation.step = 'valor';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Categoria: *${categorias[opcao]}*\n\n💰 Qual o valor da despesa?\n\n_Digite apenas o número (ex: 50.00)_`, { parse_mode: 'Markdown' });
      break;
      
    case 'valor':
      const valor = parseFloat(text.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        bot.sendMessage(chatId, '❌ Valor inválido!\n\n💰 Digite um valor válido (ex: 50.00)');
        return;
      }
      
      conversation.data.valor = valor;
      conversation.step = 'descricao';
      conversations.set(chatId, conversation);
      bot.sendMessage(chatId, `✅ Valor: *R$ ${valor.toFixed(2).replace('.', ',')}*\n\n📝 Digite uma descrição para esta despesa:\n\n_Ex: "Almoço restaurante"_`, { parse_mode: 'Markdown' });
      break;
      
    case 'descricao':
      // Finalizar despesa
      const { categoria, valor } = conversation.data;
      const descricao = text;
      
      const resumo = `🎉 *Despesa Registrada com Sucesso!*\n\n📂 *Categoria:* ${categoria}\n💰 *Valor:* R$ ${valor.toFixed(2).replace('.', ',')}\n📝 *Descrição:* ${descricao}\n📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n✅ Despesa salva no sistema!`;
      
      bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
      conversations.delete(chatId);
      console.log('✅ Despesa registrada:', { categoria, valor, descricao });
      break;
  }
}

// Tratamento de erros
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

console.log('🚀 Bot configurado e aguardando mensagens...');
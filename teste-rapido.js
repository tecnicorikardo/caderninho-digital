// TESTE RÁPIDO - Cole este código no console do navegador (F12)

// 1. Primeiro, verifique se você está logado
console.log('👤 Usuário atual:', auth?.currentUser?.uid);

// 2. Se estiver logado, execute este teste
async function testeRapidoFinancas() {
  const userId = auth?.currentUser?.uid;
  
  if (!userId) {
    console.log('❌ Usuário não logado!');
    return;
  }
  
  console.log('🔍 Testando finanças pessoais para:', userId);
  
  try {
    // Importar Firebase
    const { collection, getDocs, query, where, addDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Testar conexão
    console.log('1️⃣ Testando conexão...');
    const testQuery = query(collection(db, 'personal_transactions'));
    const testSnapshot = await getDocs(testQuery);
    console.log('✅ Total de documentos na coleção:', testSnapshot.size);
    
    // Buscar transações do usuário
    console.log('2️⃣ Buscando suas transações...');
    const userQuery = query(
      collection(db, 'personal_transactions'),
      where('userId', '==', userId)
    );
    
    const userSnapshot = await getDocs(userQuery);
    console.log('📊 Suas transações:', userSnapshot.size);
    
    if (userSnapshot.size === 0) {
      console.log('⚠️ Nenhuma transação encontrada!');
      console.log('🔄 Criando uma transação de teste...');
      
      // Criar transação de teste
      const testTransaction = {
        userId: userId,
        type: 'despesa',
        category: 'Teste',
        description: 'Teste de transação - ' + new Date().toLocaleString(),
        amount: 10.50,
        date: Timestamp.now(),
        paymentMethod: 'dinheiro',
        isRecurring: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'personal_transactions'), testTransaction);
      console.log('✅ Transação de teste criada:', docRef.id);
      
      // Verificar novamente
      const newSnapshot = await getDocs(userQuery);
      console.log('📊 Transações após criação:', newSnapshot.size);
    } else {
      console.log('📋 Listando suas transações:');
      userSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.type} - ${data.category} - R$ ${data.amount} - ${data.description}`);
      });
    }
    
    // Testar relatório mensal
    console.log('3️⃣ Testando relatório mensal...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Buscar todas as transações do usuário
    const allTransactions = [];
    userSnapshot.forEach((doc) => {
      const data = doc.data();
      allTransactions.push({
        ...data,
        date: data.date?.toDate() || new Date(data.date)
      });
    });
    
    // Filtrar por mês atual
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    const thisMonth = allTransactions.filter(t => {
      const transDate = t.date;
      return transDate >= startDate && transDate <= endDate;
    });
    
    console.log(`📅 Período: ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`);
    console.log(`📊 Transações no mês atual: ${thisMonth.length}`);
    
    const receitas = thisMonth.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesas = thisMonth.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`💵 Receitas: R$ ${receitas.toFixed(2)}`);
    console.log(`💸 Despesas: R$ ${despesas.toFixed(2)}`);
    console.log(`💰 Saldo: R$ ${(receitas - despesas).toFixed(2)}`);
    
    if (thisMonth.length === 0) {
      console.log('⚠️ PROBLEMA: Nenhuma transação no mês atual!');
      if (allTransactions.length > 0) {
        console.log('💡 Suas transações estão em outros meses:');
        allTransactions.forEach(t => {
          console.log(`   - ${t.description}: ${t.date.toLocaleDateString()}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Execute a função
testeRapidoFinancas();
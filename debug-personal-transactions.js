// Script de debug para testar transações pessoais
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  // Coloque aqui sua configuração do Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugPersonalTransactions(userId) {
  console.log('🔍 Debugando transações pessoais para userId:', userId);
  
  try {
    // 1. Testar consulta básica
    console.log('\n1️⃣ Testando consulta básica...');
    const basicQuery = query(
      collection(db, 'personal_transactions'),
      where('userId', '==', userId)
    );
    
    const basicSnapshot = await getDocs(basicQuery);
    console.log('📊 Documentos encontrados:', basicSnapshot.size);
    
    basicSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Documento:', doc.id);
      console.log('   - Tipo:', data.type);
      console.log('   - Categoria:', data.category);
      console.log('   - Descrição:', data.description);
      console.log('   - Valor:', data.amount);
      console.log('   - Data:', data.date?.toDate?.() || data.date);
      console.log('   - UserId:', data.userId);
      console.log('   ---');
    });
    
    // 2. Testar consulta de categorias
    console.log('\n2️⃣ Testando categorias...');
    const categoriesQuery = query(
      collection(db, 'personal_categories'),
      where('userId', '==', userId)
    );
    
    const categoriesSnapshot = await getDocs(categoriesQuery);
    console.log('📊 Categorias encontradas:', categoriesSnapshot.size);
    
    categoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📂 Categoria:', data.name, '(', data.type, ')');
    });
    
    // 3. Testar relatório mensal
    console.log('\n3️⃣ Testando relatório mensal...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    console.log('📅 Período:', startDate.toLocaleDateString(), 'até', endDate.toLocaleDateString());
    
    // Filtrar transações por data no cliente (já que não temos orderBy)
    const allTransactions = [];
    basicSnapshot.forEach((doc) => {
      const data = doc.data();
      const transDate = data.date?.toDate?.() || new Date(data.date);
      
      if (transDate >= startDate && transDate <= endDate) {
        allTransactions.push({
          id: doc.id,
          ...data,
          date: transDate
        });
      }
    });
    
    console.log('📊 Transações no período:', allTransactions.length);
    
    const totalReceitas = allTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    const totalDespesas = allTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    console.log('💵 Total Receitas:', totalReceitas);
    console.log('💸 Total Despesas:', totalDespesas);
    console.log('💰 Saldo:', totalReceitas - totalDespesas);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Para usar este script, chame:
// debugPersonalTransactions('SEU_USER_ID_AQUI');

export { debugPersonalTransactions };
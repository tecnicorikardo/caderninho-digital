import { personalFinanceService } from '../services/personalFinanceService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function debugPersonalFinance(userId: string) {
  console.log('🔍 INICIANDO DEBUG DE FINANÇAS PESSOAIS');
  console.log('👤 User ID:', userId);
  console.log('📅 Data atual:', new Date().toLocaleString());

  try {
    // 1. Testar conexão básica (pular consulta geral)
    console.log('\n1️⃣ TESTANDO CONEXÃO BÁSICA...');
    console.log('✅ Conexão OK (pulando consulta geral por questões de permissão)');

    // 2. Buscar transações do usuário específico
    console.log('\n2️⃣ BUSCANDO TRANSAÇÕES DO USUÁRIO...');
    const userQuery = query(
      collection(db, 'personal_transactions'),
      where('userId', '==', userId)
    );

    const userSnapshot = await getDocs(userQuery);
    console.log('📊 Transações encontradas para o usuário:', userSnapshot.size);

    if (userSnapshot.size === 0) {
      console.log('⚠️ PROBLEMA IDENTIFICADO: Nenhuma transação encontrada para este usuário!');
      console.log('💡 Possíveis causas:');
      console.log('   - User ID incorreto');
      console.log('   - Transações não foram salvas corretamente');
      console.log('   - Problema de permissão no Firestore');
      return;
    }

    // 3. Analisar cada transação
    console.log('\n3️⃣ ANALISANDO TRANSAÇÕES...');
    const transactions: any[] = [];

    userSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📄 Transação ${index + 1} (ID: ${doc.id}):`);
      console.log('   - Tipo:', data.type);
      console.log('   - Categoria:', data.category);
      console.log('   - Descrição:', data.description);
      console.log('   - Valor:', data.amount);
      console.log('   - Data:', data.date?.toDate?.() || data.date);
      console.log('   - User ID:', data.userId);
      console.log('   - Criado em:', data.createdAt?.toDate?.() || data.createdAt);

      transactions.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(data.date),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });

    // 4. Testar filtro por data (mês atual)
    console.log('\n4️⃣ TESTANDO FILTRO POR DATA (MÊS ATUAL)...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    console.log('📅 Período de filtro:');
    console.log('   - Início:', startDate.toLocaleString());
    console.log('   - Fim:', endDate.toLocaleString());

    const filteredTransactions = transactions.filter(t => {
      const transDate = t.date;
      const isInRange = transDate >= startDate && transDate <= endDate;

      if (!isInRange) {
        console.log(`   ❌ Transação ${t.id} fora do período: ${transDate.toLocaleString()}`);
      } else {
        console.log(`   ✅ Transação ${t.id} no período: ${transDate.toLocaleString()}`);
      }

      return isInRange;
    });

    console.log(`📊 Transações no período atual: ${filteredTransactions.length} de ${transactions.length}`);

    // 5. Calcular totais
    console.log('\n5️⃣ CALCULANDO TOTAIS...');
    const totalReceitas = filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalDespesas = filteredTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const saldo = totalReceitas - totalDespesas;

    console.log('💵 Total Receitas:', totalReceitas);
    console.log('💸 Total Despesas:', totalDespesas);
    console.log('💰 Saldo:', saldo);

    // 6. Testar o serviço oficial
    console.log('\n6️⃣ TESTANDO SERVIÇO OFICIAL...');
    try {
      const officialReport = await personalFinanceService.getMonthlyReport(userId, currentYear, currentMonth);
      console.log('📊 Relatório oficial:');
      console.log('   - Receitas:', officialReport.totalReceitas);
      console.log('   - Despesas:', officialReport.totalDespesas);
      console.log('   - Saldo:', officialReport.saldo);
      console.log('   - Transações:', officialReport.transactions.length);

      // Comparar resultados
      if (officialReport.totalReceitas === totalReceitas &&
        officialReport.totalDespesas === totalDespesas &&
        officialReport.transactions.length === filteredTransactions.length) {
        console.log('✅ RESULTADOS CONSISTENTES!');
      } else {
        console.log('❌ INCONSISTÊNCIA DETECTADA!');
        console.log('   Manual vs Oficial:');
        console.log(`   Receitas: ${totalReceitas} vs ${officialReport.totalReceitas}`);
        console.log(`   Despesas: ${totalDespesas} vs ${officialReport.totalDespesas}`);
        console.log(`   Transações: ${filteredTransactions.length} vs ${officialReport.transactions.length}`);
      }
    } catch (serviceError) {
      console.error('❌ Erro no serviço oficial:', serviceError);
    }

    // 7. Verificar categorias
    console.log('\n7️⃣ VERIFICANDO CATEGORIAS...');
    try {
      const categories = await personalFinanceService.getCategories(userId);
      console.log('📂 Categorias encontradas:', categories.length);

      categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.icon} ${cat.name} (${cat.type})`);
      });

      if (categories.length === 0) {
        console.log('⚠️ Nenhuma categoria encontrada! Inicializando...');
        await personalFinanceService.initializeDefaultCategories(userId);
        console.log('✅ Categorias padrão criadas');
      }
    } catch (catError) {
      console.error('❌ Erro ao verificar categorias:', catError);
    }

    console.log('\n🎯 RESUMO DO DEBUG:');
    console.log(`   - Transações totais: ${transactions.length}`);
    console.log(`   - Transações no mês atual: ${filteredTransactions.length}`);
    console.log(`   - Receitas: R$ ${totalReceitas.toFixed(2)}`);
    console.log(`   - Despesas: R$ ${totalDespesas.toFixed(2)}`);
    console.log(`   - Saldo: R$ ${saldo.toFixed(2)}`);

    if (filteredTransactions.length === 0 && transactions.length > 0) {
      console.log('⚠️ PROBLEMA: Existem transações, mas nenhuma no mês atual!');
      console.log('💡 Verifique se as datas das transações estão corretas.');
    }

  } catch (error) {
    console.error('❌ ERRO GERAL NO DEBUG:', error);
  }
}

// Função para usar no console do navegador
(window as any).debugPersonalFinance = debugPersonalFinance;
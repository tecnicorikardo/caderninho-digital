// Script para forçar a criação de uma nova assinatura
// Execute no console do navegador quando logado se a assinatura não aparecer

console.log('🔧 FORÇANDO CRIAÇÃO DE NOVA ASSINATURA...');

const user = firebase.auth().currentUser;
if (!user) {
  console.error('❌ Usuário não está logado');
} else {
  console.log('✅ Usuário logado:', user.email);
  
  // Criar nova assinatura de 2 meses
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);
  
  const newSubscription = {
    plan: 'free',
    status: 'trial',
    startDate: now,
    endDate: endDate,
    trialUsed: true,
    migrated: true,
    fixedAt: now
  };
  
  firebase.firestore().collection('subscriptions').doc(user.uid).set(newSubscription)
    .then(() => {
      console.log('✅ Nova assinatura criada com sucesso!');
      console.log('📅 Válida até:', endDate.toLocaleDateString('pt-BR'));
      console.log('🔄 Recarregue a página para ver as mudanças.');
      
      // Criar dados de uso inicial também
      const initialUsage = {
        salesCount: 0,
        clientsCount: 0,
        productsCount: 0,
        transactionsCount: 0,
        lastReset: now
      };
      
      return firebase.firestore().collection('usage').doc(user.uid).set(initialUsage);
    })
    .then(() => {
      console.log('✅ Dados de uso inicializados!');
      alert('✅ Assinatura corrigida! Recarregue a página.');
    })
    .catch(error => {
      console.error('❌ Erro ao criar assinatura:', error);
      alert('❌ Erro ao corrigir assinatura. Veja o console.');
    });
}
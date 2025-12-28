// Script para debugar problemas de assinatura
// Execute no console do navegador quando logado

console.log('🔍 DEBUGANDO ASSINATURA...');

// 1. Verificar se o usuário está logado
const user = firebase.auth().currentUser;
if (!user) {
  console.error('❌ Usuário não está logado');
} else {
  console.log('✅ Usuário logado:', user.email, 'UID:', user.uid);
}

// 2. Verificar dados da assinatura no Firestore
if (user) {
  firebase.firestore().collection('subscriptions').doc(user.uid).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        console.log('📊 Dados da assinatura no Firestore:', data);
        
        // Verificar se precisa de migração
        const endDate = data.endDate.toDate();
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('📅 Análise da assinatura:');
        console.log('  - Plano:', data.plan);
        console.log('  - Status:', data.status);
        console.log('  - Data de início:', data.startDate.toDate().toLocaleDateString('pt-BR'));
        console.log('  - Data de fim:', endDate.toLocaleDateString('pt-BR'));
        console.log('  - Dias restantes:', daysRemaining);
        console.log('  - Já migrado:', data.migrated || false);
        console.log('  - Precisa migração:', data.plan === 'free' && daysRemaining > 90 && !data.migrated);
        
        if (data.plan === 'free' && daysRemaining > 90 && !data.migrated) {
          console.log('🔄 Esta assinatura precisa ser migrada!');
          console.log('💡 Recarregue a página para aplicar a migração automática.');
        }
      } else {
        console.log('❌ Nenhuma assinatura encontrada no Firestore');
        console.log('💡 Uma nova assinatura será criada automaticamente.');
      }
    })
    .catch(error => {
      console.error('❌ Erro ao buscar assinatura:', error);
    });

  // 3. Verificar dados de uso
  firebase.firestore().collection('usage').doc(user.uid).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        console.log('📈 Dados de uso:', data);
      } else {
        console.log('📈 Nenhum dado de uso encontrado (será criado automaticamente)');
      }
    })
    .catch(error => {
      console.error('❌ Erro ao buscar dados de uso:', error);
    });
}

console.log('🎯 Debug concluído! Verifique os logs acima.');
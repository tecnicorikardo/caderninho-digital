require('dotenv').config();
const admin = require('firebase-admin');

const FIREBASE_PROJECT_ID = 'web-gestao-37a85';

async function testFirebase() {
  console.log('🧪 Testando conexão Firebase...\n');
  
  try {
    // Inicializar Firebase
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('🔑 Usando variável de ambiente FIREBASE_SERVICE_ACCOUNT');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
    } else {
      console.log('💻 Usando arquivo local serviceAccountKey.json');
      const serviceAccount = require('./serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
    }
    
    const db = admin.firestore();
    console.log('✅ Firebase inicializado com sucesso!\n');
    
    // Testar coleções
    const collections = ['sales', 'clients', 'products', 'users'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        console.log(`📋 ${collectionName}: ${snapshot.size} documentos`);
        
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0].data();
          console.log(`   └ Exemplo: ${JSON.stringify(firstDoc, null, 2).substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`❌ ${collectionName}: Erro - ${error.message}`);
      }
    }
    
    // Testar busca específica
    console.log('\n🔍 Testando busca específica...');
    const userId = 'ECYMxTpm46b2iNUNU0aNHIbdfTJ2';
    const salesSnapshot = await db.collection('sales').where('userId', '==', userId).get();
    console.log(`🎯 Vendas do usuário ${userId}: ${salesSnapshot.size} encontradas`);
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Firebase está funcionando corretamente');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('📋 Mensagem:', error.message);
    console.error('🔍 Código:', error.code);
    
    if (error.message.includes('serviceAccountKey.json')) {
      console.log('\n💡 SOLUÇÕES:');
      console.log('1. Verifique se o arquivo serviceAccountKey.json existe');
      console.log('2. Configure a variável FIREBASE_SERVICE_ACCOUNT');
      console.log('3. Verifique as permissões do Firebase');
    }
  }
  
  process.exit(0);
}

testFirebase();
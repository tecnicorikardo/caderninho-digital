// Teste rápido da API
const API_URL = 'https://us-central1-web-gestao-37a85.cloudfunctions.net/agentAPI';

async function testarAPI() {
  try {
    console.log('🧪 Testando API...');
    
    // Teste básico - buscar dashboard (sem userId real por enquanto)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user',
        action: 'get_dashboard'
      })
    });

    const result = await response.json();
    console.log('✅ Resposta da API:', result);
    
    if (result.success) {
      console.log('🎉 API funcionando perfeitamente!');
    } else {
      console.log('⚠️ API respondeu, mas com erro:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

// Executar teste
testarAPI();
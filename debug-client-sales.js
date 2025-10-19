// Script de debug para testar a busca de vendas por cliente
// Execute este script no console do navegador na página de clientes

async function debugClientSales(clientId, clientName) {
  console.log('🔍 Iniciando debug de vendas do cliente...');
  console.log('Cliente ID:', clientId);
  console.log('Cliente Nome:', clientName);
  
  // Buscar do Firebase
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('./src/config/firebase');
    
    // Assumindo que user.uid está disponível
    const userId = 'SEU_USER_ID_AQUI'; // Substitua pelo seu user ID real
    
    const salesQuery = query(collection(db, 'sales'), where('userId', '==', userId));
    const salesSnapshot = await getDocs(salesQuery);
    
    const allSales = salesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    
    console.log('📊 Total de vendas encontradas:', allSales.length);
    
    // Filtrar por cliente
    const clientSales = allSales.filter(sale => {
      const matchById = sale.clientId === clientId;
      const matchByName = sale.clientName && 
        sale.clientName.toLowerCase().trim() === clientName.toLowerCase().trim();
      
      console.log('Venda:', {
        id: sale.id,
        clientId: sale.clientId,
        clientName: sale.clientName,
        matchById,
        matchByName,
        match: matchById || matchByName
      });
      
      return matchById || matchByName;
    });
    
    console.log('✅ Vendas do cliente encontradas:', clientSales.length);
    console.log('📋 Detalhes das vendas:', clientSales);
    
    return clientSales;
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error);
  }
}

// Para usar: debugClientSales('CLIENT_ID_AQUI', 'Nome do Cliente')
console.log('🛠️ Função debugClientSales() carregada. Use: debugClientSales("clientId", "clientName")');
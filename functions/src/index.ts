import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Inicializar Firebase Admin
initializeApp();

const db = getFirestore();
const auth = getAuth();

// Interface para requisições do agente
interface AgentRequest {
  userId: string;
  action: 'get_sales' | 'create_sale' | 'get_clients' | 'get_dashboard';
  data?: any;
  token?: string; // Token de autenticação
}

// API principal para agentes
export const agentAPI = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const { userId, action, data, token }: AgentRequest = req.body;

    // Validar token de autenticação (opcional)
    if (token) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.uid !== userId) {
          res.status(403).json({ error: 'Token inválido' });
          return;
        }
      } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }
    }

    // Processar ações do agente
    switch (action) {
      case 'get_sales':
        const salesSnapshot = await db.collection('sales')
          .where('userId', '==', userId)
          .get();
        
        const sales = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        res.json({ success: true, data: sales });
        break;

      case 'create_sale':
        const saleData = {
          ...data,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const saleRef = await db.collection('sales').add(saleData);
        res.json({ success: true, saleId: saleRef.id });
        break;

      case 'get_clients':
        const clientsSnapshot = await db.collection('clients')
          .where('userId', '==', userId)
          .get();
        
        const clients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        res.json({ success: true, data: clients });
        break;

      case 'get_dashboard':
        // Buscar dados do dashboard
        const [salesSnap, clientsSnap] = await Promise.all([
          db.collection('sales').where('userId', '==', userId).get(),
          db.collection('clients').where('userId', '==', userId).get()
        ]);

        const dashboardData = {
          totalSales: salesSnap.size,
          totalClients: clientsSnap.size,
          totalRevenue: salesSnap.docs.reduce((sum, doc) => {
            const sale = doc.data();
            return sum + (sale.total || 0);
          }, 0)
        };

        res.json({ success: true, data: dashboardData });
        break;

      default:
        res.status(400).json({ error: 'Ação não reconhecida' });
    }

  } catch (error) {
    console.error('Erro na API do agente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook para receber dados de agentes externos
export const agentWebhook = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  try {
    const { event, userId, data } = req.body;

    switch (event) {
      case 'sale_created':
        // Processar venda criada por agente externo
        console.log(`Venda criada por agente para usuário ${userId}:`, data);
        break;

      case 'client_updated':
        // Processar cliente atualizado por agente
        console.log(`Cliente atualizado por agente para usuário ${userId}:`, data);
        break;
    }

    res.json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro no webhook' });
  }
});
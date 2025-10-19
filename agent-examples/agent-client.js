// Exemplo de como um agente pode se comunicar com sua API

const FIREBASE_FUNCTIONS_URL = 'https://us-central1-web-gestao-37a85.cloudfunctions.net';

class GestaoAgent {
  constructor(userId, authToken = null) {
    this.userId = userId;
    this.authToken = authToken;
    this.baseUrl = FIREBASE_FUNCTIONS_URL;
  }

  async makeRequest(action, data = null) {
    const response = await fetch(`${this.baseUrl}/agentAPI`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: this.userId,
        action: action,
        data: data,
        token: this.authToken
      })
    });

    return await response.json();
  }

  // Buscar todas as vendas
  async getSales() {
    return await this.makeRequest('get_sales');
  }

  // Criar nova venda
  async createSale(saleData) {
    return await this.makeRequest('create_sale', saleData);
  }

  // Buscar clientes
  async getClients() {
    return await this.makeRequest('get_clients');
  }

  // Buscar dados do dashboard
  async getDashboard() {
    return await this.makeRequest('get_dashboard');
  }
}

// Exemplo de uso
async function exemploUso() {
  const agent = new GestaoAgent('USER_ID_AQUI');

  try {
    // Buscar vendas
    const sales = await agent.getSales();
    console.log('Vendas:', sales);

    // Criar nova venda
    const novavenda = await agent.createSale({
      clientName: 'Cliente Teste',
      products: [
        { name: 'Produto 1', price: 10.50, quantity: 2 }
      ],
      total: 21.00,
      paymentMethod: 'dinheiro'
    });
    console.log('Venda criada:', novavenda);

    // Buscar dashboard
    const dashboard = await agent.getDashboard();
    console.log('Dashboard:', dashboard);

  } catch (error) {
    console.error('Erro:', error);
  }
}

// Executar exemplo
// exemploUso();

module.exports = GestaoAgent;
// Serviço de integração com API Asaas
interface AsaasCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

interface AsaasPayment {
  id?: string;
  customer: string; // ID do cliente no Asaas
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // ID da venda no nosso sistema
  installmentCount?: number;
  installmentValue?: number;
}

interface AsaasResponse<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

class AsaasService {
  private static instance: AsaasService;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    // API Key fornecida pelo usuário (ambiente de homologação)
    this.apiKey = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmNhYzk1MWE1LTM2OGQtNGE4Zi1iNDU0LTI3ZmY2NjYzMjRiZDo6JGFhY2hfYmY3N2U5ZGQtZTc5My00ZDAxLTlmYmEtZGEzZDM1ZWExZjAz';
    
    // URL base da API (homologação)
    this.baseUrl = 'https://sandbox.asaas.com/api/v3';
  }

  static getInstance(): AsaasService {
    if (!AsaasService.instance) {
      AsaasService.instance = new AsaasService();
    }
    return AsaasService.instance;
  }

  /**
   * Headers padrão para requisições
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      'User-Agent': 'Caderninho Digital v1.0'
    };
  }

  /**
   * Fazer requisição para API do Asaas
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    console.log(`🔗 Asaas API: ${options.method || 'GET'} ${endpoint}`);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Erro Asaas API (${response.status}):`, errorData);
        throw new Error(`Asaas API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('✅ Resposta Asaas API recebida');
      return data;
    } catch (error) {
      console.error('❌ Erro na requisição Asaas:', error);
      throw error;
    }
  }

  /**
   * Criar ou atualizar cliente no Asaas
   */
  async createOrUpdateCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      console.log('👤 Criando/atualizando cliente no Asaas:', customerData.name);

      // Se tem ID, atualizar; senão, criar
      if (customerData.id) {
        const updatedCustomer = await this.makeRequest<AsaasCustomer>(
          `/customers/${customerData.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(customerData),
          }
        );
        return updatedCustomer;
      } else {
        const newCustomer = await this.makeRequest<AsaasCustomer>(
          '/customers',
          {
            method: 'POST',
            body: JSON.stringify(customerData),
          }
        );
        return newCustomer;
      }
    } catch (error) {
      console.error('❌ Erro ao criar/atualizar cliente:', error);
      throw error;
    }
  }

  /**
   * Buscar cliente por email ou CPF
   */
  async findCustomer(email?: string, cpfCnpj?: string): Promise<AsaasCustomer | null> {
    try {
      let query = '';
      if (email) query += `email=${encodeURIComponent(email)}`;
      if (cpfCnpj) query += `${query ? '&' : ''}cpfCnpj=${encodeURIComponent(cpfCnpj)}`;

      if (!query) return null;

      const response = await this.makeRequest<AsaasResponse<AsaasCustomer>>(`/customers?${query}`);
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return null;
    }
  }

  /**
   * Criar cobrança no Asaas
   */
  async createPayment(paymentData: AsaasPayment): Promise<AsaasPayment> {
    try {
      console.log('💰 Criando cobrança no Asaas:', paymentData);

      const payment = await this.makeRequest<AsaasPayment>(
        '/payments',
        {
          method: 'POST',
          body: JSON.stringify(paymentData),
        }
      );

      console.log('✅ Cobrança criada no Asaas:', payment.id);
      return payment;
    } catch (error) {
      console.error('❌ Erro ao criar cobrança:', error);
      throw error;
    }
  }

  /**
   * Buscar cobrança por ID
   */
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    try {
      const payment = await this.makeRequest<AsaasPayment>(`/payments/${paymentId}`);
      return payment;
    } catch (error) {
      console.error('❌ Erro ao buscar cobrança:', error);
      throw error;
    }
  }

  /**
   * Listar cobranças
   */
  async listPayments(filters: {
    customer?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AsaasResponse<AsaasPayment>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.customer) queryParams.append('customer', filters.customer);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const query = queryParams.toString();
      const endpoint = `/payments${query ? `?${query}` : ''}`;

      const response = await this.makeRequest<AsaasResponse<AsaasPayment>>(endpoint);
      return response;
    } catch (error) {
      console.error('❌ Erro ao listar cobranças:', error);
      throw error;
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelPayment(paymentId: string): Promise<AsaasPayment> {
    try {
      console.log('❌ Cancelando cobrança no Asaas:', paymentId);

      const payment = await this.makeRequest<AsaasPayment>(
        `/payments/${paymentId}`,
        {
          method: 'DELETE',
        }
      );

      console.log('✅ Cobrança cancelada no Asaas');
      return payment;
    } catch (error) {
      console.error('❌ Erro ao cancelar cobrança:', error);
      throw error;
    }
  }

  /**
   * Gerar PIX para cobrança
   */
  async generatePixQrCode(paymentId: string): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  }> {
    try {
      console.log('📱 Gerando QR Code PIX para cobrança:', paymentId);

      const pixData = await this.makeRequest<{
        encodedImage: string;
        payload: string;
        expirationDate: string;
      }>(`/payments/${paymentId}/pixQrCode`);

      console.log('✅ QR Code PIX gerado com sucesso');
      return pixData;
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code PIX:', error);
      throw error;
    }
  }

  /**
   * Testar conexão com API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testando conexão com API Asaas...');
      
      // Fazer uma requisição simples para testar
      await this.makeRequest('/customers?limit=1');
      
      console.log('✅ Conexão com Asaas funcionando!');
      return true;
    } catch (error) {
      console.error('❌ Falha na conexão com Asaas:', error);
      return false;
    }
  }

  /**
   * Obter informações da conta
   */
  async getAccountInfo(): Promise<any> {
    try {
      const accountInfo = await this.makeRequest('/myAccount');
      return accountInfo;
    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const asaasService = AsaasService.getInstance();

// Funções de conveniência
export const createAsaasCustomer = (customerData: AsaasCustomer) => 
  asaasService.createOrUpdateCustomer(customerData);

export const createAsaasPayment = (paymentData: AsaasPayment) => 
  asaasService.createPayment(paymentData);

export const testAsaasConnection = () => 
  asaasService.testConnection();

export const generatePixQrCode = (paymentId: string) => 
  asaasService.generatePixQrCode(paymentId);

// Tipos exportados
export type { AsaasCustomer, AsaasPayment, AsaasResponse };
// import axios from 'axios'; // Comentado pois não está sendo usado no modo de desenvolvimento

interface PicPayPayment {
  referenceId: string;
  callbackUrl: string;
  returnUrl: string;
  value: number;
  buyer: {
    firstName: string;
    lastName: string;
    document: string;
    email: string;
    phone: string;
  };
}

interface PicPayResponse {
  referenceId: string;
  paymentUrl: string;
  qrcode: {
    content: string;
    base64: string;
  };
  expiresAt: string;
}

class PicPayService {
  // Propriedades privadas para uso futuro em produção
  // private baseURL: string;
  // private token: string;
  // private sellerToken: string;

  constructor() {
    // Por enquanto, usar valores de exemplo para desenvolvimento
    // Em produção, usar variáveis de ambiente
    // const isProduction = false; // Mudar para true em produção
    
    // this.baseURL = isProduction 
    //   ? 'https://appws.picpay.com/ecommerce/public'
    //   : 'https://sandbox.picpay.com/ecommerce/public';
    
    // Tokens de exemplo - substituir pelos reais
    // this.token = 'seu_token_picpay_aqui';
    // this.sellerToken = 'seu_seller_token_aqui';
  }

  async createPayment(paymentData: PicPayPayment): Promise<PicPayResponse> {
    try {
      console.log('🔄 Criando pagamento PicPay:', paymentData);
      
      // Simular resposta para desenvolvimento
      // Em produção, fazer a requisição real
      const mockResponse: PicPayResponse = {
        referenceId: paymentData.referenceId,
        paymentUrl: `https://app.picpay.com/checkout/${paymentData.referenceId}`,
        qrcode: {
          content: `https://app.picpay.com/checkout/${paymentData.referenceId}`,
          base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
      };

      // Código real para produção:
      /*
      const response = await axios.post(
        `${this.baseURL}/payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-picpay-token': this.token,
            'x-seller-token': this.sellerToken
          }
        }
      );
      return response.data;
      */

      return mockResponse;
    } catch (error: any) {
      console.error('❌ Erro PicPay:', error.response?.data || error.message);
      throw new Error('Erro ao processar pagamento PicPay');
    }
  }

  async checkPaymentStatus(referenceId: string): Promise<any> {
    try {
      console.log('🔍 Verificando status do pagamento:', referenceId);
      
      // Simular status para desenvolvimento
      // Em produção, fazer a requisição real
      const mockStatus = {
        referenceId,
        status: Math.random() > 0.8 ? 'paid' : 'created', // 20% chance de estar pago
        authorizationId: referenceId + '_auth',
        createdAt: new Date().toISOString()
      };

      // Código real para produção:
      /*
      const response = await axios.get(
        `${this.baseURL}/payments/${referenceId}/status`,
        {
          headers: {
            'x-picpay-token': this.token,
            'x-seller-token': this.sellerToken
          }
        }
      );
      return response.data;
      */

      return mockStatus;
    } catch (error: any) {
      console.error('❌ Erro ao verificar status:', error.response?.data || error.message);
      throw new Error('Erro ao verificar pagamento');
    }
  }

  async cancelPayment(referenceId: string): Promise<any> {
    try {
      console.log('❌ Cancelando pagamento:', referenceId);
      
      // Simular cancelamento para desenvolvimento
      const mockCancel = {
        referenceId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };

      // Código real para produção:
      /*
      const response = await axios.post(
        `${this.baseURL}/payments/${referenceId}/cancellations`,
        {},
        {
          headers: {
            'x-picpay-token': this.token,
            'x-seller-token': this.sellerToken
          }
        }
      );
      return response.data;
      */

      return mockCancel;
    } catch (error: any) {
      console.error('❌ Erro ao cancelar:', error.response?.data || error.message);
      throw new Error('Erro ao cancelar pagamento');
    }
  }

  // Método para configurar tokens em produção
  setCredentials(_token: string, _sellerToken: string) {
    // this.token = token;
    // this.sellerToken = sellerToken;
    console.log('Credentials set (development mode)');
  }

  // Método para alternar entre sandbox e produção
  setEnvironment(_isProduction: boolean) {
    // this.baseURL = isProduction 
    //   ? 'https://appws.picpay.com/ecommerce/public'
    //   : 'https://sandbox.picpay.com/ecommerce/public';
    console.log('Environment set (development mode)');
  }
}

export const picpayService = new PicPayService();
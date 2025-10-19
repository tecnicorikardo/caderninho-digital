# 💳 Integração PicPay - Guia Completo

## 🏆 **Por que PicPay?**

### **Vantagens do PicPay:**
- ✅ **Taxa baixa**: 2,99% (menor que Mercado Pago)
- ✅ **PIX instantâneo** integrado
- ✅ **QR Code** para pagamento
- ✅ **API simples** e bem documentada
- ✅ **Recebimento em 1 dia útil**
- ✅ **Sem taxa de setup**

### **Comparação de Taxas:**
| Gateway | Taxa | Recebimento | PIX |
|---------|------|-------------|-----|
| **PicPay** | 2,99% | D+1 | ✅ Grátis |
| Mercado Pago | 3,99% + R$0,40 | D+14 | ✅ 0,99% |
| Stripe | 3,99% + R$0,40 | D+7 | ❌ |
| PagSeguro | 4,99% | D+30 | ✅ 1,99% |

---

## 🚀 **Implementação Passo a Passo**

### **1. Criar Conta PicPay**

1. **Acesse**: https://picpay.com/site/para-empresas
2. **Cadastre sua empresa**
3. **Obtenha as credenciais**:
   - `x-picpay-token` (Token de autenticação)
   - `x-seller-token` (Token do vendedor)

### **2. Instalar Dependências**

```bash
npm install axios uuid
```

### **3. Configurar Variáveis de Ambiente**

```env
# .env.local
VITE_PICPAY_TOKEN=seu_token_aqui
VITE_PICPAY_SELLER_TOKEN=seu_seller_token
VITE_PICPAY_ENVIRONMENT=sandbox # ou production
```

---

## 💻 **Código de Implementação**

### **1. Serviço PicPay**

```typescript
// src/services/picpayService.ts
import axios from 'axios';

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
  private baseURL: string;
  private token: string;
  private sellerToken: string;

  constructor() {
    const isProduction = import.meta.env.VITE_PICPAY_ENVIRONMENT === 'production';
    this.baseURL = isProduction 
      ? 'https://appws.picpay.com/ecommerce/public'
      : 'https://sandbox.picpay.com/ecommerce/public';
    
    this.token = import.meta.env.VITE_PICPAY_TOKEN;
    this.sellerToken = import.meta.env.VITE_PICPAY_SELLER_TOKEN;
  }

  async createPayment(paymentData: PicPayPayment): Promise<PicPayResponse> {
    try {
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
    } catch (error: any) {
      console.error('Erro PicPay:', error.response?.data || error.message);
      throw new Error('Erro ao processar pagamento');
    }
  }

  async checkPaymentStatus(referenceId: string): Promise<any> {
    try {
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
    } catch (error: any) {
      console.error('Erro ao verificar status:', error.response?.data || error.message);
      throw new Error('Erro ao verificar pagamento');
    }
  }

  async cancelPayment(referenceId: string): Promise<any> {
    try {
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
    } catch (error: any) {
      console.error('Erro ao cancelar:', error.response?.data || error.message);
      throw new Error('Erro ao cancelar pagamento');
    }
  }
}

export const picpayService = new PicPayService();
```

### **2. Hook para Pagamentos**

```typescript
// src/hooks/usePayment.ts
import { useState } from 'react';
import { picpayService } from '../services/picpayService';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export function usePayment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const createSubscriptionPayment = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return null;
    }

    setLoading(true);

    try {
      const referenceId = `sub_${user.uid}_${uuidv4()}`;
      const value = plan === 'monthly' ? 20.00 : 200.00; // R$ 200 anual (2 meses grátis)

      const payment = await picpayService.createPayment({
        referenceId,
        callbackUrl: `${window.location.origin}/api/picpay/callback`,
        returnUrl: `${window.location.origin}/upgrade/success`,
        value,
        buyer: {
          firstName: user.displayName?.split(' ')[0] || 'Cliente',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || 'PicPay',
          document: '11111111111', // CPF - em produção, coletar do usuário
          email: user.email || '',
          phone: '+5511999999999' // Em produção, coletar do usuário
        }
      });

      setPaymentData(payment);
      return payment;

    } catch (error) {
      toast.error('Erro ao criar pagamento');
      console.error('Erro:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async (referenceId: string) => {
    try {
      const status = await picpayService.checkPaymentStatus(referenceId);
      return status;
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      return null;
    }
  };

  return {
    loading,
    paymentData,
    createSubscriptionPayment,
    checkPayment
  };
}
```

### **3. Componente de Pagamento**

```typescript
// src/components/PicPayCheckout.tsx
import { useState, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';
import { QRCodeSVG } from 'qrcode.react'; // npm install qrcode.react

interface PicPayCheckoutProps {
  plan: 'monthly' | 'yearly';
  onSuccess: () => void;
  onCancel: () => void;
}

export function PicPayCheckout({ plan, onSuccess, onCancel }: PicPayCheckoutProps) {
  const { loading, paymentData, createSubscriptionPayment, checkPayment } = usePayment();
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos

  useEffect(() => {
    // Criar pagamento ao montar componente
    handleCreatePayment();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    // Verificar status do pagamento a cada 5 segundos
    if (paymentData && !checking) {
      const interval = setInterval(async () => {
        setChecking(true);
        const status = await checkPayment(paymentData.referenceId);
        
        if (status?.status === 'paid') {
          clearInterval(interval);
          onSuccess();
        }
        
        setChecking(false);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [paymentData, checking]);

  const handleCreatePayment = async () => {
    await createSubscriptionPayment(plan);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <h3>Gerando pagamento PicPay...</h3>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3>Erro ao gerar pagamento</h3>
        <button onClick={handleCreatePayment}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Pagamento PicPay</h2>
        <p style={{ color: '#666', margin: 0 }}>
          Escaneie o QR Code ou clique no botão para pagar
        </p>
      </div>

      {/* Timer */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
          Tempo restante para pagamento:
        </div>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: timeLeft < 300 ? '#dc3545' : '#28a745' 
        }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-block',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <QRCodeSVG 
            value={paymentData.qrcode.content}
            size={200}
            level="M"
          />
        </div>
      </div>

      {/* Botão PicPay */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <a
          href={paymentData.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: '#11C76F',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        >
          💳 Pagar com PicPay
        </a>
      </div>

      {/* Status */}
      {checking && (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '1rem', color: '#1976d2' }}>
            🔄 Verificando pagamento...
          </div>
        </div>
      )}

      {/* Instruções */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Como pagar:</h4>
        <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>Abra o app do PicPay</li>
          <li>Escaneie o QR Code acima</li>
          <li>Confirme o pagamento</li>
          <li>Aguarde a confirmação automática</li>
        </ol>
      </div>

      {/* Botão Cancelar */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
```

---

## 🔧 **Configuração do Webhook**

### **1. Firebase Function para Webhook**

```typescript
// functions/src/picpayWebhook.ts
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const picpayWebhook = onRequest(async (req, res) => {
  try {
    const { referenceId, status } = req.body;
    
    if (status === 'paid') {
      // Extrair userId do referenceId
      const userId = referenceId.split('_')[1];
      
      // Ativar assinatura premium
      const db = getFirestore();
      await db.collection('subscriptions').doc(userId).update({
        plan: 'premium',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        lastPayment: new Date()
      });
      
      console.log(`Assinatura ativada para usuário: ${userId}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Erro');
  }
});
```

### **2. Deploy do Webhook**

```bash
cd functions
npm install
firebase deploy --only functions:picpayWebhook
```

---

## 📱 **Integração na Página de Upgrade**

```typescript
// Atualizar src/pages/Upgrade/index.tsx
import { PicPayCheckout } from '../../components/PicPayCheckout';

// Adicionar estado para mostrar checkout
const [showCheckout, setShowCheckout] = useState(false);
const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

// Substituir o botão de pagamento por:
{showCheckout ? (
  <PicPayCheckout
    plan={selectedPlan}
    onSuccess={() => {
      toast.success('Pagamento aprovado! Bem-vindo ao Premium!');
      navigate('/');
    }}
    onCancel={() => setShowCheckout(false)}
  />
) : (
  <button
    onClick={() => {
      setSelectedPlan('monthly');
      setShowCheckout(true);
    }}
    className="btn btn-primary"
  >
    Pagar R$ 20,00 com PicPay
  </button>
)}
```

---

## 🎯 **Próximos Passos:**

### **1. Instalar Dependências**
```bash
npm install axios uuid qrcode.react
npm install --save-dev @types/uuid
```

### **2. Criar Conta PicPay**
- Acesse: https://picpay.com/site/para-empresas
- Complete o cadastro
- Obtenha as credenciais

### **3. Configurar Ambiente**
- Adicionar tokens no `.env.local`
- Testar em sandbox primeiro

### **4. Deploy e Teste**
- Build e deploy no Netlify
- Testar fluxo completo

**Quer que eu implemente alguma parte específica agora?** 🚀💳
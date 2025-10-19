# 💳 Guia Completo - Integração PicPay

## 🎯 **Por que PicPay é a Melhor Opção:**

### **Vantagens Competitivas:**
- ✅ **Taxa mais baixa**: 2,99% (vs 3,99% Mercado Pago)
- ✅ **PIX integrado** sem taxa adicional
- ✅ **QR Code nativo** do PicPay
- ✅ **Recebimento D+1** (dia seguinte)
- ✅ **API simples** e confiável
- ✅ **Sem mensalidade** ou taxa de setup

---

## 📋 **Passo a Passo para Ativar:**

### **1. Criar Conta PicPay Empresarial**

1. **Acesse**: https://picpay.com/site/para-empresas
2. **Clique em "Quero vender com PicPay"**
3. **Preencha os dados da empresa**:
   - CNPJ (ou CPF se for MEI)
   - Dados bancários
   - Informações de contato
4. **Aguarde aprovação** (1-3 dias úteis)

### **2. Obter Credenciais da API**

Após aprovação:
1. **Acesse o painel**: https://lojista.picpay.com
2. **Vá em "Integrações" > "API"**
3. **Copie as credenciais**:
   - `x-picpay-token`
   - `x-seller-token`

### **3. Configurar no Sistema**

```javascript
// Atualizar src/services/picpayService.ts
constructor() {
  const isProduction = true; // Mudar para true
  
  this.baseURL = isProduction 
    ? 'https://appws.picpay.com/ecommerce/public'
    : 'https://sandbox.picpay.com/ecommerce/public';
  
  // Substituir pelos tokens reais
  this.token = 'SEU_TOKEN_PICPAY_AQUI';
  this.sellerToken = 'SEU_SELLER_TOKEN_AQUI';
}
```

### **4. Ativar Requisições Reais**

No arquivo `src/services/picpayService.ts`, descomente o código real:

```javascript
// Substituir o mockResponse por:
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
```

---

## 🔧 **Configuração do Webhook**

### **1. Criar Firebase Function**

```bash
cd functions
npm install axios
```

```javascript
// functions/src/picpayWebhook.ts
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const picpayWebhook = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  try {
    console.log('📥 Webhook PicPay recebido:', req.body);
    
    const { referenceId, status, authorizationId } = req.body;
    
    if (status === 'paid') {
      // Extrair userId do referenceId (formato: sub_userId_timestamp_random)
      const parts = referenceId.split('_');
      const userId = parts[1];
      
      console.log('💎 Ativando Premium para usuário:', userId);
      
      // Ativar assinatura premium
      const db = getFirestore();
      const now = new Date();
      const endDate = new Date();
      
      // Verificar se é mensal ou anual pelo valor ou referenceId
      const isYearly = referenceId.includes('yearly') || req.body.value >= 200;
      
      if (isYearly) {
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 ano
      } else {
        endDate.setMonth(endDate.getMonth() + 1); // 1 mês
      }
      
      await db.collection('subscriptions').doc(userId).update({
        plan: 'premium',
        status: 'active',
        startDate: now,
        endDate: endDate,
        lastPayment: now,
        paymentMethod: 'picpay',
        authorizationId: authorizationId
      });
      
      console.log('✅ Assinatura Premium ativada!');
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});
```

### **2. Deploy do Webhook**

```bash
firebase deploy --only functions:picpayWebhook
```

### **3. Configurar URL no PicPay**

No painel do PicPay:
1. **Vá em "Integrações" > "Webhooks"**
2. **Adicione a URL**: 
   ```
   https://us-central1-web-gestao-37a85.cloudfunctions.net/picpayWebhook
   ```
3. **Selecione eventos**: `payment.paid`, `payment.cancelled`

---

## 🧪 **Teste em Sandbox**

### **1. Credenciais de Teste**
```javascript
// Para testes
this.token = 'teste_token_picpay';
this.sellerToken = 'teste_seller_token';
```

### **2. Dados de Teste**
```javascript
buyer: {
  firstName: 'João',
  lastName: 'Silva',
  document: '11111111111',
  email: 'joao@teste.com',
  phone: '+5511999999999'
}
```

### **3. Simular Pagamento**
- Use o botão "Simular Pagamento Aprovado"
- Ou configure webhook de teste

---

## 💰 **Cálculo de Taxas**

### **Exemplo Mensal (R$ 20)**
- Valor: R$ 20,00
- Taxa PicPay (2,99%): R$ 0,60
- **Você recebe**: R$ 19,40
- **Cliente paga**: R$ 20,00

### **Exemplo Anual (R$ 200)**
- Valor: R$ 200,00
- Taxa PicPay (2,99%): R$ 5,98
- **Você recebe**: R$ 194,02
- **Cliente paga**: R$ 200,00

---

## 📊 **Projeção de Receita**

### **Cenário com 100 Clientes Premium:**
- Receita bruta: R$ 2.000/mês
- Taxa PicPay: R$ 59,80/mês
- **Receita líquida**: R$ 1.940,20/mês
- **Anual**: R$ 23.282,40

### **Cenário com 500 Clientes Premium:**
- Receita bruta: R$ 10.000/mês
- Taxa PicPay: R$ 299,00/mês
- **Receita líquida**: R$ 9.701,00/mês
- **Anual**: R$ 116.412,00

---

## 🚀 **Próximos Passos:**

### **1. Implementar Agora (Desenvolvimento)**
```bash
npm run build
# Deploy no Netlify
```

### **2. Ativar Produção**
1. Criar conta PicPay empresarial
2. Obter credenciais reais
3. Configurar webhook
4. Testar com pagamento real pequeno

### **3. Marketing**
- Landing page com "Teste 12 meses grátis"
- Campanhas Google Ads
- Parcerias com contadores
- Programa de indicação

---

## 🔒 **Segurança**

### **Validação de Webhook**
```javascript
// Verificar assinatura do webhook
const crypto = require('crypto');

const validateWebhook = (payload, signature, secret) => {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
};
```

### **Logs e Monitoramento**
- Logs detalhados no Firebase Functions
- Alertas para falhas de pagamento
- Dashboard de métricas

---

**Quer que eu implemente alguma parte específica agora?** 🚀💳
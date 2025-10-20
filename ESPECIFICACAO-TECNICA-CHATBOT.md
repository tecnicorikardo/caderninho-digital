# 📋 Especificação Técnica - Chatbot Caderninho Digital

## 🎯 **Objetivo**
Criar um chatbot inteligente integrado ao sistema de gestão "Caderninho Digital" que permita consultar dados, gerar relatórios e receber insights via Telegram.

---

## 🏗️ **Arquitetura da Aplicação Existente**

### **Frontend**
- **Framework**: React + TypeScript + Vite
- **Deploy**: Netlify (https://caderninhodigital.netlify.app)
- **Autenticação**: Firebase Auth
- **Estilização**: CSS Modules

### **Backend/Database**
- **Database**: Firebase Firestore
- **Projeto Firebase**: `web-gestao-37a85`
- **Autenticação**: Firebase Auth
- **Storage**: Firebase Storage

### **Configuração Firebase**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCSgstRe719NjNr0AIHkApOzOvBm-kv1go",
  authDomain: "web-gestao-37a85.firebaseapp.com",
  projectId: "web-gestao-37a85",
  storageBucket: "web-gestao-37a85.appspot.com",
  messagingSenderId: "360273086290",
  appId: "1:360273086290:web:0f47316af2dbd156039c8b"
};
```

---

## 📊 **Estrutura de Dados no Firestore**

### **1. Coleção: `sales` (Vendas)**
```typescript
interface Sale {
  id: string;
  clientId?: string;           // ID do cliente (opcional)
  clientName?: string;         // Nome do cliente
  products: Product[];         // Array de produtos vendidos
  subtotal: number;           // Subtotal da venda
  discount: number;           // Desconto aplicado
  total: number;              // Total final
  paymentMethod: 'dinheiro' | 'pix' | 'fiado';
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  paidAmount: number;         // Valor já pago
  remainingAmount: number;    // Valor restante
  isLoan: boolean;           // Se é empréstimo
  loanAmount?: number;       // Valor do empréstimo
  installments?: Installment[]; // Parcelas (se fiado)
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
  userId: string;            // ID do usuário proprietário
  notes?: string;            // Observações
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Installment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pendente' | 'pago' | 'atrasado';
}
```

### **2. Coleção: `clients` (Clientes)**
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
```

### **3. Coleção: `products` (Produtos/Estoque)**
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;                // Código do produto
  costPrice: number;          // Preço de custo
  salePrice: number;          // Preço de venda
  quantity: number;           // Quantidade em estoque
  minQuantity: number;        // Estoque mínimo
  category: string;           // Categoria
  supplier: string;           // Fornecedor
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
```

### **4. Coleção: `payments` (Pagamentos)**
```typescript
interface Payment {
  id: string;
  saleId: string;            // ID da venda
  amount: number;            // Valor do pagamento
  method: 'dinheiro' | 'pix';
  date: Date;
  notes?: string;
  userId: string;
}
```

---

## 🔐 **Autenticação e Segurança**

### **Regras do Firestore**
- Todos os dados são filtrados por `userId`
- Usuário só acessa seus próprios dados
- Autenticação obrigatória via Firebase Auth

### **Para o Chatbot**
- **Opção 1**: Firebase Admin SDK (recomendado)
- **Opção 2**: API REST personalizada
- **Opção 3**: Webhook com autenticação por token

---

## 🎯 **Funcionalidades Prioritárias do Chatbot**

### **1. Consulta de Vendas** 
```
Exemplos de perguntas:
- "Quanto vendi hoje?"
- "Qual foi minha melhor venda?"
- "Quantas vendas fiz este mês?"
- "Quem são meus clientes devedores?"
```

**Dados necessários:**
- Vendas do dia/mês/período
- Faturamento total
- Ticket médio
- Status de pagamentos
- Vendas pendentes

### **2. Gestão de Clientes**
```
Exemplos de perguntas:
- "Quantos clientes tenho?"
- "Quem são meus melhores clientes?"
- "Quem está devendo?"
- "Clientes novos este mês?"
```

**Dados necessários:**
- Total de clientes
- Clientes com maior volume de compras
- Clientes com pendências
- Novos cadastros

### **3. Controle de Estoque**
```
Exemplos de perguntas:
- "Quais produtos estão acabando?"
- "Qual produto vende mais?"
- "Preciso repor estoque?"
- "Quanto tenho em estoque?"
```

**Dados necessários:**
- Produtos com estoque baixo
- Produtos mais vendidos
- Valor total do estoque
- Alertas de reposição

### **4. Relatórios Financeiros**
```
Exemplos de perguntas:
- "Qual meu lucro do mês?"
- "Quanto tenho a receber?"
- "Análise de performance"
- "Comparativo mensal"
```

**Dados necessários:**
- Faturamento vs custos
- Contas a receber
- Análise de tendências
- Comparativos

### **5. Alertas e Notificações**
```
Funcionalidades automáticas:
- Estoque baixo
- Pagamentos vencidos
- Metas atingidas
- Resumo diário
```

---

## 🛠️ **Tecnologias Recomendadas**

### **Chatbot**
- **Plataforma**: Telegram Bot API
- **IA**: OpenAI GPT-4 ou Groq (já configurado)
- **Backend**: Node.js + Express
- **Deploy**: Render, Railway ou Vercel

### **Integração com Firebase**
```javascript
// Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'web-gestao-37a85'
});

const db = admin.firestore();
```

---

## 📡 **APIs Necessárias**

### **1. API de Vendas**
```javascript
// GET /api/sales/:userId
// Retorna vendas do usuário
{
  "sales": [
    {
      "id": "sale123",
      "total": 150.00,
      "paymentStatus": "pago",
      "createdAt": "2024-01-15T10:30:00Z",
      "clientName": "João Silva"
    }
  ],
  "summary": {
    "totalToday": 450.00,
    "countToday": 3,
    "averageTicket": 150.00
  }
}
```

### **2. API de Clientes**
```javascript
// GET /api/clients/:userId
{
  "clients": [
    {
      "id": "client123",
      "name": "João Silva",
      "phone": "11999999999",
      "totalPurchases": 1500.00,
      "pendingAmount": 200.00
    }
  ],
  "summary": {
    "total": 45,
    "newThisMonth": 7,
    "withPendingPayments": 12
  }
}
```

### **3. API de Estoque**
```javascript
// GET /api/products/:userId
{
  "products": [
    {
      "id": "prod123",
      "name": "Produto A",
      "quantity": 5,
      "minQuantity": 10,
      "needsRestock": true
    }
  ],
  "summary": {
    "total": 156,
    "lowStock": 12,
    "totalValue": 15000.00
  }
}
```

---

## 🔧 **Configuração do Ambiente**

### **Variáveis de Ambiente**
```env
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui

# IA (Groq já configurado)
GROQ_API_KEY=sua_chave_groq_aqui

# Firebase
FIREBASE_PROJECT_ID=web-gestao-37a85
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Sistema
SYSTEM_URL=https://caderninhodigital.netlify.app
PORT=3000
```

### **Dependências**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "node-telegram-bot-api": "^0.66.0",
    "firebase-admin": "^12.0.0",
    "groq-sdk": "^0.3.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

---

## 🎯 **Fluxo de Desenvolvimento**

### **Fase 1: Setup Básico (2-4h)**
1. Configurar bot no Telegram
2. Conectar Firebase Admin SDK
3. Criar APIs básicas de consulta
4. Testar conexão com dados

### **Fase 2: IA e Processamento (4-6h)**
1. Integrar Groq/OpenAI
2. Criar processamento de linguagem natural
3. Implementar respostas contextuais
4. Adicionar botões interativos

### **Fase 3: Funcionalidades Avançadas (6-8h)**
1. Relatórios detalhados
2. Análises e insights
3. Alertas automáticos
4. Dashboard executivo

### **Fase 4: Deploy e Testes (2-3h)**
1. Deploy em produção
2. Configurar webhooks
3. Testes completos
4. Documentação

---

## 📞 **Informações de Contato**

### **Telegram Bot Atual**
- **Token**: `7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw`
- **Username**: `@meucomercio_bot`
- **Status**: Funcional básico

### **Sistema Web**
- **URL**: https://caderninhodigital.netlify.app
- **Status**: Funcional completo

---

## 💡 **Observações Importantes**

1. **Dados Reais**: Sistema já tem dados de vendas, clientes e produtos
2. **Autenticação**: Cada usuário só vê seus dados
3. **Performance**: Usar cache para consultas frequentes
4. **Escalabilidade**: Preparar para múltiplos usuários
5. **Segurança**: Validar todas as entradas
6. **UX**: Respostas rápidas e intuitivas

---

## 🎯 **Resultado Esperado**

Um chatbot que funcione como **assistente pessoal de negócios**, capaz de:
- Responder perguntas em linguagem natural
- Fornecer insights inteligentes
- Gerar relatórios automáticos
- Alertar sobre situações importantes
- Guiar o usuário nas melhores práticas

**Tempo estimado total: 15-20 horas de desenvolvimento**
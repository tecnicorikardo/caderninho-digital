# 📧 Guia de Configuração - Email e Notificações

## Visão Geral

Sistema completo de envio de emails e notificações usando Firebase Cloud Functions + Nodemailer.

---

## 🎯 Funcionalidades Implementadas

### ✅ Envio Manual de Relatórios
- Relatórios de vendas
- Relatórios de estoque
- Relatórios de fiados
- Relatórios personalizados

### ✅ Notificações Automáticas
- Relatórios diários agendados
- Alertas de estoque baixo
- Alertas de fiados vencidos

### ✅ Templates Profissionais
- HTML responsivo
- Design corporativo
- Métricas destacadas
- Tabelas formatadas

---

## 📋 Pré-requisitos

1. **Plano Firebase Blaze** (pay-as-you-go)
   - Cloud Functions requer plano pago
   - Uso gratuito até certos limites

2. **Conta de Email**
   - Gmail (recomendado)
   - Outlook
   - Yahoo
   - Ou SMTP customizado

3. **Node.js 18+** instalado

---

## 🚀 Configuração Passo a Passo

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar Functions

```bash
# Na raiz do projeto
firebase init functions

# Selecionar:
# - TypeScript
# - ESLint (opcional)
# - Instalar dependências
```

### 3. Instalar Dependências

```bash
cd functions
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 4. Configurar Credenciais de Email

#### Opção A: Gmail (Recomendado)

1. **Ativar verificação em 2 etapas** na sua conta Google
2. **Gerar senha de app:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" e "Outro"
   - Copie a senha gerada

3. **Configurar no Firebase:**

```bash
firebase functions:config:set email.user="seu-email@gmail.com"
firebase functions:config:set email.password="sua-senha-de-app"
```

#### Opção B: Outlook/Hotmail

```bash
firebase functions:config:set email.user="seu-email@outlook.com"
firebase functions:config:set email.password="sua-senha"
```

Altere no código `sendEmail.ts`:
```typescript
service: 'outlook' // em vez de 'gmail'
```

#### Opção C: SMTP Customizado

```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.seuservidor.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
});
```

### 5. Verificar Configuração

```bash
firebase functions:config:get
```

Deve mostrar:
```json
{
  "email": {
    "user": "seu-email@gmail.com",
    "password": "sua-senha"
  }
}
```

### 6. Deploy das Functions

```bash
# Deploy de todas as functions
firebase deploy --only functions

# Ou deploy de uma função específica
firebase deploy --only functions:sendReportEmail
```

---

## 💻 Como Usar no Frontend

### 1. Importar o Serviço

```tsx
import { sendSalesReport, sendStockReport, sendFiadosReport } from '../services/emailService';
```

### 2. Enviar Relatório de Vendas

```tsx
const handleSendSalesReport = async () => {
  try {
    await sendSalesReport(
      'cliente@email.com',
      {
        totalSales: 5000,
        salesCount: 50,
        averageTicket: 100,
        sales: [...], // array de vendas
      },
      'Janeiro 2025'
    );
    alert('Relatório enviado!');
  } catch (error) {
    alert('Erro ao enviar relatório');
  }
};
```

### 3. Usar o Modal de Email

```tsx
import EmailReportModal from '../components/EmailReportModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        📧 Enviar por Email
      </button>

      <EmailReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reportType="sales"
        reportData={{
          period: 'Janeiro 2025',
          totalSales: 5000,
          salesCount: 50,
          // ...
        }}
        defaultSubject="Relatório de Vendas - Janeiro 2025"
      />
    </>
  );
}
```

---

## 📊 Exemplos de Uso

### Exemplo 1: Botão em Página de Relatórios

```tsx
// src/pages/Reports/index.tsx
import { useState } from 'react';
import EmailReportModal from '../../components/EmailReportModal';

function Reports() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleExportEmail = () => {
    // Preparar dados do relatório
    const data = {
      period: 'Janeiro 2025',
      totalSales: calculateTotalSales(),
      salesCount: sales.length,
      averageTicket: calculateAverage(),
      sales: sales,
    };
    
    setReportData(data);
    setShowEmailModal(true);
  };

  return (
    <div>
      <button onClick={handleExportEmail}>
        📧 Enviar Relatório por Email
      </button>

      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportType="sales"
        reportData={reportData}
      />
    </div>
  );
}
```

### Exemplo 2: Alerta Automático de Estoque

```tsx
// Ao adicionar/atualizar produto
const checkLowStock = async (product: Product) => {
  if (product.quantity <= product.minStock) {
    // Buscar email do admin
    const adminEmail = await getAdminEmail();
    
    await sendStockReport(adminEmail, {
      totalProducts: 1,
      lowStockCount: 1,
      lowStockProducts: [product],
    });
  }
};
```

### Exemplo 3: Relatório Diário Automático

A função `sendDailyReport` já está configurada para rodar todo dia às 8h.

Para personalizar:

```typescript
// functions/src/sendEmail.ts
export const sendDailyReport = functions.pubsub
  .schedule('0 8 * * *') // Cron: 8h todo dia
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // Buscar dados do dia anterior
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Buscar vendas
    const sales = await getSalesByDate(yesterday);
    
    // Buscar email do admin
    const adminEmail = await getAdminEmail();
    
    // Enviar relatório
    await sendSalesReport(adminEmail, {
      period: yesterday.toLocaleDateString('pt-BR'),
      totalSales: calculateTotal(sales),
      salesCount: sales.length,
      sales: sales,
    });
    
    return null;
  });
```

---

## 🎨 Personalizar Templates

### Editar HTML do Email

```typescript
// functions/src/sendEmail.ts
function generateReportHTML(reportType: string, data: any): string {
  // Adicionar logo da empresa
  const logo = 'https://seu-site.com/logo.png';
  
  // Personalizar cores
  const primaryColor = '#2d3748';
  const accentColor = '#3182ce';
  
  return `
    <div style="background: ${primaryColor};">
      <img src="${logo}" alt="Logo" />
      <h1>Seu Relatório</h1>
      <!-- ... -->
    </div>
  `;
}
```

---

## 💰 Custos

### Firebase Cloud Functions
- **Gratuito até:**
  - 2 milhões de invocações/mês
  - 400.000 GB-segundos/mês
  - 200.000 CPU-segundos/mês

### Gmail
- **Gratuito até:**
  - 500 emails/dia (conta pessoal)
  - 2.000 emails/dia (Google Workspace)

### Alternativas Gratuitas
- **SendGrid**: 100 emails/dia grátis
- **Mailgun**: 5.000 emails/mês grátis (3 meses)
- **Resend**: 3.000 emails/mês grátis

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca commitar senhas**
   ```bash
   # Usar Firebase Config
   firebase functions:config:set email.password="senha"
   ```

2. **Validar autenticação**
   ```typescript
   if (!context.auth) {
     throw new functions.https.HttpsError('unauthenticated');
   }
   ```

3. **Limitar taxa de envio**
   ```typescript
   // Máximo 10 emails por usuário por dia
   const emailCount = await getEmailCount(context.auth.uid);
   if (emailCount >= 10) {
     throw new functions.https.HttpsError('resource-exhausted');
   }
   ```

4. **Validar emails**
   ```typescript
   if (!isValidEmail(data.to)) {
     throw new functions.https.HttpsError('invalid-argument');
   }
   ```

---

## 🧪 Testar Localmente

### 1. Emulador de Functions

```bash
# Baixar configuração
firebase functions:config:get > .runtimeconfig.json

# Iniciar emulador
firebase emulators:start --only functions
```

### 2. Testar Função

```typescript
// No frontend, apontar para emulador
import { connectFunctionsEmulator } from 'firebase/functions';

if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

---

## 🐛 Troubleshooting

### Erro: "Invalid login"
- Verificar senha de app do Gmail
- Ativar "Acesso a apps menos seguros" (não recomendado)
- Usar senha de app em vez da senha normal

### Erro: "Unauthenticated"
- Usuário não está logado
- Token expirado
- Verificar regras de segurança

### Erro: "Quota exceeded"
- Limite de emails atingido
- Aguardar reset (24h)
- Usar serviço alternativo

### Emails não chegam
- Verificar pasta de spam
- Verificar configuração SMTP
- Testar com outro email

---

## 📚 Recursos Adicionais

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Nodemailer Docs](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Cron Schedule](https://crontab.guru/)

---

## 🎯 Próximos Passos

1. **Deploy das functions**
   ```bash
   firebase deploy --only functions
   ```

2. **Configurar credenciais de email**
   ```bash
   firebase functions:config:set email.user="seu@email.com"
   firebase functions:config:set email.password="senha"
   ```

3. **Testar envio de email**
   - Usar o modal no frontend
   - Verificar logs: `firebase functions:log`

4. **Personalizar templates**
   - Adicionar logo da empresa
   - Ajustar cores
   - Adicionar informações extras

5. **Configurar notificações automáticas**
   - Ajustar horário do relatório diário
   - Configurar alertas de estoque
   - Adicionar alertas de fiados vencidos

---

**Status:** ✅ Implementado e pronto para uso  
**Requer:** Plano Firebase Blaze + Configuração de email  
**Custo:** Gratuito dentro dos limites

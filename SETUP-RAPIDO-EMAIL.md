# ⚡ Setup Rápido - Email (Plano Blaze Ativo)

Como você já está no plano Blaze, vamos direto ao ponto!

---

## 🚀 Setup em 5 Minutos

### 1️⃣ Gerar Senha de App do Gmail

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione **"Email"** e **"Windows Computer"**
3. Clique em **"Gerar"**
4. **Copie a senha** (16 caracteres sem espaços)

> ⚠️ **Importante:** Você precisa ter verificação em 2 etapas ativada!

---

### 2️⃣ Executar Script de Setup

```bash
# Opção A: Script automático (Windows)
setup-email.bat

# Opção B: Manual
cd functions
npm install
firebase functions:config:set email.user="seu-email@gmail.com"
firebase functions:config:set email.password="sua-senha-de-app"
npm run build
cd ..
firebase deploy --only functions
```

---

### 3️⃣ Testar no Sistema

Adicione o botão de email em qualquer página de relatório:

```tsx
import { useState } from 'react';
import EmailReportModal from '../components/EmailReportModal';

function MinhasPagina() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
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
          averageTicket: 100,
          sales: [], // seus dados aqui
        }}
      />
    </>
  );
}
```

---

## 📊 Exemplo Prático - Página de Vendas

Vou criar um exemplo completo para você adicionar na página de vendas:

```tsx
// src/pages/Sales/index.tsx
import { useState } from 'react';
import EmailReportModal from '../../components/EmailReportModal';

// Adicione no seu componente de vendas:
const [showEmailModal, setShowEmailModal] = useState(false);

// Função para preparar dados do relatório
const prepareEmailReport = () => {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  return {
    period: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
    totalSales: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    salesCount: filteredSales.length,
    averageTicket: filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length,
    sales: filteredSales.map(sale => ({
      date: sale.date,
      clientName: sale.clientName || 'Venda Direta',
      total: sale.total,
    })),
  };
};

// Adicione o botão na interface:
<button
  onClick={() => setShowEmailModal(true)}
  style={{
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }}
>
  📧 Enviar Relatório
</button>

// Adicione o modal:
<EmailReportModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  reportType="sales"
  reportData={prepareEmailReport()}
  defaultSubject={`Relatório de Vendas - ${new Date().toLocaleDateString('pt-BR')}`}
/>
```

---

## 🔍 Verificar se Funcionou

### 1. Verificar Deploy
```bash
firebase functions:list
```

Deve mostrar:
- ✅ sendReportEmail
- ✅ sendDailyReport
- ✅ sendLowStockAlert

### 2. Ver Logs
```bash
firebase functions:log --only sendReportEmail
```

### 3. Testar Envio
1. Abra o sistema
2. Clique em "Enviar por Email"
3. Digite seu email
4. Clique em "Enviar"
5. Verifique sua caixa de entrada (e spam!)

---

## 🎯 Onde Adicionar os Botões

### 1. Página de Vendas
```tsx
// src/pages/Sales/index.tsx
// Adicionar botão ao lado de "Exportar PDF"
```

### 2. Página de Relatórios
```tsx
// src/pages/Reports/index.tsx
// Adicionar botão em cada tipo de relatório
```

### 3. Página de Estoque
```tsx
// src/pages/Stock/index.tsx
// Adicionar botão para alertas de estoque baixo
```

### 4. Página de Fiados
```tsx
// src/pages/Fiados/index.tsx
// Adicionar botão para relatório de pendências
```

---

## ⚙️ Configurações Opcionais

### Mudar Horário do Relatório Diário

```typescript
// functions/src/sendEmail.ts
export const sendDailyReport = functions.pubsub
  .schedule('0 18 * * *') // 18h em vez de 8h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // ...
  });
```

### Usar Outro Email (Outlook)

```typescript
// functions/src/sendEmail.ts
const transporter = nodemailer.createTransport({
  service: 'outlook', // em vez de 'gmail'
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
});
```

Depois configure:
```bash
firebase functions:config:set email.user="seu@outlook.com"
firebase functions:config:set email.password="sua-senha"
firebase deploy --only functions
```

---

## 💡 Dicas Importantes

### ✅ Fazer
- Testar com seu próprio email primeiro
- Verificar pasta de spam
- Usar senha de app (não a senha normal)
- Manter credenciais seguras

### ❌ Não Fazer
- Commitar senhas no código
- Enviar spam
- Ultrapassar limite de 500 emails/dia
- Usar senha normal do Gmail

---

## 🐛 Problemas Comuns

### "Invalid login"
**Solução:** Gerar nova senha de app no Google

### "Unauthenticated"
**Solução:** Fazer login no sistema antes de enviar

### Email não chega
**Solução:** 
1. Verificar spam
2. Verificar logs: `firebase functions:log`
3. Testar com outro email

### "Quota exceeded"
**Solução:** Aguardar 24h ou usar outro serviço (SendGrid)

---

## 📱 Próximos Passos

1. ✅ **Executar setup-email.bat**
2. ✅ **Testar envio de email**
3. ✅ **Adicionar botões nas páginas**
4. ⏳ **Configurar notificações automáticas**
5. ⏳ **Personalizar templates**

---

## 🎨 Personalizar Template

Para adicionar logo da sua empresa:

```typescript
// functions/src/sendEmail.ts
function generateReportHTML(reportType: string, data: any): string {
  const logoUrl = 'https://seu-site.com/logo.png';
  
  return `
    <div class="header">
      <img src="${logoUrl}" alt="Logo" style="max-width: 150px;" />
      <h1>Seu Relatório</h1>
    </div>
    <!-- resto do template -->
  `;
}
```

---

## 📞 Suporte

Se tiver problemas:
1. Verificar logs: `firebase functions:log`
2. Testar localmente: `firebase emulators:start`
3. Verificar configuração: `firebase functions:config:get`

---

**Tempo estimado:** 5-10 minutos  
**Custo:** Gratuito (dentro dos limites)  
**Dificuldade:** ⭐⭐☆☆☆

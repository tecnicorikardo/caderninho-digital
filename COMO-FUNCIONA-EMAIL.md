# 📧 Como Funciona o Sistema de Email

## 🎯 Conceito Simples

Pense no sistema como uma **empresa de correio**:

```
Você (dono do sistema) = Agência dos Correios
Seu Gmail = Carteiro que entrega
Usuários = Pessoas que recebem cartas
```

---

## 👥 Cenários de Uso

### Cenário 1: Você Mesmo
```
1. Você abre o sistema
2. Clica em "Enviar Relatório"
3. Digita seu email: comercio@gmail.com
4. Recebe o relatório no seu email
```

### Cenário 2: Funcionário
```
1. Funcionário abre o sistema
2. Clica em "Enviar Relatório"
3. Digita o email dele: funcionario@gmail.com
4. Recebe o relatório no email dele
```

### Cenário 3: Cliente
```
1. Você abre o sistema
2. Clica em "Enviar Relatório"
3. Digita o email do cliente: cliente@hotmail.com
4. Cliente recebe o relatório no email dele
```

---

## 🔧 Configuração Técnica

### O que você configura (1 vez):
```javascript
Email Servidor (quem envia):
├─ Email: seu-comercio@gmail.com
├─ Senha: senha-de-app-do-gmail
└─ Configurado no Firebase Functions
```

### O que cada usuário faz (toda vez):
```javascript
Email Destinatário (quem recebe):
├─ Digita o próprio email no modal
├─ Pode marcar "Lembrar meu email"
└─ Não precisa configurar nada
```

---

## 📊 Exemplo Real

### Configuração Inicial (Você faz 1 vez)
```bash
firebase functions:config:set email.user="comercio@gmail.com"
firebase functions:config:set email.password="abcd efgh ijkl mnop"
firebase deploy --only functions
```

### Uso Diário (Qualquer usuário)

**Usuário 1 - João (gerente):**
- Abre sistema → Relatórios
- Clica "Enviar por Email"
- Digita: joao@gmail.com
- ✅ Recebe relatório de: comercio@gmail.com

**Usuário 2 - Maria (vendedora):**
- Abre sistema → Vendas
- Clica "Enviar por Email"
- Digita: maria@hotmail.com
- ✅ Recebe relatório de: comercio@gmail.com

**Usuário 3 - Cliente:**
- Você envia para ele
- Digita: cliente@empresa.com
- ✅ Cliente recebe de: comercio@gmail.com

---

## 💡 Funcionalidades Adicionadas

### ✅ Lembrar Email
Agora o modal tem um checkbox "Lembrar meu email":
- ✅ Marcado: Salva o email no navegador
- ❌ Desmarcado: Não salva

**Como funciona:**
```javascript
1ª vez:
├─ Usuário digita: joao@gmail.com
├─ Marca "Lembrar meu email"
└─ Email é salvo no navegador

Próximas vezes:
├─ Modal já abre com: joao@gmail.com
└─ Usuário só clica "Enviar"
```

---

## 🔒 Segurança

### ✅ Seguro
- Senha do Gmail fica no servidor (Firebase)
- Usuários não veem a senha
- Cada usuário só recebe no próprio email
- Validação de autenticação

### ❌ Usuários NÃO podem
- Ver a senha do servidor
- Enviar de outro email
- Acessar configurações
- Enviar spam ilimitado

---

## 💰 Limites e Custos

### Gmail Gratuito
```
Limite: 500 emails/dia
Custo: R$ 0,00

Exemplo:
├─ 10 usuários
├─ 5 relatórios/dia cada
├─ Total: 50 emails/dia
└─ ✅ Dentro do limite
```

### Se precisar mais
```
Opção 1: Google Workspace
├─ Limite: 2.000 emails/dia
└─ Custo: ~R$ 30/mês

Opção 2: SendGrid
├─ Limite: 100 emails/dia (grátis)
├─ Limite: 40.000 emails/mês (pago)
└─ Custo: Grátis ou ~$20/mês
```

---

## 🎨 Personalização

### Nome do Remetente
Você pode personalizar como aparece:

```typescript
// functions/src/sendEmail.ts
const mailOptions = {
  from: `Meu Comércio <comercio@gmail.com>`, // Nome + Email
  to: to,
  subject: subject,
  html: htmlContent,
};
```

**Resultado:**
```
De: Meu Comércio <comercio@gmail.com>
Para: joao@gmail.com
Assunto: Relatório de Vendas
```

---

## 📱 Casos de Uso Práticos

### 1. Enviar para Contador
```javascript
// Você envia relatório mensal
Email: contador@escritorio.com
Assunto: Relatório Mensal - Janeiro 2025
```

### 2. Enviar para Sócio
```javascript
// Sócio recebe relatório semanal
Email: socio@empresa.com
Assunto: Relatório Semanal - Vendas
```

### 3. Funcionário Envia para Si Mesmo
```javascript
// Funcionário quer cópia do relatório
Email: funcionario@gmail.com
Assunto: Meu Relatório de Vendas
```

### 4. Enviar para Cliente
```javascript
// Cliente pediu extrato de fiados
Email: cliente@hotmail.com
Assunto: Extrato de Fiados - Dezembro
```

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────┐
│  1. Usuário clica "Enviar Relatório"   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Modal abre (email já preenchido?)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Usuário digita/confirma email       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Clica "Enviar Email"                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Frontend chama Firebase Function    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Function usa seu Gmail (servidor)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  7. Email enviado para destinatário     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  8. Usuário recebe email na caixa dele  │
└─────────────────────────────────────────┘
```

---

## ❓ Perguntas Frequentes

### P: Cada usuário precisa ter Gmail?
**R:** Não! Pode ser qualquer email (Gmail, Hotmail, Outlook, etc.)

### P: Preciso criar conta para cada usuário?
**R:** Não! Só você configura 1 email servidor.

### P: Usuário pode enviar de outro email?
**R:** Não! Sempre sai do seu email servidor.

### P: Como aparece para quem recebe?
**R:** 
```
De: Seu Comércio <comercio@gmail.com>
Para: usuario@email.com
```

### P: Posso usar email da empresa?
**R:** Sim! Pode usar qualquer SMTP (Gmail, Outlook, servidor próprio)

### P: Tem limite de usuários?
**R:** Não! Limite é de emails enviados (500/dia no Gmail)

### P: Funciona offline?
**R:** Não, precisa de internet para enviar.

---

## 🎯 Resumo

| Item | Configuração |
|------|--------------|
| **Email Servidor** | 1 vez (você) |
| **Email Destinatário** | Toda vez (cada usuário) |
| **Senha** | Segura no Firebase |
| **Custo** | Grátis (até 500/dia) |
| **Limite de Usuários** | Ilimitado |
| **Tipos de Email** | Qualquer (Gmail, Hotmail, etc.) |

---

## ✅ Vantagens

1. **Simples**: Usuário só digita o email
2. **Seguro**: Senha fica no servidor
3. **Flexível**: Qualquer email pode receber
4. **Gratuito**: Dentro dos limites do Gmail
5. **Profissional**: Emails formatados em HTML
6. **Prático**: Checkbox "Lembrar email"

---

**Conclusão:** Você configura 1 vez, todos usam para sempre! 🚀

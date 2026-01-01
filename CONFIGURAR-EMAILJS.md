# 🚀 Configurar EmailJS - Passo a Passo

## ✅ EmailJS Instalado e Configurado!

O código já está pronto. Agora você só precisa configurar sua conta EmailJS.

## 📋 Passos para Configurar

### 1. Criar Conta no EmailJS
1. Acesse: https://www.emailjs.com/
2. Clique em **"Sign Up"**
3. Crie sua conta gratuita
4. Confirme seu email

### 2. Conectar seu Gmail
1. No dashboard, vá em **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha **"Gmail"**
4. Faça login com sua conta Gmail (tecnicorikardo@gmail.com)
5. Autorize o EmailJS
6. **Anote o Service ID** (ex: service_abc123)

### 3. Criar Template de Email
1. Vá em **"Email Templates"**
2. Clique em **"Create New Template"**
3. Use este template:

```html
Assunto: {{subject}}

De: {{from_name}}
Para: {{to_email}}

{{report_content}}

---
Enviado automaticamente pelo Caderninho Digital
```

4. **Anote o Template ID** (ex: template_xyz789)

### 4. Obter Public Key
1. Vá em **"Account"** → **"General"**
2. Copie sua **Public Key** (ex: user_abc123xyz)

### 5. Configurar no Código
Edite o arquivo `src/services/emailjsService.ts` e substitua:

```typescript
const EMAILJS_CONFIG = {
  serviceId: 'SEU_SERVICE_ID_AQUI',     // Ex: service_abc123
  templateId: 'SEU_TEMPLATE_ID_AQUI',   // Ex: template_xyz789
  publicKey: 'SUA_PUBLIC_KEY_AQUI',     // Ex: user_abc123xyz
};
```

## 🎯 Template Avançado (Opcional)

Para emails mais bonitos, use este template HTML:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2d3748; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1>📊 {{subject}}</h1>
    <p>Caderninho Digital</p>
  </div>
  
  <div style="background: white; padding: 20px; border: 1px solid #e2e8f0;">
    <div style="white-space: pre-line;">{{report_content}}</div>
    
    <!-- HTML formatado (se disponível) -->
    <div>{{{report_html}}}</div>
  </div>
  
  <div style="background: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px;">
    <p>📱 Caderninho Digital - Sistema de Gestão</p>
    <p>Este é um email automático, não responda.</p>
  </div>
</div>
```

## 🧪 Testar Configuração

Após configurar:

1. **Build e Deploy:**
```bash
npm run build
firebase deploy --only hosting
```

2. **Testar:**
   - Acesse: https://bloquinhodigital.web.app
   - Vá em **Relatórios**
   - Clique em **"📧 Enviar por Email"**
   - Digite um email de teste
   - Clique em **"📧 Enviar Email"**

## 📊 Logs Esperados

### ✅ Sucesso:
```
1️⃣ Tentando envio via EmailJS...
📤 Enviando via EmailJS com parâmetros: {...}
✅ EmailJS Response: {status: 200, text: 'OK'}
✅ Email enviado com sucesso via EmailJS!
```

### ❌ Erro de Configuração:
```
❌ Erro no EmailJS: {status: 400, text: 'Bad Request'}
Erro de configuração do EmailJS. Verifique as credenciais.
```

## 🎯 Vantagens do EmailJS

- ✅ **200 emails gratuitos/mês**
- ✅ **Envio automático** (sem intervenção do usuário)
- ✅ **HTML formatado** profissionalmente
- ✅ **Funciona em qualquer dispositivo**
- ✅ **Sem problemas de servidor**
- ✅ **Configuração simples**

## 🔧 Troubleshooting

### Erro 400 (Bad Request)
- Verifique se Service ID, Template ID e Public Key estão corretos
- Confirme se o template tem as variáveis corretas

### Erro 402 (Payment Required)
- Você excedeu o limite gratuito de 200 emails/mês
- Considere upgrade ou aguarde o próximo mês

### Erro 403 (Forbidden)
- Verifique se o domínio está autorizado nas configurações
- Confirme se a Public Key está correta

## 🚀 Próximos Passos

1. **Configure sua conta EmailJS** (15 minutos)
2. **Atualize as credenciais** no código
3. **Faça o deploy**
4. **Teste o sistema**

**Resultado:** Emails automáticos funcionando perfeitamente! 🎉

---

**Links Úteis:**
- Dashboard EmailJS: https://dashboard.emailjs.com/
- Documentação: https://www.emailjs.com/docs/
- Suporte: https://www.emailjs.com/docs/faq/
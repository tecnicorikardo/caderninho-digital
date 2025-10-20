# 🚀 DEPLOY NO RENDER - PASSO A PASSO

## 📋 **PRÉ-REQUISITOS:**
- ✅ Conta no GitHub
- ✅ Conta no Render (render.com)
- ✅ Bot do Telegram criado
- ✅ API Key do Groq
- ✅ Chave do Firebase

## 🔧 **PASSO 1: Preparar Repositório**

### 1.1 Criar repositório no GitHub:
```bash
# No terminal, dentro da pasta chatbot-ia:
git init
git add .
git commit -m "Chatbot IA completo - consulta e cadastro"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/caderninho-chatbot.git
git push -u origin main
```

## 🌐 **PASSO 2: Deploy no Render**

### 2.1 Acessar Render:
1. Vá para https://render.com
2. Faça login ou crie conta
3. Clique em "New +" → "Web Service"

### 2.2 Conectar Repositório:
1. Conecte sua conta GitHub
2. Selecione o repositório do chatbot
3. Configure:
   - **Name:** `caderninho-chatbot-ia`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`

### 2.3 Configurar Variáveis de Ambiente:
No Render, adicione estas variáveis:

```
TELEGRAM_BOT_TOKEN=7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw
GROQ_API_KEY=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
PORT=10000
```

**FIREBASE_SERVICE_ACCOUNT:** (copie todo o conteúdo do serviceAccountKey.json)
```json
{"type":"service_account","project_id":"web-gestao-37a85",...}
```

## 🤖 **PASSO 3: Configurar Webhook do Telegram**

Após o deploy, configure o webhook:

```bash
# Substitua SEU_TOKEN e SUA_URL
curl -X POST https://api.telegram.org/bot7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw/setWebhook \
  -d "url=https://caderninho-chatbot-ia.onrender.com/webhook"
```

## ✅ **PASSO 4: Testar**

1. Procure seu bot no Telegram
2. Digite `/start`
3. Faça login: `/login email@teste.com senha123`
4. Teste: "Quanto vendi hoje?"

## 🔍 **VERIFICAR LOGS:**
No Render, vá em "Logs" para ver se está funcionando:
```
🤖 Telegram bot inicializado...
🔥 Firebase Admin SDK inicializado com sucesso!
✅ Caderninho Digital Chatbot IA inicializado!
```

## 🎯 **URLs IMPORTANTES:**
- **Render Dashboard:** https://dashboard.render.com
- **Seu Bot:** https://caderninho-chatbot-ia.onrender.com
- **Sistema Web:** https://web-gestao-37a85.web.app

## 🚨 **IMPORTANTE:**
- ✅ Nunca commite o arquivo `serviceAccountKey.json`
- ✅ Use variáveis de ambiente para dados sensíveis
- ✅ O plano gratuito do Render hiberna após 15min sem uso
- ✅ Para produção, considere plano pago

**🎉 APÓS O DEPLOY, SEU CHATBOT ESTARÁ PÚBLICO E FUNCIONANDO 24/7!**
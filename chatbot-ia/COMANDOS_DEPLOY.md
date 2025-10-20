# 🚀 COMANDOS PARA DEPLOY - COPIE E COLE

## 📋 **COMANDOS EM SEQUÊNCIA:**

### 1️⃣ **PREPARAR REPOSITÓRIO:**
```bash
# Execute dentro da pasta chatbot-ia:
git init
git add .
git commit -m "Chatbot IA completo - Vercel deploy"
git branch -M main

# ⚠️ SUBSTITUA SEU_USUARIO pelo seu usuário GitHub:
git remote add origin https://github.com/SEU_USUARIO/caderninho-chatbot-ia.git
git push -u origin main
```

### 2️⃣ **ACESSAR VERCEL:**
1. Abra: https://vercel.com
2. Login com GitHub
3. New Project → Import seu repositório
4. Deploy (aguardar 1-2 min)

### 3️⃣ **VARIÁVEIS DE AMBIENTE:**
No Vercel → Settings → Environment Variables, adicione:

**Nome:** `TELEGRAM_BOT_TOKEN`  
**Valor:** `7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw`

**Nome:** `GROQ_API_KEY`  
**Valor:** `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`

**Nome:** `NODE_ENV`  
**Valor:** `production`

**Nome:** `FIREBASE_SERVICE_ACCOUNT`  
**Valor:** (copie TODO o conteúdo do arquivo serviceAccountKey.json)

### 4️⃣ **REDEPLOY:**
- Vercel → Deployments → 3 pontinhos → Redeploy

### 5️⃣ **CONFIGURAR WEBHOOK:**
```bash
# Execute após o deploy:
npm run webhook:setup

# Quando pedir, digite sua URL do Vercel
# Exemplo: https://caderninho-chatbot-ia.vercel.app
```

### 6️⃣ **TESTAR:**
```bash
# Verificar webhook:
npm run webhook:check

# Testar Firebase:
npm run test:firebase
```

## 🎯 **URLs IMPORTANTES:**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Sua URL será:** `https://seu-projeto.vercel.app`
- **GitHub:** https://github.com
- **Telegram Bot:** https://t.me/seu_bot_name

## 🔧 **COMANDOS DE MANUTENÇÃO:**

### Verificar status:
```bash
npm run webhook:check
```

### Reconfigurar webhook:
```bash
npm run webhook:setup
```

### Testar Firebase:
```bash
npm run test:firebase
```

### Ver logs:
- Vercel Dashboard → Seu projeto → Functions

## 🎉 **RESULTADO FINAL:**

Após executar todos os comandos:
- ✅ **Bot online 24/7**
- ✅ **Firebase funcionando**
- ✅ **IA respondendo**
- ✅ **Cadastros salvando**
- ✅ **Múltiplos usuários**

**CHATBOT PÚBLICO E FUNCIONAL!** 🚀

## 📱 **TESTE NO TELEGRAM:**
1. Procure seu bot
2. `/start`
3. `/login email@teste.com senha123`
4. "Quanto vendi hoje?"
5. "Venda de R$ 50 para João"

**TUDO FUNCIONANDO!** 🎯
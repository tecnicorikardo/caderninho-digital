# 🤖 Deploy do Chatbot IA - Caderninho Digital

## 🚀 Como Fazer Deploy no Render

### 1. **Preparar o Projeto**
- ✅ Arquivo `bot-ia.js` está na raiz
- ✅ Arquivo `render.yaml` configurado
- ✅ Dependências corretas no `bot-ia-package.json`

### 2. **Configurar no Render**

1. **Acesse**: https://render.com
2. **Conecte seu repositório GitHub**
3. **Crie um novo Web Service**
4. **Configure:**
   - **Build Command**: `npm install --production`
   - **Start Command**: `node bot-ia.js`
   - **Root Directory**: deixe vazio (raiz do projeto)

### 3. **Variáveis de Ambiente Obrigatórias**

No painel do Render, adicione:

```
TELEGRAM_BOT_TOKEN=7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw
GROQ_API_KEY=sua_chave_groq_aqui
SYSTEM_API_URL=https://caderninhodigital.netlify.app
```

### 4. **Obter Chave Groq**

1. Acesse: https://console.groq.com
2. Crie uma conta gratuita
3. Vá em **API Keys**
4. Crie uma nova chave
5. Copie e cole no Render

### 5. **Testar o Bot**

Após o deploy:
1. Acesse a URL do seu app no Render
2. Deve aparecer: `{"status":"online",...}`
3. No Telegram, procure: `@meucomercio_bot`
4. Digite `/start`

## 🔧 Comandos de Teste

```
/start - Menu inicial
/help - Ajuda
"Quanto vendi hoje?" - Teste IA
"Quais são meus clientes?" - Teste IA
```

## 🐛 Solução de Problemas

### **Erro: Cannot find module**
- ✅ Verifique se `bot-ia.js` está na raiz
- ✅ Confirme o Start Command: `node bot-ia.js`

### **Erro: Missing dependencies**
- ✅ Execute: `npm install` localmente
- ✅ Verifique se todas as deps estão no `bot-ia-package.json`

### **Bot não responde**
- ✅ Verifique se TELEGRAM_BOT_TOKEN está correto
- ✅ Confirme se o webhook foi configurado
- ✅ Veja os logs no Render

### **IA não funciona**
- ✅ Verifique se GROQ_API_KEY está configurado
- ✅ Teste a chave em: https://console.groq.com

## 📋 Checklist Final

- [ ] Bot-ia.js na raiz do projeto
- [ ] render.yaml configurado
- [ ] Variáveis de ambiente no Render
- [ ] Chave Groq válida
- [ ] Deploy realizado com sucesso
- [ ] Teste no Telegram funcionando

**Pronto! Seu chatbot IA estará funcionando! 🎉**
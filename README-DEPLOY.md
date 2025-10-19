# 🚀 Deploy do Caderninho Digital Bot

## 📋 Informações do Bot

- **Nome:** caderninho_digital_bot
- **Username:** @meucomercio_bot
- **Token:** 7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw

## 🌐 Opções de Deploy

### 1. Railway (Recomendado)
1. Acesse: https://railway.app
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecione este repositório
5. Adicione a variável de ambiente:
   - `TELEGRAM_BOT_TOKEN` = `7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw`

### 2. Render
1. Acesse: https://render.com
2. "New" → "Web Service"
3. Conecte este repositório
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: `TELEGRAM_BOT_TOKEN`

### 3. Heroku
1. Acesse: https://heroku.com
2. "New" → "Create new app"
3. Conecte GitHub
4. Configure variáveis de ambiente

## 📱 Teste

Após o deploy, teste no Telegram:
1. Procure por `@meucomercio_bot`
2. Digite `/start`
3. Faça login com `/login email@teste.com 123456`

## 🔧 Comandos Disponíveis

- `/start` - Menu inicial
- `/login email senha` - Autenticar
- `/status` - Ver status
- `/saldo` - Resumo financeiro
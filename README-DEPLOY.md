# 🚀 Deploy do Caderninho Digital Bot

## Railway Deploy

### 1. Criar conta no Railway
- Acesse: https://railway.app
- Faça login com GitHub

### 2. Fazer deploy
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Fazer deploy
railway up
```

### 3. Configurar variáveis de ambiente
No painel do Railway, adicione:
```
TELEGRAM_BOT_TOKEN=7921538449:AAG278ik-III5ynMuZ2zxprsC1BW0hDZGWw
```

### 4. Testar
- Bot estará online 24/7
- Teste no Telegram: @meucomercio_bot

## Comandos do Bot

```
/start - Menu inicial
/login email senha - Fazer login
/status - Ver status do login
/saldo - Resumo financeiro
/cliente Nome Telefone - Cadastrar cliente
/venda Cliente Valor - Registrar venda
```

## Logs
Para ver logs:
```bash
railway logs
```
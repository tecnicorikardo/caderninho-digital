# 🤖 Caderninho Digital - Chatbot IA

Chatbot inteligente com Groq AI para o sistema Caderninho Digital.

## 🚀 Deploy no Render

1. **Conecte este repositório no Render**
2. **Configure as variáveis de ambiente:**
   - `TELEGRAM_BOT_TOKEN`: Seu token do bot
   - `GROQ_API_KEY`: Sua chave da API Groq
   - `SYSTEM_API_URL`: https://caderninhodigital.netlify.app

3. **Após o deploy, configure o webhook:**
```bash
curl -X POST https://api.telegram.org/bot{SEU_TOKEN}/setWebhook \
  -d "url=https://seu-app.onrender.com/webhook"
```

## 🤖 Funcionalidades

- **IA Conversacional** com Groq (Mixtral 8x7B)
- **Linguagem Natural** - converse normalmente
- **Integração** com Caderninho Digital
- **Botões Interativos** para ações rápidas
- **Webhook** sem conflitos

## 📱 Como usar

1. Procure por `@meucomercio_bot` no Telegram
2. Digite `/start`
3. Converse naturalmente!

Exemplos:
- "Quanto vendi hoje?"
- "Quais são meus clientes?"
- "Como está o estoque?"

## 🔧 Variáveis de Ambiente

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
GROQ_API_KEY=sua_chave_groq_aqui
SYSTEM_API_URL=https://caderninhodigital.netlify.app
PORT=3000
```
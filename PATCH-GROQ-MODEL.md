# 🔧 Correção Urgente - Modelo Groq

## ❌ Problema:
O modelo `mixtral-8x7b-32768` foi descontinuado pelo Groq.

## ✅ Solução:
Atualizar para `llama-3.1-8b-instant`

## 📝 Arquivo a corrigir no Render:
`bot-ia.js` linha 309:

**DE:**
```javascript
model: 'mixtral-8x7b-32768',
```

**PARA:**
```javascript
model: 'llama-3.1-8b-instant',
```

## 🚀 Como aplicar:

### Opção 1: Redeploy automático
1. Faça um novo commit no GitHub
2. Render fará redeploy automático

### Opção 2: Edição manual no Render
1. Acesse o dashboard do Render
2. Vá em "Shell" ou "Console"
3. Edite o arquivo diretamente

### Opção 3: Variável de ambiente
Adicione no Render:
```
GROQ_MODEL=llama-3.1-8b-instant
```

E modifique o código para usar:
```javascript
model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
```

## 🎯 Resultado esperado:
- ✅ IA funcionando novamente
- ✅ Respostas em linguagem natural
- ✅ Bot 100% operacional
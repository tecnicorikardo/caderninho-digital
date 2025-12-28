# 🤖 COMO CONFIGURAR A GEMINI API

## 📋 **Passo 1: Conseguir a API Key**

1. **Acesse:** https://makersuite.google.com/app/apikey
   - Ou: https://aistudio.google.com/app/apikey

2. **Faça login** com sua conta Google

3. **Clique em "Create API Key"** ou **"Criar chave de API"**

4. **Selecione o projeto:**
   - Escolha: `web-gestao-37a85` (seu projeto Firebase)
   - Ou crie um novo projeto

5. **Copie a chave** (algo como: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX`)

---

## 🔧 **Passo 2: Adicionar a API Key no código**

1. **Abra o arquivo:** `src/services/aiService.ts`

2. **Encontre a linha:**
   ```typescript
   const API_KEY = 'SUA_API_KEY_AQUI';
   ```

3. **Substitua** `SUA_API_KEY_AQUI` pela sua chave:
   ```typescript
   const API_KEY = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX';
   ```

4. **Salve o arquivo** (Ctrl + S)

---

## 🚀 **Passo 3: Fazer deploy**

Execute no terminal:

```bash
npm run build
firebase deploy --only hosting
```

---

## ✅ **Passo 4: Testar**

1. Acesse: https://web-gestao-37a85.web.app
2. Clique no botão 🤖 no canto inferior direito
3. Pergunte algo como:
   - "Como posso aumentar minhas vendas?"
   - "Dê dicas para gerenciar meu estoque"
   - "Como fidelizar clientes?"

---

## 💰 **Custos da Gemini API**

### **Plano Gratuito:**
- ✅ **60 requisições por minuto**
- ✅ **1.500 requisições por dia**
- ✅ **1 milhão de tokens por mês**
- ✅ **Grátis para sempre!**

### **Isso é suficiente para:**
- 📊 Até 1.500 conversas por dia
- 💬 Aproximadamente 50.000 mensagens por mês
- 🎯 Perfeito para pequenos e médios negócios

### **Se precisar de mais:**
- Plano pago: $0.00025 por 1.000 caracteres
- Muito barato! (R$ 0,001 por 1.000 caracteres)

---

## 🔒 **Segurança**

### ⚠️ **IMPORTANTE:**

**NÃO compartilhe sua API Key!**

Para produção, o ideal é:
1. Usar variáveis de ambiente
2. Ou criar uma Cloud Function (backend)

### **Solução Segura (Opcional):**

Criar arquivo `.env`:
```
VITE_GEMINI_API_KEY=sua_chave_aqui
```

E no código:
```typescript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

---

## 🐛 **Problemas Comuns**

### **Erro: "API key not valid"**
- ✅ Verifique se copiou a chave completa
- ✅ Verifique se não tem espaços extras
- ✅ Gere uma nova chave se necessário

### **Erro: "Quota exceeded"**
- ✅ Você atingiu o limite de 60 req/min
- ✅ Aguarde 1 minuto e tente novamente
- ✅ Ou faça upgrade para plano pago

### **Erro: "Model not found"**
- ✅ Verifique se está usando `gemini-pro`
- ✅ Atualize a biblioteca: `npm update @google/generative-ai`

---

## 📚 **Documentação Oficial**

- **Gemini API:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing
- **Exemplos:** https://ai.google.dev/examples

---

## 🎯 **Próximos Passos**

Depois de configurar, você pode:

1. **Melhorar o contexto** - Passar dados reais do usuário
2. **Adicionar análises** - IA analisa suas vendas
3. **Criar ações** - "Registre uma venda de R$ 50"
4. **Gerar relatórios** - IA cria relatórios automáticos

---

**Criado em:** 09/11/2025  
**Última atualização:** 09/11/2025

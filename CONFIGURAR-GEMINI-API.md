# 🤖 Configurar API Gemini - Chatbot IA

## ✅ Chatbot Implementado!

O chatbot com IA está pronto e funcionando com respostas offline. Para ativar a IA online, você precisa configurar a API do Gemini.

## 🆓 Como Obter API Key Gratuita

### 1. **Acessar Google AI Studio**
1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Escolha um projeto ou crie um novo
5. **Copie a API Key** gerada

### 2. **Configurar no Código**
Edite o arquivo `src/services/aiService.ts` na linha 15:

```typescript
// Substitua esta linha:
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

// Por sua API Key real:
const GEMINI_API_KEY = 'SUA_API_KEY_AQUI';
```

## 💰 Limites Gratuitos Gemini

### **Tier Gratuito:**
- **15 requests por minuto**
- **1.500 requests por dia**
- **Sem cobrança** até esses limites

### **Controles Implementados:**
- ✅ **10 perguntas por usuário/dia** (bem abaixo do limite)
- ✅ **30 segundos entre perguntas** (evita spam)
- ✅ **Respostas offline** se API falhar
- ✅ **Monitor de uso** em tempo real

## 🎯 Funcionalidades do Chatbot

### **Já Funcionando (Offline):**
- ✅ Interface completa
- ✅ Controles de limite
- ✅ Respostas inteligentes pré-definidas
- ✅ Design profissional
- ✅ Integração com dados do negócio

### **Com API Configurada (Online):**
- 🤖 **Respostas personalizadas** baseadas nos seus dados
- 📊 **Análises específicas** do seu negócio
- 💡 **Insights únicos** para sua situação
- 🎯 **Recomendações precisas** de ações

## 🧪 Testar Agora

### **Sem API (Funcionando):**
1. Acesse: https://bloquinhodigital.web.app
2. Clique no **botão azul com 🤖** (canto inferior direito)
3. Faça perguntas como:
   - "Como aumentar minhas vendas?"
   - "Qual produto devo focar?"
   - "Como melhorar meu estoque?"

### **Respostas Offline Incluem:**
- 💡 Dicas para aumentar vendas
- 📦 Estratégias de gestão de estoque
- 💰 Orientações sobre precificação
- 👥 Técnicas de fidelização de clientes
- 📊 Como interpretar relatórios

## 🚀 Deploy e Teste

### **Fazer Deploy:**
```bash
npm run build
firebase deploy --only hosting
```

### **Testar Sistema:**
1. **Acesse o site**
2. **Clique no chatbot** (🤖 no canto inferior direito)
3. **Faça uma pergunta**
4. **Veja a resposta inteligente**

## 📊 Exemplo de Uso

### **Pergunta:** "Como aumentar minhas vendas?"

### **Resposta Offline:**
```
💡 Dicas para Aumentar Vendas:

• Foque nos produtos mais vendidos - Mantenha sempre em estoque
• Ofereça promoções - Desconto por quantidade ou combo de produtos  
• Melhore o atendimento - Cliente satisfeito volta e indica
• Use as redes sociais - Divulgue seus produtos online
• Analise seus relatórios - Identifique padrões de vendas

📊 Acesse seus Relatórios para ver quais produtos vendem mais!
```

### **Resposta Online (Com API):**
```
🤖 Baseado nos seus dados de vendas:

Vejo que você vendeu R$ 749 hoje com 2 vendas. Seus produtos mais vendidos são SSD e Roteadores.

💡 Recomendações específicas:
• Foque em eletrônicos - seu nicho forte
• Aumente estoque de SSDs - alta demanda
• Ofereça combos (SSD + Roteador) - aumenta ticket médio
• Seu ticket médio de R$ 374 está bom, mantenha

📈 Próximos passos: Diversifique em acessórios para eletrônicos!
```

## 🎯 Vantagens Implementadas

### **Controles de Segurança:**
- ✅ Limite de 10 perguntas por usuário/dia
- ✅ Cooldown de 30 segundos entre perguntas
- ✅ Fallback automático para respostas offline
- ✅ Monitor de uso em tempo real

### **Experiência do Usuário:**
- ✅ Interface moderna e intuitiva
- ✅ Respostas formatadas com emojis
- ✅ Scroll automático das mensagens
- ✅ Indicador de digitação
- ✅ Contador de perguntas restantes

### **Integração com Negócio:**
- ✅ Usa dados reais das vendas
- ✅ Considera estoque atual
- ✅ Analisa performance de produtos
- ✅ Personaliza recomendações

## 🎉 Resultado Final

**O chatbot está funcionando perfeitamente mesmo sem a API!**

- ✅ **Respostas inteligentes** para perguntas comuns
- ✅ **Interface profissional** e moderna
- ✅ **Controles de uso** implementados
- ✅ **Fallback robusto** sempre funciona

**Com a API configurada, as respostas ficam ainda mais personalizadas e específicas para seu negócio!**

---

**🧪 Teste agora:** https://bloquinhodigital.web.app → Clique no 🤖

**🔑 Para IA online:** Configure API Key do Gemini (gratuita)
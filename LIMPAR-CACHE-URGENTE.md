# 🔄 LIMPAR CACHE - URGENTE!

## 🐛 Problema: Cache do Navegador

O sistema foi atualizado para PagarMe, mas o navegador ainda está usando a versão antiga em cache.

## 🔧 Soluções para Limpar Cache

### **Opção 1: Hard Refresh (Mais Rápido)**
1. **Abra o site:** https://bloquinhodigital.web.app
2. **Pressione:** `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
3. **Ou:** `Ctrl + F5`

### **Opção 2: Limpar Cache Manualmente**
1. **Abra DevTools:** F12
2. **Clique com botão direito** no botão de refresh
3. **Selecione:** "Esvaziar cache e recarregar forçadamente"

### **Opção 3: Limpar Cache Completo**
1. **Chrome:** Configurações → Privacidade → Limpar dados de navegação
2. **Selecione:** "Imagens e arquivos em cache"
3. **Período:** "Última hora"
4. **Clique:** "Limpar dados"

### **Opção 4: Modo Incógnito**
1. **Abra:** Nova janela incógnita (`Ctrl + Shift + N`)
2. **Acesse:** https://bloquinhodigital.web.app
3. **Teste:** PIX payment

## 📊 Como Verificar se Funcionou

### **Logs que DEVEM aparecer:**
```
🔄 Iniciando geração PIX... {"amount":20,"description":"Plano Premium Mensal"}
🏦 Usando PagarMe API - Versão 2025  ← NOVO LOG!
📡 Response status: 200
📊 Response data: {
  "success": true,
  "qrCode": "https://api.pagar.me/...",  ← URL PagarMe
  "copyPaste": "00020126580014br.gov.bcb.pix...",
  "paymentId": "ch_..."
}
```

### **Se NÃO aparecer o log "🏦 Usando PagarMe API":**
- Cache ainda não foi limpo
- Tente outra opção acima

## 🎯 Teste Após Limpar Cache

1. **Acesse:** https://bloquinhodigital.web.app
2. **Vá para:** Upgrade
3. **Clique:** "Gerar PIX"
4. **Abra Console:** F12 → Console
5. **Procure por:** "🏦 Usando PagarMe API - Versão 2025"

### **Se aparecer esse log:**
✅ Cache limpo com sucesso!
✅ Usando PagarMe agora!
✅ PIX deve funcionar!

### **Se NÃO aparecer:**
❌ Cache ainda não limpo
❌ Tente modo incógnito

## 🚀 Alternativa: Acesso Direto

Se o cache persistir, acesse diretamente:
```
https://bloquinhodigital.web.app/?v=2025&cache=false
```

## 💡 Por que Aconteceu?

- Service Worker estava cacheando a versão antiga
- Atualizei para versão v3 para forçar atualização
- Adicionei timestamp na URL da function
- Mas navegador pode ter cache persistente

---

**🔄 LIMPE O CACHE E TESTE NOVAMENTE!**

**📊 Procure pelo log: "🏦 Usando PagarMe API - Versão 2025"**

**✅ Se aparecer = PagarMe funcionando!**
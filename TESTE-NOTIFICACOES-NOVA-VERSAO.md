# 🧪 TESTE - Sistema de Notificações (Nova Versão)

**Data:** 12/11/2025  
**Versão:** 2.0 - Sistema Inteligente com Cache

---

## 🎯 O QUE FOI CORRIGIDO

### ✅ Problemas Resolvidos:

1. **Hook não estava sendo executado**
   - ❌ Antes: `useNotifications` não era chamado no App.tsx
   - ✅ Agora: Hook ativado corretamente no AppContent

2. **Cooldown muito restritivo (24h)**
   - ❌ Antes: Notificações só a cada 24 horas
   - ✅ Agora: Notificações a cada 30 minutos (estoque) e 7 dias (fiados)

3. **Sistema de cache melhorado**
   - ❌ Antes: Verificava no Firebase (lento e podia falhar)
   - ✅ Agora: Cache em memória (rápido e confiável)

4. **Primeira carga inteligente**
   - ❌ Antes: Notificava tudo ao fazer login
   - ✅ Agora: Pula primeira carga, só notifica mudanças

5. **Logs detalhados**
   - ❌ Antes: Logs básicos
   - ✅ Agora: Logs completos com timestamps e detalhes

---

## 🧪 COMO TESTAR

### Passo 1: Fazer Login
1. Abra o sistema
2. Pressione **F12** → Aba **Console**
3. Faça login

### Logs Esperados:
```
🎯 [NOTIFICAÇÕES] Hook useNotifications executado
   └─ Usuário: seu@email.com
   └─ UID: abc123...
   └─ Timestamp: 2025-11-12T...
✅ [NOTIFICAÇÕES] Iniciando monitoramento...

🚀 [ESTOQUE] Iniciando monitoramento para userId: abc123...
📦 [ESTOQUE] Snapshot recebido: {size: 5, empty: false, timestamp: ...}
ℹ️ [ESTOQUE] Primeira carga - apenas registrando estado inicial
   └─ Produto "X" já está com estoque baixo (registrado no cache)

🚀 [FIADOS] Iniciando monitoramento para userId: abc123...
💰 [FIADOS] Snapshot recebido: {size: 2, empty: false, timestamp: ...}
ℹ️ [FIADOS] Primeira carga - apenas registrando estado inicial
```

---

### Passo 2: Editar Produto para Estoque Baixo

1. Vá em **Estoque**
2. Edite um produto:
   - Quantidade: **3**
   - Estoque Mínimo: **10**
3. Salvar

### Logs Esperados:
```
📦 [ESTOQUE] Snapshot recebido: {size: 5, empty: false, timestamp: ...}
📊 [ESTOQUE] Verificando 5 produtos...

📦 [ESTOQUE] Produto: Produto Teste (ID: xyz123)
   └─ Estoque atual: 3
   └─ Estoque mínimo: 10
   └─ Condição (atual <= mínimo): true
   └─ Condição (atual > 0): true
   └─ ✅ Estoque BAIXO detectado!
   └─ Última notificação: nunca
   └─ Cooldown: 30 minutos
   └─ 🔔 ENVIANDO notificação de estoque baixo
📝 [NOTIFICAÇÃO] Criando notificação de estoque baixo: {...}
📝 Criando notificação: {...}
✅ Notificação criada no Firebase: abc123
   └─ ✅ Registrado no cache: stock_userId_productId
   └─ ✅ Notificação enviada e registrada!
```

### Resultado Esperado:
- 🔔 Sino mostra contador vermelho
- 🎉 Toast aparece no canto superior direito
- ✅ Notificação aparece na lista do sino

---

### Passo 3: Testar Cooldown (30 minutos)

1. Edite o mesmo produto novamente
2. Mude quantidade para **2**
3. Salvar

### Logs Esperados:
```
📦 [ESTOQUE] Produto: Produto Teste (ID: xyz123)
   └─ Estoque atual: 2
   └─ Estoque mínimo: 10
   └─ ✅ Estoque BAIXO detectado!
   └─ Última notificação: 1 minutos atrás
   └─ Cooldown: 30 minutos
   └─ ⏭️ Notificação já enviada recentemente (cooldown ativo)
```

### Resultado Esperado:
- ❌ NÃO deve criar nova notificação
- ✅ Deve mostrar mensagem de cooldown nos logs

---

## 🔍 VERIFICAR NOTIFICAÇÕES NO BANCO

Execute no Console do navegador:

```javascript
const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
const { db } = await import('./config/firebase');
const { auth } = await import('./config/firebase');

const q = query(
  collection(db, 'notifications'),
  where('userId', '==', auth.currentUser.uid),
  orderBy('createdAt', 'desc')
);

const snapshot = await getDocs(q);
console.log('=== NOTIFICAÇÕES NO BANCO ===');
console.log('Total:', snapshot.size);

snapshot.forEach(doc => {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate();
  console.log('\n🔔 Notificação:', data.title);
  console.log('   Mensagem:', data.message);
  console.log('   Tipo:', data.type);
  console.log('   Lida:', data.read);
  console.log('   Criada em:', createdAt?.toLocaleString('pt-BR'));
});
```

---

## ⏱️ SISTEMA DE COOLDOWN

### Estoque Baixo:
- **Cooldown:** 30 minutos
- **Motivo:** Evitar spam, mas permitir notificações frequentes

### Fiados Vencidos:
- **Cooldown:** 7 dias
- **Motivo:** Não incomodar muito o usuário

### Como funciona:
1. Ao enviar notificação, registra no cache em memória
2. Cache é limpo automaticamente a cada 30 minutos
3. Entradas antigas (>30min) são removidas
4. Sistema verifica cache antes de notificar

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: Logs não aparecem
**Causa:** Hook não está sendo executado  
**Solução:** Verificar se `useNotifications()` está no App.tsx

### Problema 2: Notificação não aparece no sino
**Causa:** Erro ao criar no Firebase  
**Solução:** Verificar logs de erro no console

### Problema 3: Toast não aparece
**Causa:** NotificationToast não está montado  
**Solução:** Verificar se está no App.tsx

### Problema 4: Muitas notificações
**Causa:** Cache foi limpo ou sistema reiniciado  
**Solução:** Normal, cache é em memória

---

## 📊 MONITORAMENTO EM TEMPO REAL

Para ver o sistema funcionando em tempo real:

```javascript
// Ativar logs detalhados
localStorage.setItem('debug', 'notifications:*');

// Ver cache atual
console.log('Cache de notificações:', notificationCache);
```

---

## ✅ CHECKLIST DE TESTE

- [ ] Logs aparecem ao fazer login
- [ ] Sistema detecta estoque baixo
- [ ] Notificação é criada no Firebase
- [ ] Notificação aparece no sino
- [ ] Toast aparece automaticamente
- [ ] Cooldown funciona (não duplica em 30min)
- [ ] Primeira carga não gera spam
- [ ] Logs são detalhados e claros

---

## 🎯 PRÓXIMOS PASSOS

Se tudo funcionar:
1. ✅ Sistema está operacional
2. ✅ Notificações funcionam em tempo real
3. ✅ Cooldown evita spam

Se ainda houver problemas:
1. Copie TODOS os logs do console
2. Informe qual teste falhou
3. Descreva o comportamento esperado vs real

---

## 💡 DICAS

- **Limpar cache:** Recarregue a página (F5)
- **Ver todas notificações:** Clique no sino 🔔
- **Marcar como lida:** Clique na notificação
- **Testar novamente:** Aguarde 30 minutos ou recarregue

---

**Boa sorte com os testes! 🚀**

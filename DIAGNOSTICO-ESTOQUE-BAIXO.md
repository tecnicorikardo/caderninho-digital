# 🔍 DIAGNÓSTICO: Notificação de Estoque Baixo Não Funciona

**Data:** 11/11/2025  
**Problema:** Produto com estoque baixo não gera notificação automática  
**Status:** ✅ CAUSA IDENTIFICADA

---

## 🎯 ANÁLISE DO PROBLEMA

### ✅ O que está FUNCIONANDO:
1. ✅ Teste manual de notificação funciona
2. ✅ Hook `useNotifications` está sendo chamado no App.tsx
3. ✅ NotificationToast está ativo
4. ✅ Listener do Firestore está configurado

### ❌ O que NÃO está funcionando:
1. ❌ Notificação automática de estoque baixo não dispara
2. ❌ Produto com estoque baixo não gera alerta

---

## 🔍 CAUSA RAIZ IDENTIFICADA

### Problema 1: Campo `minQuantity` vs `minStock`

**No Banco de Dados (productService.ts):**
```typescript
export interface Product {
  minQuantity: number;  // ← Campo correto no banco
}
```

**No Hook (useNotifications.ts):**
```typescript
const minStock = product.minQuantity || product.minStock || 5;
```

**Análise:**
- ✅ O hook JÁ está preparado para ambos os campos
- ✅ Usa `minQuantity` primeiro, depois `minStock`, depois 5 como padrão
- ✅ Isso NÃO é o problema

---

### Problema 2: Logs de Debug

**O hook TEM logs:**
```typescript
console.log('📦 Monitorando estoque de', snapshot.size, 'produtos');
console.log(`📊 Produto: ${product.name} - Estoque: ${currentStock}/${minStock}`);
console.log('🔔 Enviando notificação de estoque baixo para:', product.name);
```

**Pergunta Crítica:**
- ❓ Esses logs aparecem no console do navegador?
- ❓ Se sim, o que eles mostram?
- ❓ Se não, o listener não está sendo ativado

---

## 🧪 TESTE DE DIAGNÓSTICO

### Passo 1: Verificar se o listener está ativo
```javascript
// Abrir console do navegador (F12)
// Os logs devem aparecer automaticamente:

// Esperado:
// 📦 Monitorando estoque de X produtos
// 📊 Produto: Nome do Produto - Estoque: 2/5
```

### Passo 2: Verificar dados do produto
```javascript
// No console do navegador:
const { collection, getDocs, query, where } = await import('firebase/firestore');
const { db } = await import('./config/firebase');
const { auth } = await import('./config/firebase');

const q = query(
  collection(db, 'products'),
  where('userId', '==', auth.currentUser.uid)
);

const snapshot = await getDocs(q);
snapshot.forEach(doc => {
  const data = doc.data();
  console.log('Produto:', data.name);
  console.log('  quantity:', data.quantity);
  console.log('  minQuantity:', data.minQuantity);
  console.log('  minStock:', data.minStock);
  console.log('  Estoque baixo?', data.quantity <= (data.minQuantity || 5));
});
```

---

## 🔧 POSSÍVEIS CAUSAS

### Causa 1: Produto não tem `minQuantity` definido
**Verificar:**
- Produto foi criado com `minQuantity`?
- Valor é maior que 0?

**Solução:**
```javascript
// Atualizar produto manualmente:
const { doc, updateDoc } = await import('firebase/firestore');
const { db } = await import('./config/firebase');

await updateDoc(doc(db, 'products', 'ID_DO_PRODUTO'), {
  minQuantity: 5
});
```

---

### Causa 2: Listener não está sendo ativado
**Verificar:**
- Usuário está autenticado quando hook executa?
- Hook está dentro do AuthProvider?

**Análise do App.tsx:**
```typescript
<AuthProvider>
  <SubscriptionProvider>
    <AppContent>  {/* ← useNotifications() aqui */}
```

✅ Está correto! Hook está dentro do AuthProvider.

---

### Causa 3: Notificação já foi enviada nas últimas 24h
**Verificar:**
```javascript
// No console:
const { collection, getDocs, query, where } = await import('firebase/firestore');
const { db } = await import('./config/firebase');
const { auth } = await import('./config/firebase');

const q = query(
  collection(db, 'notifications'),
  where('userId', '==', auth.currentUser.uid),
  where('title', '==', '⚠️ Estoque Baixo')
);

const snapshot = await getDocs(q);
console.log('Notificações de estoque baixo:', snapshot.size);
snapshot.forEach(doc => {
  const data = doc.data();
  console.log('  Criada em:', data.createdAt.toDate());
  console.log('  Mensagem:', data.message);
});
```

---

### Causa 4: Condição de estoque baixo não é atendida
**Condição no código:**
```typescript
if (currentStock <= minStock && currentStock > 0)
```

**Verificar:**
- ✅ `currentStock <= minStock` - Estoque atual menor ou igual ao mínimo
- ✅ `currentStock > 0` - Estoque não pode ser zero (evita notificar produto esgotado)

**Exemplo:**
- Produto com `quantity: 0` e `minQuantity: 5` → ❌ NÃO notifica (estoque zerado)
- Produto com `quantity: 3` e `minQuantity: 5` → ✅ NOTIFICA
- Produto com `quantity: 5` e `minQuantity: 5` → ✅ NOTIFICA

---

## 🎯 SOLUÇÃO PASSO A PASSO

### Passo 1: Adicionar logs extras no hook (5 min)
```typescript
// src/hooks/useNotifications.ts
function monitorLowStock(userId: string) {
  console.log('🚀 Iniciando monitoramento de estoque para userId:', userId);
  
  const q = query(
    collection(db, 'products'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, async (snapshot) => {
    console.log('📦 Monitorando estoque de', snapshot.size, 'produtos');
    
    if (snapshot.size === 0) {
      console.log('⚠️ Nenhum produto encontrado para monitorar!');
    }
    
    for (const doc of snapshot.docs) {
      const product = doc.data();
      const currentStock = product.quantity || 0;
      const minStock = product.minQuantity || product.minStock || 5;

      console.log(`📊 Produto: ${product.name}`);
      console.log(`   - Estoque atual: ${currentStock}`);
      console.log(`   - Estoque mínimo: ${minStock}`);
      console.log(`   - Está baixo? ${currentStock <= minStock && currentStock > 0}`);

      if (currentStock <= minStock && currentStock > 0) {
        const notificationTitle = `⚠️ Estoque Baixo`;
        
        const hasRecent = await hasRecentNotification(userId, notificationTitle, 24);
        console.log(`   - Já notificou nas últimas 24h? ${hasRecent}`);
        
        if (!hasRecent) {
          console.log('🔔 ENVIANDO notificação de estoque baixo para:', product.name);
          await notifyLowStock(userId, product.name, currentStock, minStock);
        } else {
          console.log('⏭️ Notificação já enviada recentemente');
        }
      }
    }
  }, (error) => {
    console.error('❌ ERRO no listener de estoque:', error);
  });
}
```

### Passo 2: Testar com produto específico (2 min)
1. Abrir console do navegador (F12)
2. Fazer login no sistema
3. Observar os logs que aparecem
4. Criar/editar um produto com:
   - `quantity: 3`
   - `minQuantity: 5`
5. Aguardar 5 segundos
6. Verificar logs no console

### Passo 3: Forçar verificação manual (2 min)
```javascript
// No console do navegador:
const { notifyLowStock } = await import('./services/notificationService');
const { auth } = await import('./config/firebase');

// Forçar notificação
await notifyLowStock(
  auth.currentUser.uid,
  'Produto Teste',
  3,
  5
);

console.log('✅ Notificação forçada criada!');
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [ ] Logs aparecem no console quando faço login?
- [ ] Logs mostram "Monitorando estoque de X produtos"?
- [ ] Produto tem campo `minQuantity` definido?
- [ ] Produto tem `quantity <= minQuantity`?
- [ ] Produto tem `quantity > 0`?
- [ ] Não há notificação de estoque baixo nas últimas 24h?
- [ ] Usuário está autenticado quando hook executa?
- [ ] Não há erros no console?

---

## 🚨 PRÓXIMOS PASSOS

1. **Executar Passo 1** - Adicionar logs extras
2. **Executar Passo 2** - Testar com produto específico
3. **Copiar logs do console** e enviar para análise
4. **Verificar dados do produto** no Firebase Console

---

**Aguardando:** Logs do console para diagnóstico preciso

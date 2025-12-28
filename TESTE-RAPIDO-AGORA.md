# ⚡ TESTE RÁPIDO - Execute AGORA

**Tempo:** 2 minutos  
**Objetivo:** Ver os logs e identificar o problema

---

## 🚀 PASSO A PASSO

### 1. Abrir Console (10 segundos)
- Pressione **F12** no navegador
- Clique na aba **Console**
- Deixe aberto

### 2. Recarregar Página (5 segundos)
- Pressione **Ctrl + R** (ou F5)
- Aguarde carregar

### 3. Fazer Login (20 segundos)
- Faça login normalmente
- **OBSERVE O CONSOLE**

### 4. Copiar Logs (30 segundos)
- Clique com botão direito no console
- "Save as..." ou copie tudo
- Cole aqui embaixo

---

## 📋 COLE OS LOGS AQUI:

```
[COLE AQUI TODOS OS LOGS QUE APARECEREM]
```

---

## 🔍 O QUE PROCURAR NOS LOGS

### ✅ Logs BONS (sistema funcionando):
```
🎯 [NOTIFICAÇÕES] Hook useNotifications executado
   └─ Usuário: seu@email.com
✅ [NOTIFICAÇÕES] Iniciando monitoramento...
🚀 [ESTOQUE] Iniciando monitoramento para userId: ...
📦 [ESTOQUE] Monitorando 5 produtos
📊 [ESTOQUE] Produto: Produto X
   └─ Estoque atual: 3
   └─ Estoque mínimo: 5
   └─ Condição atendida? true
```

### ❌ Logs RUINS (problema identificado):
```
⚠️ [NOTIFICAÇÕES] Usuário não autenticado
```
ou
```
⚠️ [ESTOQUE] Nenhum produto encontrado
```
ou
```
❌ [ESTOQUE] ERRO no listener: ...
```

---

## 🎯 TESTE ESPECÍFICO DO SEU PRODUTO

### Execute no console:
```javascript
// 1. Verificar produtos
const { collection, getDocs, query, where } = await import('firebase/firestore');
const { db } = await import('./config/firebase');
const { auth } = await import('./config/firebase');

const q = query(
  collection(db, 'products'),
  where('userId', '==', auth.currentUser.uid)
);

const snapshot = await getDocs(q);
console.log('=== SEUS PRODUTOS ===');
snapshot.forEach(doc => {
  const data = doc.data();
  const baixo = data.quantity <= (data.minQuantity || 5) && data.quantity > 0;
  console.log(`\n📦 ${data.name}`);
  console.log(`   Estoque: ${data.quantity}`);
  console.log(`   Mínimo: ${data.minQuantity || 'não definido (usa 5)'}`);
  console.log(`   Está baixo? ${baixo ? '✅ SIM' : '❌ NÃO'}`);
});
```

---

## 📤 ENVIE PARA MIM:

1. **Logs do console** (desde o login)
2. **Resultado do script acima**
3. **Nome do produto** que deveria notificar
4. **Valores:** quantity e minQuantity desse produto

---

## ⚡ TESTE ALTERNATIVO (se logs não aparecerem)

### Forçar notificação manualmente:
```javascript
// Execute no console:
const { notifyLowStock } = await import('./services/notificationService');
const { auth } = await import('./config/firebase');

await notifyLowStock(
  auth.currentUser.uid,
  'Produto Teste Manual',
  3,
  5
);

console.log('✅ Notificação manual criada!');
// Agora verifique o sino 🔔
```

Se a notificação manual funcionar mas a automática não, o problema está no **monitoramento**, não na criação de notificações.

---

**Execute agora e me envie os resultados!** 🚀

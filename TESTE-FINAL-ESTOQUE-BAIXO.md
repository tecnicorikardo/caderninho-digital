# 🧪 TESTE FINAL - Estoque Baixo

**Objetivo:** Confirmar que notificação dispara quando produto é editado

---

## 🎯 TESTE PASSO A PASSO

### Passo 1: Limpar Console (5 seg)
1. Abrir console (F12)
2. Clicar com botão direito
3. "Clear console" (ou Ctrl+L)

### Passo 2: Editar Produto 9 (30 seg)
1. Ir para **Estoque**
2. Procurar **Produto 9** (que tem estoque 0)
3. Clicar em **Editar**
4. Mudar:
   - **Quantidade:** de 0 para **3**
   - **Estoque Mínimo:** deixar em **5**
5. Clicar em **Salvar**

### Passo 3: Observar Console (10 seg)
Aguardar e procurar por:
```
📦 [ESTOQUE] Monitorando X produtos
📊 [ESTOQUE] Produto: Produto 9
   └─ Estoque atual: 3
   └─ Estoque mínimo: 5
   └─ Condição atendida? true
   └─ ✅ Estoque BAIXO detectado!
   └─ 🔔 ENVIANDO notificação de estoque baixo
```

### Passo 4: Verificar Sino (5 seg)
1. Olhar o sino 🔔 no topo
2. Deve ter contador vermelho
3. Clicar no sino
4. Procurar: **"⚠️ Estoque Baixo"** para Produto 9

---

## ❓ SE NÃO FUNCIONAR

### Teste Alternativo: Criar Produto Novo
1. Clicar em **+ Novo Produto**
2. Preencher:
   - Nome: **Teste Notificação**
   - Quantidade: **2**
   - Estoque Mínimo: **10**
   - Preço de Venda: **10**
3. Salvar
4. Observar console e sino

---

## 🔍 O QUE PODE ESTAR ACONTECENDO

### Hipótese 1: Delay do Firebase
O `onSnapshot` pode demorar alguns segundos para detectar a mudança.

**Solução:** Aguardar 5-10 segundos após salvar.

### Hipótese 2: Notificação já existe
Se você já editou o Produto 9 antes, pode ter notificação nas últimas 24h.

**Verificar:** Execute no console:
```javascript
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
  console.log('  Produto:', data.message);
  console.log('  Criada:', data.createdAt.toDate());
  console.log('  Há quanto tempo:', Math.floor((Date.now() - data.createdAt.toDate().getTime()) / (1000 * 60 * 60)), 'horas');
});
```

### Hipótese 3: Listener não está ativo
Verificar se os logs aparecem quando você vai para a página de Estoque.

**Procurar no console:**
```
📦 [ESTOQUE] Monitorando X produtos
```

Se não aparecer, o listener não está rodando.

---

## 📤 ME ENVIE

Após fazer o teste, me envie:

1. **Logs do console** (desde que salvou o produto)
2. **Screenshot do sino** (mostrando se tem notificação)
3. **Resultado do script** de verificação de notificações

---

**Execute agora e me envie os resultados!**

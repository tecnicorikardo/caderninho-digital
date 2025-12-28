# 🧪 GUIA DE TESTE - Notificações de Estoque Baixo

**Data:** 11/11/2025  
**Objetivo:** Diagnosticar por que notificações de estoque baixo não funcionam  
**Tempo:** 5 minutos

---

## 🎯 PREPARAÇÃO

### 1. Abrir Console do Navegador
- Pressione **F12** (ou Ctrl+Shift+I)
- Vá para a aba **Console**
- Deixe aberto durante todo o teste

### 2. Fazer Login
- Faça login no sistema
- **IMPORTANTE:** Observe os logs que aparecem no console

---

## 📋 TESTE 1: Verificar se Monitoramento Está Ativo

### Logs Esperados ao Fazer Login:
```
🎯 [NOTIFICAÇÕES] Hook useNotifications executado
   └─ Usuário: seu@email.com
   └─ UID: abc123...
✅ [NOTIFICAÇÕES] Iniciando monitoramento...
🚀 [ESTOQUE] Iniciando monitoramento para userId: abc123...
🚀 [FIADOS] Iniciando monitoramento para userId: abc123...
📦 [ESTOQUE] Monitorando X produtos
💰 [FIADOS] Monitorando Y vendas fiadas
```

### ✅ Se os logs aparecerem:
- Monitoramento está ATIVO
- Prossiga para Teste 2

### ❌ Se os logs NÃO aparecerem:
- Problema no hook ou autenticação
- Copie TODOS os logs do console e envie

---

## 📋 TESTE 2: Verificar Produto com Estoque Baixo

### Passo 1: Ir para Estoque
- Clique em **Estoque** no menu

### Passo 2: Verificar Logs no Console
Você deve ver algo como:
```
📊 [ESTOQUE] Produto: Nome do Produto
   └─ Estoque atual: 3
   └─ Estoque mínimo: 5
   └─ minQuantity no banco: 5
   └─ minStock no banco: undefined
   └─ Condição atendida? true
   └─ ✅ Estoque BAIXO detectado!
   └─ Já notificou nas últimas 24h? false
   └─ 🔔 ENVIANDO notificação de estoque baixo
   └─ ✅ Notificação enviada com sucesso!
```

### ✅ Se aparecer "Estoque BAIXO detectado":
- Sistema detectou o problema
- Verifique se notificação foi criada

### ❌ Se aparecer "Estoque OK (não precisa notificar)":
- Produto não atende condições
- Veja seção "Condições" abaixo

---

## 📋 TESTE 3: Criar/Editar Produto com Estoque Baixo

### Passo 1: Criar Produto de Teste
1. Ir para **Estoque**
2. Clicar em **Novo Produto**
3. Preencher:
   - Nome: **Produto Teste Notificação**
   - Quantidade: **3**
   - Estoque Mínimo: **5**
   - Outros campos: qualquer valor
4. Salvar

### Passo 2: Observar Console
Após salvar, deve aparecer:
```
📦 [ESTOQUE] Monitorando X produtos
📊 [ESTOQUE] Produto: Produto Teste Notificação
   └─ Estoque atual: 3
   └─ Estoque mínimo: 5
   └─ Condição atendida? true
   └─ ✅ Estoque BAIXO detectado!
```

### Passo 3: Verificar Notificação
1. Olhar o sino 🔔 no topo
2. Deve ter contador vermelho
3. Clicar no sino
4. Deve aparecer: **"⚠️ Estoque Baixo"**

---

## 📋 TESTE 4: Verificar Dados do Produto no Banco

### Executar no Console:
```javascript
// Copie e cole no console do navegador:

const { collection, getDocs, query, where } = await import('firebase/firestore');
const { db } = await import('./config/firebase');
const { auth } = await import('./config/firebase');

const q = query(
  collection(db, 'products'),
  where('userId', '==', auth.currentUser.uid)
);

const snapshot = await getDocs(q);
console.log('=== PRODUTOS NO BANCO ===');
snapshot.forEach(doc => {
  const data = doc.data();
  console.log('\n📦 Produto:', data.name);
  console.log('   ID:', doc.id);
  console.log('   quantity:', data.quantity);
  console.log('   minQuantity:', data.minQuantity);
  console.log('   minStock:', data.minStock);
  console.log('   Estoque baixo?', data.quantity <= (data.minQuantity || 5) && data.quantity > 0);
});
```

### Resultado Esperado:
```
=== PRODUTOS NO BANCO ===

📦 Produto: Produto Teste
   ID: abc123
   quantity: 3
   minQuantity: 5
   minStock: undefined
   Estoque baixo? true
```

---

## 📋 TESTE 5: Verificar Notificações Criadas

### Executar no Console:
```javascript
// Copie e cole no console do navegador:

const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
const { db } = await import('./config/firebase');
const { auth } = await import('./config/firebase');

const q = query(
  collection(db, 'notifications'),
  where('userId', '==', auth.currentUser.uid)
);

const snapshot = await getDocs(q);
console.log('=== NOTIFICAÇÕES NO BANCO ===');
console.log('Total:', snapshot.size);

snapshot.forEach(doc => {
  const data = doc.data();
  console.log('\n🔔 Notificação:', data.title);
  console.log('   Mensagem:', data.message);
  console.log('   Tipo:', data.type);
  console.log('   Lida:', data.read);
  console.log('   Criada em:', data.createdAt?.toDate?.() || data.createdAt);
});
```

---

## 🔍 CONDIÇÕES PARA NOTIFICAÇÃO DE ESTOQUE BAIXO

### ✅ Condições que DEVEM ser atendidas:
1. **Produto tem `minQuantity` definido** (ou usa padrão 5)
2. **`quantity <= minQuantity`** (estoque atual menor ou igual ao mínimo)
3. **`quantity > 0`** (estoque não pode ser zero)
4. **Não foi notificado nas últimas 24 horas**

### Exemplos:

| Quantity | minQuantity | Notifica? | Por quê? |
|----------|-------------|-----------|----------|
| 3 | 5 | ✅ SIM | 3 <= 5 e 3 > 0 |
| 5 | 5 | ✅ SIM | 5 <= 5 e 5 > 0 |
| 0 | 5 | ❌ NÃO | Estoque zerado (0 não é > 0) |
| 6 | 5 | ❌ NÃO | Estoque OK (6 não é <= 5) |
| 10 | 5 | ❌ NÃO | Estoque OK |

---

## 🚨 PROBLEMAS COMUNS

### Problema 1: Logs não aparecem
**Causa:** Hook não está sendo executado  
**Solução:** Verificar se está logado e recarregar página

### Problema 2: "Estoque OK" mas deveria estar baixo
**Causa:** Produto não tem `minQuantity` ou valor está errado  
**Solução:** Editar produto e definir `minQuantity`

### Problema 3: "Já notificou nas últimas 24h"
**Causa:** Notificação já foi enviada  
**Solução:** Aguardar 24h ou deletar notificação antiga

### Problema 4: Notificação não aparece no sino
**Causa:** Notificação não foi criada no banco  
**Solução:** Verificar logs de erro no console

---

## 📤 ENVIAR RESULTADOS

### Copie e envie:
1. **Todos os logs do console** (desde o login)
2. **Resultado do Teste 4** (produtos no banco)
3. **Resultado do Teste 5** (notificações no banco)
4. **Screenshots** se possível

### Formato:
```
=== LOGS DO CONSOLE ===
[cole aqui]

=== PRODUTOS NO BANCO ===
[cole aqui]

=== NOTIFICAÇÕES NO BANCO ===
[cole aqui]

=== OBSERVAÇÕES ===
[descreva o que aconteceu]
```

---

## ✅ RESULTADO ESPERADO

Se tudo estiver funcionando:
1. ✅ Logs aparecem no console
2. ✅ Sistema detecta estoque baixo
3. ✅ Notificação é criada
4. ✅ Notificação aparece no sino
5. ✅ Toast aparece automaticamente

---

**Próximo passo:** Execute os testes e envie os resultados!

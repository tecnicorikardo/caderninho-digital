# 📦 ALERTA DIÁRIO DE ESTOQUE BAIXO

**Data:** 13/11/2025  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 FUNCIONALIDADE

Sistema de alerta diário que mostra produtos com estoque baixo **uma vez por dia** ao fazer login.

---

## ✨ CARACTERÍSTICAS

### ✅ Alerta Inteligente
- Mostra apenas **uma vez por dia**
- Aparece **2 segundos após o login**
- Lista até **10 produtos** com estoque baixo
- Indica se há mais produtos além dos 10

### ✅ Critério de Estoque Baixo
Um produto é considerado com estoque baixo quando:
- `quantidade atual <= quantidade mínima`
- `quantidade atual > 0` (não mostra produtos zerados)

### ✅ Formato do Alerta
```
⚠️ ALERTA DE ESTOQUE BAIXO

3 produto(s) com estoque baixo:

• Produto A: 2 unidades (mínimo: 5)
• Produto B: 1 unidades (mínimo: 3)
• Produto C: 4 unidades (mínimo: 10)

Acesse o menu Estoque para repor.
```

---

## 📁 ARQUIVOS CRIADOS

### 1. Hook: `src/hooks/useDailyStockAlert.ts`
- Verifica estoque ao fazer login
- Controla exibição diária via localStorage
- Busca produtos do Firebase

### 2. Modificado: `src/pages/Dashboard/index.tsx`
- Adicionado import do hook
- Hook é executado automaticamente

---

## 🔧 COMO FUNCIONA

### 1. Verificação Diária
```typescript
const lastAlertDate = localStorage.getItem('lastStockAlertDate');
const today = new Date().toDateString();

if (lastAlertDate === today) {
  return; // Já mostrou hoje
}
```

### 2. Busca de Produtos
```typescript
const q = query(
  collection(db, 'products'),
  where('userId', '==', user.uid)
);
```

### 3. Filtro de Estoque Baixo
```typescript
if (currentStock <= minStock && currentStock > 0) {
  lowStockProducts.push(product);
}
```

### 4. Exibição do Alerta
```typescript
alert(message);
localStorage.setItem('lastStockAlertDate', today);
```

---

## 🧪 COMO TESTAR

### Teste 1: Primeira vez do dia
1. Faça login no sistema
2. Aguarde 2 segundos
3. Se houver produtos com estoque baixo, o alerta aparece

### Teste 2: Segunda vez no mesmo dia
1. Faça logout
2. Faça login novamente
3. O alerta **NÃO** aparece (já foi mostrado hoje)

### Teste 3: Forçar alerta (para teste)
1. Abra o console (F12)
2. Execute:
```javascript
localStorage.removeItem('lastStockAlertDate');
```
3. Recarregue a página (F5)
4. O alerta aparece novamente

### Teste 4: Criar produto com estoque baixo
1. Vá em **Estoque** → **Adicionar Produto**
2. Crie produto com:
   - Quantidade: 2
   - Estoque Mínimo: 5
3. Faça logout e login
4. O alerta deve aparecer com esse produto

---

## ⚙️ CONFIGURAÇÕES

### Tempo de Espera
```typescript
setTimeout(() => {
  checkStockAlert();
}, 2000); // 2 segundos após login
```

**Para alterar:** Mude o valor `2000` (em milissegundos)

### Limite de Produtos Exibidos
```typescript
const displayProducts = lowStockProducts.slice(0, 10);
```

**Para alterar:** Mude o valor `10`

### Critério de Estoque Baixo
```typescript
if (currentStock <= minStock && currentStock > 0)
```

**Para alterar:** Modifique a condição

---

## 🎨 PERSONALIZAÇÃO

### Mudar Mensagem do Alerta
Edite em `src/hooks/useDailyStockAlert.ts`:

```typescript
const message = `⚠️ SEU TÍTULO AQUI\n\n${lowStockProducts.length} produto(s):\n\n${productList}\n\nSua mensagem aqui.`;
```

### Desativar Alerta
Remova do Dashboard:

```typescript
// src/pages/Dashboard/index.tsx
// Comente ou remova esta linha:
useDailyStockAlert();
```

### Mudar Frequência
Para alerta a cada 12 horas:

```typescript
const lastAlertTime = localStorage.getItem('lastStockAlertTime');
const now = Date.now();
const twelveHours = 12 * 60 * 60 * 1000;

if (lastAlertTime && (now - parseInt(lastAlertTime)) < twelveHours) {
  return;
}

// ... código do alerta ...

localStorage.setItem('lastStockAlertTime', now.toString());
```

---

## 📊 LOGS NO CONSOLE

### Quando funciona corretamente:
```
✅ Alerta de estoque já foi mostrado hoje
```
ou
```
✅ Alerta de estoque mostrado (3 produtos)
```
ou
```
✅ Nenhum produto com estoque baixo
```

### Se houver erro:
```
❌ Erro ao verificar estoque: [detalhes do erro]
```

---

## 🔍 TROUBLESHOOTING

### Problema: Alerta não aparece

**Possíveis causas:**
1. Já foi mostrado hoje
2. Não há produtos com estoque baixo
3. Usuário não está autenticado

**Solução:**
1. Limpe o localStorage: `localStorage.removeItem('lastStockAlertDate')`
2. Crie produtos com estoque baixo
3. Verifique console para erros

---

### Problema: Alerta aparece toda vez

**Causa:** localStorage não está salvando

**Solução:**
1. Verifique se o navegador permite localStorage
2. Verifique modo anônimo/privado (não salva localStorage)
3. Limpe cache do navegador

---

### Problema: Produtos não aparecem no alerta

**Causa:** Critério de estoque baixo não está sendo atendido

**Solução:**
1. Verifique se `quantidade <= minQuantity`
2. Verifique se `quantidade > 0`
3. Verifique console para logs

---

## 💡 MELHORIAS FUTURAS (OPCIONAL)

### 1. Alerta Visual Melhor
Substituir `alert()` por modal customizado:
```typescript
// Usar biblioteca como react-modal ou criar componente próprio
<Modal>
  <h2>⚠️ Estoque Baixo</h2>
  <ul>
    {products.map(p => <li>{p.name}: {p.quantity}</li>)}
  </ul>
</Modal>
```

### 2. Botão para Ir Direto ao Estoque
```typescript
if (confirm(message + '\n\nDeseja ir para o Estoque agora?')) {
  navigate('/stock');
}
```

### 3. Som de Alerta
```typescript
const audio = new Audio('/alert-sound.mp3');
audio.play();
```

### 4. Configuração por Usuário
Permitir usuário escolher:
- Frequência do alerta (diário, semanal, etc)
- Ativar/desativar
- Horário preferido

---

## ✅ VANTAGENS

- ✅ Simples e eficaz
- ✅ Não precisa de banco de dados extra
- ✅ Não sobrecarrega o sistema
- ✅ Fácil de testar
- ✅ Fácil de personalizar
- ✅ Funciona offline (localStorage)

---

## 📝 NOTAS

- O alerta usa `localStorage`, então é específico por navegador
- Se o usuário usar outro navegador/dispositivo, verá o alerta novamente
- O alerta não é intrusivo (aparece apenas uma vez por dia)
- Produtos zerados não aparecem no alerta

---

**Implementado por:** Kiro AI Assistant  
**Data:** 13/11/2025  
**Status:** ✅ FUNCIONANDO

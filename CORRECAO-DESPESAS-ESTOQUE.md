# 🔧 CORREÇÃO - Despesas de Estoque Zeradas

## 🐛 PROBLEMA IDENTIFICADO

Quando você **movimenta o estoque**, as despesas em financeiro ficam zeradas, mas ao **adicionar um novo produto** funciona normalmente.

## 🔍 CAUSA RAIZ

A função `cleanDuplicateTransactions()` na página Finance está sendo executada **toda vez que a página carrega** e pode estar removendo transações de estoque indevidamente.

### Código Problemático

```typescript
// src/pages/Finance/index.tsx - linha 51
useEffect(() => {
  loadTransactions();
  cleanDuplicateTransactions(); // ❌ PROBLEMA AQUI
  syncSalesAsRevenue();
}, []);
```

A função `cleanDuplicateTransactions()` agrupa transações por `saleId` e remove duplicatas, mas as **transações de estoque não têm `saleId`**, então elas são tratadas separadamente e podem ser afetadas.

## ✅ SOLUÇÃO

Modificar a função `cleanDuplicateTransactions()` para **preservar transações de estoque**.

### Passo 1: Abrir o arquivo

```bash
src/pages/Finance/index.tsx
```

### Passo 2: Localizar a função `cleanDuplicateTransactions`

Procure pela linha ~90-150

### Passo 3: Substituir a função

**❌ CÓDIGO ATUAL:**

```typescript
const cleanDuplicateTransactions = async () => {
  if (!user) return;

  try {
    console.log('🧹 Limpando transações duplicadas...');
    
    const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
    if (!savedTransactions) return;
    
    let transactions = JSON.parse(savedTransactions);
    const originalCount = transactions.length;
    
    // Agrupar transações por saleId para identificar duplicatas
    const transactionsBySaleId = new Map();
    const transactionsWithoutSaleId: any[] = [];
    
    transactions.forEach((transaction: any) => {
      if (transaction.saleId) {
        if (!transactionsBySaleId.has(transaction.saleId)) {
          transactionsBySaleId.set(transaction.saleId, []);
        }
        transactionsBySaleId.get(transaction.saleId).push(transaction);
      } else {
        transactionsWithoutSaleId.push(transaction);
      }
    });
    
    // Manter apenas uma transação por venda (preferir a mais recente)
    const cleanedTransactions: any[] = [...transactionsWithoutSaleId];
    
    transactionsBySaleId.forEach((saleTransactions) => {
      if (saleTransactions.length > 1) {
        // Se há duplicatas, manter apenas a mais recente
        const mostRecent = saleTransactions.reduce((latest: any, current: any) => {
          const latestDate = new Date(latest.createdAt || latest.date);
          const currentDate = new Date(current.createdAt || current.date);
          return currentDate > latestDate ? current : latest;
        });
        cleanedTransactions.push(mostRecent);
        console.log(`🗑️ Removidas ${saleTransactions.length - 1} duplicatas para venda ${saleTransactions[0].saleId}`);
      } else {
        cleanedTransactions.push(saleTransactions[0]);
      }
    });
    
    if (cleanedTransactions.length < originalCount) {
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(cleanedTransactions));
      console.log(`✅ Limpeza concluída: ${originalCount - cleanedTransactions.length} duplicatas removidas`);
      toast.success(`${originalCount - cleanedTransactions.length} transações duplicadas foram removidas!`);
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar duplicatas:', error);
  }
};
```

**✅ CÓDIGO CORRIGIDO:**

```typescript
const cleanDuplicateTransactions = async () => {
  if (!user) return;

  try {
    console.log('🧹 Limpando transações duplicadas...');
    
    const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
    if (!savedTransactions) return;
    
    let transactions = JSON.parse(savedTransactions);
    const originalCount = transactions.length;
    
    // Separar transações por tipo
    const transactionsBySaleId = new Map();
    const transactionsWithoutSaleId: any[] = [];
    const stockTransactions: any[] = []; // ✅ NOVO: Transações de estoque
    
    transactions.forEach((transaction: any) => {
      // ✅ NOVO: Identificar e preservar transações de estoque
      if (transaction.stockGenerated || transaction.stockMovementGenerated) {
        stockTransactions.push(transaction);
      } else if (transaction.saleId) {
        if (!transactionsBySaleId.has(transaction.saleId)) {
          transactionsBySaleId.set(transaction.saleId, []);
        }
        transactionsBySaleId.get(transaction.saleId).push(transaction);
      } else {
        transactionsWithoutSaleId.push(transaction);
      }
    });
    
    // Manter apenas uma transação por venda (preferir a mais recente)
    const cleanedTransactions: any[] = [
      ...transactionsWithoutSaleId,
      ...stockTransactions // ✅ NOVO: Preservar TODAS as transações de estoque
    ];
    
    transactionsBySaleId.forEach((saleTransactions) => {
      if (saleTransactions.length > 1) {
        // Se há duplicatas, manter apenas a mais recente
        const mostRecent = saleTransactions.reduce((latest: any, current: any) => {
          const latestDate = new Date(latest.createdAt || latest.date);
          const currentDate = new Date(current.createdAt || current.date);
          return currentDate > latestDate ? current : latest;
        });
        cleanedTransactions.push(mostRecent);
        console.log(`🗑️ Removidas ${saleTransactions.length - 1} duplicatas para venda ${saleTransactions[0].saleId}`);
      } else {
        cleanedTransactions.push(saleTransactions[0]);
      }
    });
    
    if (cleanedTransactions.length < originalCount) {
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(cleanedTransactions));
      console.log(`✅ Limpeza concluída: ${originalCount - cleanedTransactions.length} duplicatas removidas`);
      console.log(`📦 Transações de estoque preservadas: ${stockTransactions.length}`); // ✅ NOVO
      toast.success(`${originalCount - cleanedTransactions.length} transações duplicadas foram removidas!`);
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
      console.log(`📦 Transações de estoque: ${stockTransactions.length}`); // ✅ NOVO
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar duplicatas:', error);
  }
};
```

## 🎯 O QUE FOI ALTERADO

### 1. ✅ Identificação de Transações de Estoque

```typescript
// ✅ NOVO: Array separado para transações de estoque
const stockTransactions: any[] = [];

// ✅ NOVO: Identificar transações de estoque pelos flags
if (transaction.stockGenerated || transaction.stockMovementGenerated) {
  stockTransactions.push(transaction);
}
```

### 2. ✅ Preservação de Transações de Estoque

```typescript
// ✅ NOVO: Incluir TODAS as transações de estoque no resultado final
const cleanedTransactions: any[] = [
  ...transactionsWithoutSaleId,
  ...stockTransactions // Preservar TODAS
];
```

### 3. ✅ Logs Melhorados

```typescript
console.log(`📦 Transações de estoque preservadas: ${stockTransactions.length}`);
```

## 🧪 COMO TESTAR

### Teste 1: Adicionar Produto com Estoque

1. Vá em **Estoque**
2. Clique em **Novo Produto**
3. Preencha:
   - Nome: "Produto Teste"
   - Preço de Custo: R$ 10,00
   - Preço de Venda: R$ 20,00
   - Quantidade: 5
4. Salve
5. Vá em **Financeiro**
6. ✅ Deve aparecer uma despesa de R$ 50,00 (5 x R$ 10,00)

### Teste 2: Movimentar Estoque (Entrada)

1. Vá em **Estoque**
2. Clique em **Movimentar** no produto
3. Selecione **Entrada**
4. Quantidade: 10
5. Motivo: "Compra adicional"
6. Confirme
7. Vá em **Financeiro**
8. ✅ Deve aparecer uma nova despesa de R$ 100,00 (10 x R$ 10,00)
9. ✅ A despesa anterior de R$ 50,00 deve continuar lá

### Teste 3: Recarregar Página

1. Estando em **Financeiro** com as despesas visíveis
2. Pressione **F5** para recarregar
3. ✅ Todas as despesas de estoque devem continuar visíveis
4. ✅ Não deve aparecer mensagem de "transações duplicadas removidas"

## 📊 VERIFICAÇÃO DE LOGS

Após a correção, ao recarregar a página de Financeiro, você deve ver no console:

```
🧹 Limpando transações duplicadas...
✅ Nenhuma duplicata encontrada
📦 Transações de estoque: 2
```

Ou se houver duplicatas de vendas:

```
🧹 Limpando transações duplicadas...
🗑️ Removidas 1 duplicatas para venda abc123
✅ Limpeza concluída: 1 duplicatas removidas
📦 Transações de estoque preservadas: 2
```

## ⚠️ IMPORTANTE

Esta correção **NÃO afeta**:
- ✅ Transações de vendas
- ✅ Transações manuais
- ✅ Sincronização de vendas
- ✅ Limpeza de duplicatas de vendas

Ela **APENAS preserva**:
- ✅ Transações com flag `stockGenerated`
- ✅ Transações com flag `stockMovementGenerated`

## 🔄 ALTERNATIVA: Desabilitar Limpeza Automática

Se preferir, você pode **desabilitar a limpeza automática** e executá-la manualmente:

```typescript
useEffect(() => {
  loadTransactions();
  // cleanDuplicateTransactions(); // ❌ COMENTAR ESTA LINHA
  syncSalesAsRevenue();
}, []);
```

E adicionar um botão manual na interface:

```typescript
<button onClick={cleanDuplicateTransactions}>
  🧹 Limpar Duplicatas
</button>
```

## 📝 RESUMO

**Problema:** Transações de estoque sendo removidas pela limpeza de duplicatas  
**Causa:** Função não identificava transações de estoque  
**Solução:** Identificar e preservar transações com flags `stockGenerated` ou `stockMovementGenerated`  
**Impacto:** Zero - apenas preserva transações que não deveriam ser removidas  
**Tempo:** 5 minutos para aplicar

---

**Status:** ✅ Correção pronta para aplicar  
**Prioridade:** 🔴 Alta (afeta funcionalidade principal)  
**Risco:** 🟢 Baixo (apenas adiciona proteção)

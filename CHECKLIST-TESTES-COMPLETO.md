# ✅ CHECKLIST DE TESTES COMPLETO

**Data:** 08/11/2025  
**Objetivo:** Validar todas as funcionalidades após correções

---

## 🔴 TESTES CRÍTICOS (FAZER PRIMEIRO)

### 1. ✅ Reset Completo do Sistema
```
[ ] Ir em Configurações
[ ] Clicar "Reset Sistema"
[ ] Digitar "RESETAR SISTEMA"
[ ] Confirmar
[ ] Verificar se TUDO foi apagado:
    [ ] Produtos (Firebase)
    [ ] Clientes (Firebase)
    [ ] Vendas (Firebase)
    [ ] Transações (localStorage)
[ ] Mensagem deve dizer "incluindo produtos"
```

**Resultado Esperado:** Sistema completamente limpo ✅

---

### 2. ✅ Criar Cliente
```
[ ] Ir em Clientes
[ ] Clicar "Novo Cliente"
[ ] Preencher:
    [ ] Nome: "Cliente Teste"
    [ ] Email: "teste@email.com"
    [ ] Telefone: "(21) 99999-9999"
[ ] Salvar
[ ] Verificar se aparece na lista
```

**Resultado Esperado:** Cliente criado com sucesso ✅

---

### 3. ✅ Criar Produto
```
[ ] Ir em Estoque
[ ] Clicar "Novo Produto"
[ ] Preencher:
    [ ] Nome: "Produto Teste"
    [ ] Preço de Custo: R$ 5,00
    [ ] Preço de Venda: R$ 10,00
    [ ] Quantidade: 50
    [ ] Estoque Mínimo: 5
[ ] Salvar
[ ] Verificar se aparece na lista
[ ] Verificar se valores estão corretos
```

**Resultado Esperado:** Produto criado com valores corretos ✅

---

### 4. ✅ Criar Venda com Produto do Estoque
```
[ ] Ir em Vendas
[ ] Clicar "Nova Venda"
[ ] Selecionar "Do Estoque"
[ ] Selecionar "Produto Teste"
[ ] VERIFICAR:
    [ ] Preço aparece automaticamente (R$ 10,00)
    [ ] Campo de preço fica desabilitado
    [ ] Fundo do campo fica cinza
    [ ] Mensagem verde: "Preço preenchido automaticamente"
[ ] Quantidade: 2
[ ] Forma de pagamento: Dinheiro
[ ] Salvar
[ ] Verificar:
    [ ] Venda criada
    [ ] Estoque diminuiu (50 → 48)
    [ ] Total correto (R$ 20,00)
```

**Resultado Esperado:** Venda criada e estoque atualizado ✅

---

## 🟡 TESTES IMPORTANTES (VERIFICAR DEPOIS)

### 5. ⚠️ Campos de Preço em Estoque
```
[ ] Ir em Estoque
[ ] Clicar "Novo Produto"
[ ] Deixar Preço de Custo vazio
[ ] Clicar fora do campo
[ ] VERIFICAR: Deve preencher com 0 ou 0.01?
```

**Possível Problema:** Campo usa `value={formData.costPrice || ''}` que pode mostrar vazio quando é 0

**Localização:** `src/pages/Stock/index.tsx` linhas 817 e 849

---

### 6. ⚠️ Campos de Valor em Finanças
```
[ ] Ir em Financeiro
[ ] Clicar "Nova Transação"
[ ] Deixar Valor vazio
[ ] Clicar fora do campo
[ ] VERIFICAR: Deve preencher automaticamente?
```

**Possível Problema:** Campo usa `value={formData.amount || ''}` 

**Localização:** `src/pages/Finance/index.tsx` linha 712

---

### 7. ⚠️ Pagamento de Fiado
```
[ ] Criar venda fiada
[ ] Ir em Fiados
[ ] Tentar pagar
[ ] VERIFICAR: Campo de valor funciona corretamente?
```

**Possível Problema:** Campo usa `value={paymentAmount || ''}`

**Localização:** `src/pages/Fiados/index.tsx` linha 673

---

## 🟢 TESTES COMPLEMENTARES

### 8. Exportar Backup
```
[ ] Ir em Configurações
[ ] Clicar "Exportar Backup"
[ ] Verificar arquivo JSON
[ ] Confirmar que contém:
    [ ] products (produtos)
    [ ] clients (clientes)
    [ ] sales (vendas)
    [ ] transactions (transações)
```

---

### 9. Importar Backup
```
[ ] Ter um arquivo de backup
[ ] Ir em Configurações
[ ] Clicar "Importar Backup"
[ ] Selecionar arquivo
[ ] Verificar se tudo foi restaurado
```

---

### 10. Verificar Dados
```
[ ] Ir em Configurações
[ ] Clicar "Verificar Dados"
[ ] Abrir console (F12)
[ ] Verificar se mostra:
    [ ] Produtos no Firebase
    [ ] Clientes no Firebase
    [ ] Vendas no Firebase
    [ ] Transações no localStorage
```

---

## 📊 PROBLEMAS POTENCIAIS ENCONTRADOS

### ⚠️ Problema 1: Campos de Preço em Estoque
**Arquivos:** `src/pages/Stock/index.tsx`  
**Linhas:** 817, 849

```typescript
// ATUAL (pode ter problema)
value={formData.costPrice || ''}
value={formData.salePrice || ''}

// DEVERIA SER
value={formData.costPrice === 0 ? '' : formData.costPrice}
value={formData.salePrice === 0 ? '' : formData.salePrice}
```

**Impacto:** Campos podem não mostrar valor 0 corretamente

---

### ⚠️ Problema 2: Campo de Valor em Finanças
**Arquivo:** `src/pages/Finance/index.tsx`  
**Linha:** 712

```typescript
// ATUAL (pode ter problema)
value={formData.amount || ''}

// DEVERIA SER
value={formData.amount === 0 ? '' : formData.amount}
```

**Impacto:** Campo pode não mostrar valor 0 corretamente

---

### ⚠️ Problema 3: Pagamento de Fiado
**Arquivo:** `src/pages/Fiados/index.tsx`  
**Linha:** 673

```typescript
// ATUAL (pode ter problema)
value={paymentAmount || ''}

// DEVERIA SER
value={paymentAmount === 0 ? '' : paymentAmount}
```

**Impacto:** Campo pode não mostrar valor 0 corretamente

---

## 🎯 PRIORIDADE DE CORREÇÃO

### 🔴 CRÍTICO (Se encontrar problema)
1. Campos de preço em Estoque
2. Campo de valor em Finanças

### 🟡 IMPORTANTE (Se encontrar problema)
3. Pagamento de Fiado

### 🟢 OPCIONAL
4. Outros campos numéricos

---

## 📝 ANOTAÇÕES DE TESTE

### Reset
- [ ] Funcionou? Sim / Não
- [ ] Produtos foram apagados? Sim / Não
- [ ] Observações: _______________

### Cliente
- [ ] Criou corretamente? Sim / Não
- [ ] Observações: _______________

### Produto
- [ ] Criou corretamente? Sim / Não
- [ ] Preços corretos? Sim / Não
- [ ] Observações: _______________

### Venda
- [ ] Preço preencheu automaticamente? Sim / Não
- [ ] Campo ficou desabilitado? Sim / Não
- [ ] Estoque atualizou? Sim / Não
- [ ] Observações: _______________

### Outros Problemas Encontrados
```
1. _______________
2. _______________
3. _______________
```

---

## 🚀 APÓS OS TESTES

### Se tudo estiver OK ✅
- Sistema está 100% funcional
- Pode usar em produção
- Monitorar uso dos usuários

### Se encontrar problemas ❌
- Anotar exatamente o que aconteceu
- Tirar screenshot se possível
- Reportar para correção imediata

---

**Checklist criado por:** Kiro AI  
**Data:** 08/11/2025  
**Status:** Aguardando testes do usuário

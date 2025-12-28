# 🚨 PROBLEMA: PAGAMENTO PREMIUM

**Data:** 08/11/2025  
**Status:** ❌ **PROBLEMA IDENTIFICADO**

---

## 🔴 PROBLEMA

Quando o usuário paga qualquer valor (R$ 20, R$ 40, R$ 200), o sistema ativa premium por **30 dias fixos**, independente do valor pago.

---

## 📊 COMPORTAMENTO ATUAL vs ESPERADO

### ❌ ATUAL (ERRADO)
```typescript
const activatePremiumSubscription = async () => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // ❌ SEMPRE 30 DIAS!
  
  // Não importa se pagou R$ 20 ou R$ 200
  // Sempre ativa por 30 dias
};
```

**Resultado:**
- Paga R$ 20 → 30 dias ❌
- Paga R$ 40 → 30 dias ❌ (deveria ser 60 dias)
- Paga R$ 200 → 30 dias ❌ (deveria ser 12 meses + 2 grátis)

---

### ✅ ESPERADO (CORRETO)

**Regra de Negócio:**
- R$ 20 = 1 mês (30 dias)
- R$ 40 = 2 meses (60 dias)
- R$ 60 = 3 meses (90 dias)
- ...
- R$ 200 = 12 meses + 2 meses GRÁTIS = 14 meses (420 dias)

**Fórmula:**
```
Valor Pago ÷ 20 = Meses
Meses × 30 = Dias

Promoção: Se pagar R$ 200 (10 meses), ganha 12 meses + 2 grátis
```

---

## 🛠️ SOLUÇÃO

### 1. Modificar `activatePremiumSubscription`

```typescript
const activatePremiumSubscription = async (amountPaid: number) => {
  if (!user) return;

  const now = new Date();
  const endDate = new Date();
  
  // Calcular dias baseado no valor pago
  let daysToAdd = 0;
  
  if (amountPaid >= 200) {
    // Promoção: R$ 200 = 12 meses + 2 grátis = 14 meses
    daysToAdd = 14 * 30; // 420 dias
  } else {
    // Regra normal: R$ 20 por mês
    const months = Math.floor(amountPaid / 20);
    daysToAdd = months * 30;
  }
  
  endDate.setDate(endDate.getDate() + daysToAdd);

  const premiumSubscription: UserSubscription = {
    plan: 'premium',
    status: 'active',
    startDate: now,
    endDate: endDate,
    trialUsed: true,
    paymentMethod: 'pix',
    lastPayment: now,
    amountPaid: amountPaid // ✅ Salvar valor pago
  };

  await setDoc(doc(db, 'subscriptions', user.uid), {
    ...premiumSubscription,
    startDate: now,
    endDate: endDate,
    lastPayment: now,
    amountPaid: amountPaid
  });

  setSubscription(premiumSubscription);
  
  const months = Math.floor(daysToAdd / 30);
  toast.success(`🎉 Premium ativado! Você tem ${months} ${months === 1 ? 'mês' : 'meses'} de acesso completo!`);
};
```

---

### 2. Modificar `PixPayment.tsx`

```typescript
const handlePaymentConfirmation = async () => {
  setLoading(true);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ✅ Passar o valor pago
    await activatePremiumSubscription(amount);
    
    const months = Math.floor(amount / 20);
    const isPromo = amount >= 200;
    
    if (isPromo) {
      toast.success('🎉 Pagamento confirmado! Premium ativado por 14 meses (12 + 2 grátis)!');
    } else {
      toast.success(`🎉 Pagamento confirmado! Premium ativado por ${months} ${months === 1 ? 'mês' : 'meses'}!`);
    }
    
    onSuccess?.();
  } catch (error) {
    toast.error('Erro ao ativar premium. Tente novamente.');
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Atualizar Interface `SubscriptionContextType`

```typescript
interface SubscriptionContextType {
  // ... outros campos
  activatePremiumSubscription: (amountPaid: number) => Promise<void>; // ✅ Adicionar parâmetro
}
```

---

### 4. Atualizar Interface `UserSubscription`

```typescript
interface UserSubscription {
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: Date;
  endDate: Date;
  trialUsed: boolean;
  paymentMethod?: string;
  lastPayment?: Date;
  amountPaid?: number; // ✅ Adicionar campo
}
```

---

## 📊 TABELA DE VALORES

| Valor Pago | Meses | Dias | Observação |
|------------|-------|------|------------|
| R$ 20 | 1 | 30 | Plano mensal |
| R$ 40 | 2 | 60 | 2 meses |
| R$ 60 | 3 | 90 | 3 meses |
| R$ 80 | 4 | 120 | 4 meses |
| R$ 100 | 5 | 150 | 5 meses |
| R$ 120 | 6 | 180 | 6 meses |
| R$ 140 | 7 | 210 | 7 meses |
| R$ 160 | 8 | 240 | 8 meses |
| R$ 180 | 9 | 270 | 9 meses |
| R$ 200 | **14** | **420** | **🎁 Promoção: 12 + 2 grátis!** |

---

## 🎁 LÓGICA DA PROMOÇÃO

```typescript
if (amountPaid >= 200) {
  // Promoção especial
  daysToAdd = 14 * 30; // 420 dias (14 meses)
  message = "🎉 Promoção! 12 meses + 2 GRÁTIS!";
} else {
  // Cálculo normal
  const months = Math.floor(amountPaid / 20);
  daysToAdd = months * 30;
  message = `✅ ${months} ${months === 1 ? 'mês' : 'meses'} de Premium!`;
}
```

---

## 🧪 TESTES NECESSÁRIOS

### Teste 1: Pagamento R$ 20
```
1. Pagar R$ 20
2. Verificar: 30 dias de premium ✅
3. Mensagem: "1 mês de acesso"
```

### Teste 2: Pagamento R$ 40
```
1. Pagar R$ 40
2. Verificar: 60 dias de premium ✅
3. Mensagem: "2 meses de acesso"
```

### Teste 3: Pagamento R$ 200 (Promoção)
```
1. Pagar R$ 200
2. Verificar: 420 dias de premium ✅
3. Mensagem: "14 meses (12 + 2 grátis)"
```

### Teste 4: Pagamento R$ 35
```
1. Pagar R$ 35
2. Verificar: 30 dias (1 mês) ✅
3. Mensagem: "1 mês de acesso"
4. Nota: R$ 15 não dá outro mês
```

---

## ⚠️ CONSIDERAÇÕES

### Valores Quebrados
Se o usuário pagar R$ 35:
- R$ 35 ÷ 20 = 1.75 meses
- `Math.floor(1.75)` = 1 mês
- Resultado: 30 dias

**Alternativa:** Arredondar para cima?
```typescript
const months = Math.ceil(amountPaid / 20); // Arredonda para cima
```

Mas isso pode ser injusto para o negócio. Recomendo manter `Math.floor`.

---

### Renovação
Quando o usuário renovar:
- Adicionar dias ao `endDate` atual (se ainda ativo)
- Ou criar novo período (se expirado)

```typescript
if (subscription && subscription.status === 'active' && subscription.endDate > now) {
  // Adicionar ao período atual
  endDate = new Date(subscription.endDate);
  endDate.setDate(endDate.getDate() + daysToAdd);
} else {
  // Novo período
  endDate = new Date();
  endDate.setDate(endDate.getDate() + daysToAdd);
}
```

---

## 🎯 IMPLEMENTAÇÃO

Vou implementar todas as correções agora!

---

**Problema identificado por:** Kiro AI  
**Data:** 08/11/2025  
**Status:** Aguardando implementação

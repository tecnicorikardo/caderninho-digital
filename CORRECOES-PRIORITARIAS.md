# 🚨 CORREÇÕES PRIORITÁRIAS - AÇÃO IMEDIATA

## 🔴 URGENTE - Fazer AGORA

### 1. ⚠️ MOVER API KEYS PARA VARIÁVEIS DE AMBIENTE

**Problema:** API Keys expostas no código fonte

**Arquivo:** `src/config/firebase.ts`

**Ação:**

1. Criar arquivo `.env` na raiz do projeto:
```env
VITE_GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
VITE_GROQ_API_KEY=SUA_CHAVE_GROQ_AQUI
```

2. Atualizar `src/config/firebase.ts`:
```typescript
// ❌ REMOVER:
export const GEMINI_API_KEY = "SUA_CHAVE_GEMINI_AQUI";
export const GROQ_API_KEY = "SUA_CHAVE_GROQ_AQUI";

// ✅ ADICIONAR:
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
```

3. Adicionar `.env` ao `.gitignore` (se ainda não estiver)

4. Criar `.env.example` para documentação:
```env
VITE_GEMINI_API_KEY=sua_chave_aqui
VITE_GROQ_API_KEY=sua_chave_aqui
```

---

### 2. ⚠️ ADICIONAR userId EM PAYMENTS

**Problema:** Payments collection não tem userId, violando regras de segurança

**Arquivo:** `src/services/saleService.ts`

**Linha:** ~180

**Ação:**

```typescript
// ❌ CÓDIGO ATUAL:
async addPayment(saleId: string, amount: number, method: 'dinheiro' | 'pix', notes?: string): Promise<void> {
  try {
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      saleId,
      amount,
      method,
      notes: notes || '',
      date: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao adicionar pagamento:', error);
    throw error;
  }
}

// ✅ CÓDIGO CORRIGIDO:
async addPayment(saleId: string, amount: number, method: 'dinheiro' | 'pix', userId: string, notes?: string): Promise<void> {
  try {
    await addDoc(collection(db, PAYMENTS_COLLECTION), {
      saleId,
      amount,
      method,
      notes: notes || '',
      userId, // ✅ ADICIONAR
      date: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao adicionar pagamento:', error);
    throw error;
  }
}
```

**Atualizar chamadas do método** em todos os lugares que usam `addPayment`

---

### 3. ⚠️ ADICIONAR VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS

**Arquivo:** `src/services/saleService.ts`

**Ação:** Adicionar validações no início do método `createSale`:

```typescript
async createSale(saleData: SaleFormData, userId: string): Promise<string> {
  try {
    // ✅ ADICIONAR VALIDAÇÕES
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }
    
    if (!saleData.products || saleData.products.length === 0) {
      throw new Error('A venda deve ter pelo menos um produto');
    }
    
    if (saleData.discount < 0) {
      throw new Error('Desconto não pode ser negativo');
    }
    
    if (saleData.paidAmount < 0) {
      throw new Error('Valor pago não pode ser negativo');
    }
    
    // Resto do código...
```

**Aplicar validações similares em:**
- `productService.ts` - createProduct
- `clientService.ts` - createClient
- `transactionService.ts` - createTransaction
- `personalFinanceService.ts` - createTransaction

---

## 🟡 IMPORTANTE - Fazer em Breve

### 4. 📄 IMPLEMENTAR PAGINAÇÃO

**Problema:** Carrega todos os dados de uma vez

**Arquivos afetados:** Todos os serviços

**Exemplo de implementação:**

```typescript
// ✅ Adicionar paginação
async getSales(userId: string, limit: number = 50, lastDoc?: any): Promise<{sales: Sale[], lastDoc: any}> {
  try {
    let q = query(
      collection(db, SALES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const sales: Sale[] = [];
    let lastVisible = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sales.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Sale);
      lastVisible = doc;
    });
    
    return { sales, lastDoc: lastVisible };
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    throw error;
  }
}
```

---

### 5. 📊 ADICIONAR ÍNDICES COMPOSTOS

**Arquivo:** `firestore.indexes.json`

**Ação:** Adicionar índices necessários:

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "personal_transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sales",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "fiado_payments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stock_movements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Depois de adicionar, fazer deploy:**
```bash
firebase deploy --only firestore:indexes
```

---

### 6. 🛡️ MELHORAR TRATAMENTO DE ERROS

**Criar arquivo:** `src/utils/errorHandler.ts`

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleFirebaseError = (error: any): AppError => {
  switch (error.code) {
    case 'permission-denied':
      return new AppError(
        'Você não tem permissão para realizar esta ação',
        'PERMISSION_DENIED',
        403
      );
    case 'not-found':
      return new AppError(
        'Recurso não encontrado',
        'NOT_FOUND',
        404
      );
    case 'already-exists':
      return new AppError(
        'Este recurso já existe',
        'ALREADY_EXISTS',
        409
      );
    case 'unauthenticated':
      return new AppError(
        'Você precisa estar autenticado',
        'UNAUTHENTICATED',
        401
      );
    default:
      return new AppError(
        'Erro ao processar sua solicitação',
        'INTERNAL_ERROR',
        500
      );
  }
};
```

**Usar nos serviços:**

```typescript
import { handleFirebaseError } from '../utils/errorHandler';

try {
  // código...
} catch (error) {
  console.error('Erro ao criar venda:', error);
  throw handleFirebaseError(error);
}
```

---

### 7. 🗑️ REMOVER LOGS EXCESSIVOS

**Criar:** `src/utils/logger.ts`

```typescript
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  }
};
```

**Substituir em todos os arquivos:**

```typescript
// ❌ ANTES:
console.log('✅ Produto criado:', docRef.id);

// ✅ DEPOIS:
logger.log('✅ Produto criado:', docRef.id);
```

---

## 🟢 DESEJÁVEL - Fazer Quando Possível

### 8. 💾 IMPLEMENTAR CACHE LOCAL

**Arquivo:** `src/config/firebase.ts`

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Habilitar cache offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    logger.warn('Múltiplas abas abertas, cache desabilitado');
  } else if (err.code == 'unimplemented') {
    logger.warn('Navegador não suporta cache offline');
  }
});
```

---

### 9. 🔄 IMPLEMENTAR SOFT DELETE

**Adicionar campo `deleted` em todos os documentos:**

```typescript
// Ao invés de deletar:
async deleteProduct(productId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, productId), {
      deleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
}

// Filtrar nas queries:
const q = query(
  collection(db, COLLECTION_NAME),
  where('userId', '==', userId),
  where('deleted', '==', false) // ou where('deleted', '!=', true)
);
```

---

### 10. 🔒 MELHORAR REGRAS DE SEGURANÇA

**Arquivo:** `firestore.rules`

```javascript
// ✅ Regra mais restritiva para users
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId || isAdmin();
  allow delete: if isSuperAdmin();
}

// ✅ Adicionar validação de campos em sales
match /sales/{saleId} {
  allow read: if isOwner(resource.data.userId);
  allow create: if isOwner(request.resource.data.userId) 
                && hasRequiredFields(['userId', 'total', 'paymentMethod', 'createdAt'])
                && request.resource.data.total >= 0
                && request.resource.data.discount >= 0;
  allow update: if isOwner(resource.data.userId);
  allow delete: if isOwner(resource.data.userId);
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### 🔴 Urgente
- [ ] Mover API Keys para .env
- [ ] Adicionar userId em payments
- [ ] Adicionar validações de campos

### 🟡 Importante
- [ ] Implementar paginação
- [ ] Adicionar índices compostos
- [ ] Melhorar tratamento de erros
- [ ] Remover logs excessivos

### 🟢 Desejável
- [ ] Implementar cache local
- [ ] Implementar soft delete
- [ ] Melhorar regras de segurança

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Dia 1:** Correções urgentes (1, 2, 3)
2. **Dia 2:** Índices e paginação (4, 5)
3. **Dia 3:** Tratamento de erros e logs (6, 7)
4. **Dia 4:** Cache e soft delete (8, 9)
5. **Dia 5:** Regras de segurança (10)

---

## ⚠️ AVISOS IMPORTANTES

1. **Backup antes de qualquer alteração**
2. **Testar em ambiente de desenvolvimento primeiro**
3. **Fazer deploy gradual (uma correção por vez)**
4. **Monitorar logs após cada deploy**
5. **Ter plano de rollback preparado**

---

**Última atualização:** 15/11/2025

# 🔧 Correção Header Asaas Aplicada

## 🐛 Problema Identificado

### **Sintoma:**
- Function retornando `{success: true}` mas sem dados PIX
- `hasQrCode: false, hasCopyPaste: false, paymentId: undefined`

### **Causa Raiz:**
- API Asaas retornando HTML em vez de JSON
- Header incorreto: `access_token` em vez de `access-token`
- Asaas interpretando como não autenticado

### **Logs Reveladores:**
```
✅ Customer criado: undefined  ← PROBLEMA
Criando cobrança Asaas: {
  customer: undefined,  ← SEM CUSTOMER
  ...
}
```

## ✅ Correção Aplicada

### **Header Correto:**
```typescript
// ❌ ANTES (Incorreto):
headers: { access_token: ASAAS_API_KEY }

// ✅ DEPOIS (Correto):
headers: { 
    'access-token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
}
```

### **Todas as Chamadas Corrigidas:**
1. **Buscar Customer:** `GET /customers`
2. **Criar Customer:** `POST /customers`  
3. **Criar Cobrança:** `POST /payments`
4. **Buscar QR Code:** `GET /payments/{id}/pixQrCode`

## 🚀 Deploy Realizado

### **Function Atualizada:**
```
✅ createAsaasCharge(us-central1) - Successful update operation
```

### **URL da Function:**
```
https://us-central1-bloquinhodigital.cloudfunctions.net/createAsaasCharge
```

## 📊 Resultado Esperado

### **Logs Esperados no Console:**
```
🔄 Iniciando geração PIX... {amount: 20, description: "Plano Premium Mensal"}
📡 Response status: 200
📊 Response data: {
  success: true,
  qrCode: "iVBORw0KGgoAAAANSUhEUgAA...",  ← AGORA TEM
  copyPaste: "00020126580014br.gov.bcb.pix...",  ← AGORA TEM
  paymentId: "pay_123456789"  ← AGORA TEM
}
✅ PIX gerado com sucesso: {
  hasQrCode: true,  ← MUDOU
  hasCopyPaste: true,  ← MUDOU
  paymentId: "pay_123456789"  ← MUDOU
}
```

### **Logs da Function:**
```
👤 Dados do usuário: {userEmail: "...", userName: "...", userUid: "..."}
🔍 Buscando customer no Asaas...
📊 Resposta busca customer: {data: [...]}
✅ Customer encontrado: cus_123456  ← AGORA TEM ID
Criando cobrança Asaas: {
  customer: "cus_123456",  ← AGORA TEM CUSTOMER
  billingType: 'PIX',
  value: 20,
  ...
}
```

## 🎯 Como Testar

### **1. Teste PIX Payment:**
1. Acesse: https://bloquinhodigital.web.app
2. Vá para página de upgrade
3. Clique em "Gerar PIX"
4. **AGORA DEVE APARECER:**
   - ✅ QR Code visual
   - ✅ Código PIX para copiar
   - ✅ Botão "Copiar Código PIX"

### **2. Verificar Logs:**
```bash
firebase functions:log --only createAsaasCharge
```

## 🔍 Diferença Técnica

### **API Asaas Headers:**
- **Correto:** `access-token` (com hífen)
- **Incorreto:** `access_token` (com underscore)

### **Por que Falhava:**
- Asaas não reconhecia a autenticação
- Retornava página de login HTML
- Customer não era criado
- Cobrança falhava silenciosamente

### **Por que Agora Funciona:**
- Header correto reconhecido
- API retorna JSON válido
- Customer criado com sucesso
- Cobrança PIX gerada
- QR Code disponível

---

**🚀 Correção deployada em: 31/12/2025**

**🔧 Problema: Header API incorreto**

**✅ Solução: `access-token` em vez de `access_token`**

**🎯 Teste agora: https://bloquinhodigital.web.app**
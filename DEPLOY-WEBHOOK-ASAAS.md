# 🔗 Deploy Webhook Asaas - Guia Completo

## ✅ Webhook Implementado!

O webhook do Asaas já está implementado no código e pronto para deploy.

## 🚀 Passos para Deploy

### 1. **Fazer Deploy das Functions**
Abra o terminal e execute:
```bash
firebase deploy --only functions
```

### 2. **Pegar a URL da Function**
Após o deploy, você verá uma URL similar a:
```
https://us-central1-bloquinhodigital.cloudfunctions.net/handleAsaasWebhook
```

**⚠️ IMPORTANTE:** Anote essa URL, você vai precisar dela!

## 🔧 Configurar no Asaas

### 3. **Acessar Configurações de Webhook**
1. Entre no painel do Asaas
2. Vá em **Configurações** → **Webhooks**
3. Clique em **"Adicionar Webhook"**

### 4. **Configurar o Webhook**

**URL do Webhook:**
```
https://us-central1-bloquinhodigital.cloudfunctions.net/handleAsaasWebhook
```
*(Substitua pela URL que apareceu no seu deploy)*

**Token de Autenticação:**
```
ab123456-7890-abcd-ef12-34567890abcdef-bloquinho-secret
```

**Eventos para Habilitar:**
- ✅ **PAYMENT_CONFIRMED** (Pagamento Confirmado)
- ✅ **PAYMENT_RECEIVED** (Pagamento Recebido)

**Método HTTP:** POST

**Headers (se solicitado):**
- **Nome:** `asaas-access-token`
- **Valor:** `ab123456-7890-abcd-ef12-34567890abcdef-bloquinho-secret`

## 🔍 Como Funciona

### **Fluxo Automático:**
1. **Cliente paga** via Asaas (PIX, boleto, cartão)
2. **Asaas envia webhook** para sua function
3. **System atualiza automaticamente:**
   - Status da venda (pendente → pago)
   - Valor pago na venda
   - Registro de pagamento

### **Requisitos Importantes:**
- **Referência Externa:** Ao criar cobrança no Asaas, o campo "External Reference" deve conter o **ID da Venda** do seu sistema
- **Segurança:** Token de autenticação protege contra acessos não autorizados

## 📊 Exemplo de Uso

### **Cenário:**
1. Você cria uma venda no sistema (ID: `abc123`)
2. Cria cobrança no Asaas com **External Reference:** `abc123`
3. Cliente paga via PIX
4. **Automaticamente:**
   - Venda `abc123` fica como "pago"
   - Registro de pagamento é criado
   - Sistema atualizado em tempo real

## 🧪 Testar Webhook

### **Teste Manual:**
1. Crie uma venda no sistema
2. Anote o ID da venda
3. No Asaas, crie cobrança com External Reference = ID da venda
4. Simule pagamento no ambiente de teste do Asaas
5. Verifique se a venda foi atualizada no sistema

### **Logs para Monitorar:**
No Firebase Console → Functions → Logs:
```
🔔 Evento Webhook Asaas recebido: PAYMENT_CONFIRMED
💸 Pagamento confirmado para venda abc123
✅ Venda abc123 atualizada para pago. Pago: 100.00
```

## ⚠️ Troubleshooting

### **Webhook não funciona:**
- Verifique se a URL está correta
- Confirme se o token está configurado
- Veja os logs no Firebase Console

### **Venda não atualiza:**
- Verifique se External Reference = ID da venda
- Confirme se a venda existe no sistema
- Veja se os eventos estão habilitados

### **Erro 401 (Unauthorized):**
- Token de autenticação incorreto
- Verifique header `asaas-access-token`

## 🎯 Benefícios da Integração

### **Automação Completa:**
- ✅ **Sem intervenção manual** para marcar pagamentos
- ✅ **Atualização em tempo real** do status das vendas
- ✅ **Histórico completo** de pagamentos
- ✅ **Reconciliação automática** entre Asaas e sistema

### **Melhor Experiência:**
- ✅ **Cliente paga** e venda é atualizada automaticamente
- ✅ **Relatórios precisos** com dados reais de pagamento
- ✅ **Controle financeiro** mais eficiente

## 🚀 Próximos Passos

1. **Execute o deploy:** `firebase deploy --only functions`
2. **Copie a URL** da function gerada
3. **Configure no Asaas** com URL e token
4. **Teste** com uma venda real
5. **Monitore logs** para confirmar funcionamento

---

**🎉 Resultado:** Pagamentos do Asaas atualizarão automaticamente as vendas no seu sistema!

**💡 Dica:** Sempre use o ID da venda como External Reference no Asaas para a integração funcionar corretamente.
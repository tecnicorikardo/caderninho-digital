# 🧪 TESTE DO SISTEMA DE MENSAGENS

## ✅ Como testar se está funcionando:

### 1️⃣ **Verificar no Console do Navegador**

Abra o sistema e pressione **F12**, depois vá na aba **Console**.

Se aparecer algum erro relacionado a "notifications" ou "index", significa que o índice ainda está sendo criado pelo Firebase (pode levar alguns minutos).

---

### 2️⃣ **Testar envio de mensagem (Admin)**

1. Acesse: https://web-gestao-37a85.web.app/admin
2. Clique no botão **"📧 Enviar Mensagem"** (no topo da página)
3. Preencha:
   - Destinatário: "Usuário específico" ou "Todos os usuários"
   - Título: "Teste de mensagem"
   - Mensagem: "Esta é uma mensagem de teste"
4. Clique em **"📧 Enviar Mensagem"**
5. Deve aparecer: "✅ Mensagem enviada para X usuário(s)!"

---

### 3️⃣ **Verificar recebimento (Usuário)**

1. Acesse: https://web-gestao-37a85.web.app
2. Olhe no header, ao lado do seu nome
3. Deve aparecer um **🔔** (sino)
4. Se tiver mensagem, aparece um **badge vermelho** com número
5. Clique no sino para ver as mensagens

---

### 4️⃣ **Verificar no Firebase Console**

Se não aparecer nada, verifique se as mensagens estão sendo criadas:

1. Acesse: https://console.firebase.google.com/project/web-gestao-37a85
2. Vá em **Firestore Database**
3. Procure a coleção **"notifications"**
4. Deve ter documentos com:
   - `userId`: ID do usuário
   - `title`: Título da mensagem
   - `message`: Conteúdo
   - `read`: false
   - `createdAt`: timestamp

---

## 🔧 **Se não funcionar:**

### Problema 1: Botão não aparece no Admin
**Solução:** Limpe o cache (Ctrl + Shift + R)

### Problema 2: Sino não aparece no Dashboard
**Solução:** Limpe o cache (Ctrl + Shift + R)

### Problema 3: Erro no console sobre "index"
**Solução:** Aguarde 5-10 minutos para o Firebase criar o índice automaticamente

### Problema 4: Mensagem não chega
**Solução:** 
1. Verifique se a mensagem foi criada no Firestore
2. Verifique se o `userId` está correto
3. Faça logout e login novamente

---

## 📸 **Tire prints se precisar de ajuda:**

1. Print do painel admin (com botão de mensagem)
2. Print do dashboard (com sino)
3. Print do console do navegador (F12)
4. Print do Firestore (coleção notifications)

---

**Última atualização:** 09/11/2025

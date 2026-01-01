# 🔧 Configurar Email no Firebase (Plano Blaze)

## ✅ Status Atual
- ✅ Hosting atualizado com botão "📧 Enviar Email"
- ✅ Firebase Functions criadas e prontas
- ⚠️ Precisa configurar conta de cobrança e email

## 🚨 Problema Identificado
```
Error: Write access to project 'bloquinhodigital' was denied: 
please check billing account associated and retry
```

## 📋 Passos para Resolver

### 1. Verificar Conta de Cobrança
1. Acesse: https://console.firebase.google.com/project/bloquinhodigital
2. Vá em **Configurações** → **Uso e faturamento**
3. Certifique-se que o **Plano Blaze** está ativo
4. Verifique se há uma conta de cobrança válida associada

### 2. Configurar Email para Envio
Você precisa configurar as credenciais de email nas Firebase Functions:

#### Opção A: Usar o Script Automático
```bash
# Execute o arquivo que está aberto no seu editor:
configure-email-firebase.bat
```

#### Opção B: Configurar Manualmente
```bash
# Substitua pelos seus dados reais:
firebase functions:config:set email.user="seuemail@gmail.com"
firebase functions:config:set email.password="sua-senha-de-app"
```

### 3. Como Criar Senha de App no Gmail
1. Acesse **Configurações do Gmail**
2. Vá na aba **Segurança**
3. Ative **Verificação em duas etapas** (se não estiver ativa)
4. Procure por **Senhas de app**
5. Gere uma senha para **"Aplicativo personalizado"**
6. Use essa senha (não sua senha normal do Gmail)

### 4. Fazer Deploy das Functions
Após configurar o email:
```bash
firebase deploy --only functions
```

### 5. Testar o Sistema
1. Acesse: https://bloquinhodigital.web.app
2. Vá em **Relatórios**
3. Clique em **"📧 Enviar por Email"**
4. Teste o botão **"📧 Enviar Email"** (agora envia direto)

## 🔍 Como Funciona Agora

### Fluxo de Envio:
1. **1ª Tentativa:** Envio direto via Firebase Functions (servidor)
2. **2ª Tentativa:** Fallback para mailto (abre cliente de email)
3. **3ª Tentativa:** Copia para área de transferência

### Vantagens do Envio Direto:
- ✅ Email enviado automaticamente
- ✅ HTML formatado profissionalmente
- ✅ Não depende do cliente de email do usuário
- ✅ Funciona em qualquer dispositivo

## 🧪 Logs para Monitorar

Abra o Console do Navegador (F12) e procure por:
```
1️⃣ Tentando envio via servidor...
✅ Email enviado com sucesso via servidor!
```

Se der erro:
```
⚠️ Falha no envio via servidor. Tentando fallback local...
```

## 📞 Suporte

Se continuar com problemas:
1. Verifique se o plano Blaze está realmente ativo
2. Confirme se a conta de cobrança tem saldo/cartão válido
3. Teste primeiro com o script `configure-email-firebase.bat`
4. Verifique os logs no Firebase Console

## 🎯 Próximos Passos

1. **Configure a conta de cobrança** no Firebase Console
2. **Execute o script** `configure-email-firebase.bat`
3. **Faça o deploy** das functions: `firebase deploy --only functions`
4. **Teste o envio** de email nos relatórios

O sistema está pronto, só precisa da configuração final! 🚀
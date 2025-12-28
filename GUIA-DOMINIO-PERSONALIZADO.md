# 🌐 GUIA - DOMÍNIO PERSONALIZADO

**Objetivo:** Mudar de `web-gestao-37a85.web.app` para algo melhor

---

## 🎯 OPÇÃO 1: Criar Novo Projeto Firebase (GRATUITO)

### Vantagens
- ✅ 100% Gratuito
- ✅ Rápido (5 minutos)
- ✅ Domínio melhor: `caderninho-digital.web.app`
- ✅ Mantém tudo no Firebase

### Passo a Passo

#### 1. Criar Novo Projeto
1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Nome do projeto: **caderninho-digital**
4. ID do projeto será: `caderninho-digital` (ou similar)
5. Aceite os termos e crie

#### 2. Configurar Firebase no Projeto

**2.1 Copiar Configuração:**
1. No novo projeto, vá em: Configurações do projeto (⚙️)
2. Role até "Seus apps"
3. Clique no ícone Web `</>`
4. Registre o app: "Caderninho Digital"
5. Copie a configuração

**2.2 Atualizar arquivo `src/config/firebase.ts`:**
```typescript
const firebaseConfig = {
  apiKey: "SUA_NOVA_API_KEY",
  authDomain: "caderninho-digital.firebaseapp.com",
  projectId: "caderninho-digital",
  storageBucket: "caderninho-digital.appspot.com",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};
```

#### 3. Configurar Firestore e Authentication

**3.1 Ativar Firestore:**
1. No console, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Modo de produção"
4. Selecione localização: `southamerica-east1` (São Paulo)

**3.2 Ativar Authentication:**
1. Vá em "Authentication"
2. Clique em "Começar"
3. Ative "Email/senha"

**3.3 Copiar Regras do Firestore:**
```bash
# Copiar arquivo de regras
firebase use caderninho-digital
firebase deploy --only firestore:rules
```

#### 4. Fazer Deploy

```bash
# Selecionar novo projeto
firebase use caderninho-digital

# Build
npm run build

# Deploy completo
firebase deploy
```

#### 5. Resultado

**Nova URL:** `https://caderninho-digital.web.app` ✨

---

## 🎯 OPÇÃO 2: Domínio Próprio (Recomendado para Profissional)

### Vantagens
- ✅ Domínio profissional: `caderninhodigital.com.br`
- ✅ Mais credibilidade
- ✅ Melhor para marketing
- ✅ Fácil de lembrar

### Custo
- 💰 R$ 40-60/ano (registro.br)
- 💰 R$ 50-100/ano (outros registradores)

### Passo a Passo

#### 1. Comprar Domínio

**Opções de Registradores:**
- **Registro.br** (recomendado para .br): https://registro.br
  - `caderninhodigital.com.br`
  - `caderninho.digital`
  - `caderninho.app.br`

- **Hostinger**: https://hostinger.com.br
- **GoDaddy**: https://godaddy.com
- **Namecheap**: https://namecheap.com

**Sugestões de Domínios:**
- ✅ `caderninhodigital.com.br`
- ✅ `caderninho.digital`
- ✅ `caderninho.app.br`
- ✅ `meucaderninho.com.br`
- ✅ `caderninhoapp.com.br`

#### 2. Conectar ao Firebase Hosting

**2.1 No Firebase Console:**
1. Vá em "Hosting"
2. Clique em "Adicionar domínio personalizado"
3. Digite seu domínio: `caderninhodigital.com.br`
4. Clique em "Continuar"

**2.2 Firebase vai fornecer registros DNS:**
```
Tipo: A
Nome: @
Valor: 151.101.1.195

Tipo: A
Nome: @
Valor: 151.101.65.195

Tipo: TXT
Nome: @
Valor: [código de verificação]
```

**2.3 Configurar no Registrador:**
1. Acesse o painel do seu registrador
2. Vá em "Gerenciar DNS" ou "Zona DNS"
3. Adicione os registros fornecidos pelo Firebase
4. Salve as alterações

**2.4 Aguardar Propagação:**
- Tempo: 24-48 horas (geralmente 1-2 horas)
- Firebase configura SSL automaticamente
- Você receberá email quando estiver pronto

#### 3. Resultado

**Seu domínio:** `https://caderninhodigital.com.br` ✨

---

## 🎯 OPÇÃO 3: Subdomínio Gratuito (Alternativa)

Use serviços que oferecem subdomínios gratuitos:

### Opções Gratuitas:
1. **Vercel** - `caderninho-digital.vercel.app`
2. **Netlify** - `caderninho-digital.netlify.app`
3. **GitHub Pages** - `seuusuario.github.io/caderninho-digital`

**Mas:** Você perderia a integração perfeita com Firebase!

---

## 📊 COMPARAÇÃO DAS OPÇÕES

| Opção | Custo | Tempo | Domínio | Recomendação |
|-------|-------|-------|---------|--------------|
| Novo Projeto Firebase | Grátis | 5 min | `caderninho-digital.web.app` | ⭐⭐⭐ Bom |
| Domínio Próprio | R$ 40-60/ano | 1-2 dias | `caderninhodigital.com.br` | ⭐⭐⭐⭐⭐ Melhor |
| Subdomínio Gratuito | Grátis | 10 min | `caderninho.vercel.app` | ⭐⭐ OK |

---

## 🎯 RECOMENDAÇÃO

### Para Começar (Agora)
**OPÇÃO 1** - Criar novo projeto Firebase
- Rápido e gratuito
- Domínio melhor que o atual
- Mantém tudo integrado

### Para Profissionalizar (Depois)
**OPÇÃO 2** - Comprar domínio próprio
- Mais profissional
- Melhor para marketing
- Fácil de lembrar e compartilhar

---

## 🚀 PASSO A PASSO RÁPIDO (OPÇÃO 1)

### 1. Criar Projeto
```bash
# No Firebase Console
# Criar projeto: caderninho-digital
```

### 2. Atualizar Configuração
```bash
# Editar src/config/firebase.ts
# Colar nova configuração
```

### 3. Configurar Serviços
```bash
# Ativar Firestore
# Ativar Authentication
# Copiar regras
```

### 4. Deploy
```bash
firebase use caderninho-digital
npm run build
firebase deploy
```

### 5. Pronto!
**Nova URL:** https://caderninho-digital.web.app ✨

---

## 💡 DICAS

### Migração de Dados
Se você já tem usuários no projeto antigo:
1. Exporte dados do Firestore antigo
2. Importe no novo projeto
3. Ou mantenha ambos funcionando

### Redirecionamento
Você pode manter o domínio antigo redirecionando para o novo:
```html
<!-- No index.html do projeto antigo -->
<meta http-equiv="refresh" content="0; url=https://caderninho-digital.web.app">
```

### Domínio Personalizado no Firebase
É muito fácil! Firebase cuida de:
- ✅ Certificado SSL (HTTPS)
- ✅ CDN global
- ✅ Renovação automática
- ✅ Redirecionamento www

---

## 📞 PRÓXIMOS PASSOS

### Opção 1 (Gratuito - 5 minutos)
1. Criar projeto `caderninho-digital`
2. Atualizar configuração
3. Deploy
4. Pronto!

### Opção 2 (Profissional - 1-2 dias)
1. Comprar domínio
2. Configurar DNS
3. Conectar ao Firebase
4. Aguardar propagação
5. Pronto!

---

## ✅ CHECKLIST

### Para Novo Projeto Firebase
- [ ] Criar projeto no Firebase Console
- [ ] Copiar configuração
- [ ] Atualizar `src/config/firebase.ts`
- [ ] Ativar Firestore
- [ ] Ativar Authentication
- [ ] Copiar regras do Firestore
- [ ] Fazer build
- [ ] Fazer deploy
- [ ] Testar nova URL

### Para Domínio Próprio
- [ ] Escolher nome do domínio
- [ ] Verificar disponibilidade
- [ ] Comprar domínio
- [ ] Adicionar no Firebase Hosting
- [ ] Configurar DNS
- [ ] Aguardar propagação
- [ ] Verificar SSL
- [ ] Testar domínio

---

**Criado por:** Kiro AI  
**Data:** 08/11/2025

**Recomendação:** Comece com a Opção 1 (gratuito) e depois migre para domínio próprio quando quiser profissionalizar! 🚀

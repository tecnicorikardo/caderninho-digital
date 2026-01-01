# 📱 Caderninho Digital

Sistema completo de gestão empresarial desenvolvido com React, TypeScript e Firebase. Uma solução moderna e responsiva para pequenas e médias empresas gerenciarem vendas, estoque, clientes e finanças.

## 🚀 Funcionalidades

### 💰 **Sistema de Pagamentos PIX**
- ✅ **Integração PagarMe** para pagamentos PIX
- ✅ Geração automática de QR Code
- ✅ Código PIX para copiar/colar
- ✅ Webhook para confirmação automática
- ✅ Sistema de assinatura premium

### 📊 **Gestão de Vendas**
- Registro de vendas com múltiplos produtos
- Controle de pagamentos (dinheiro, cartão, PIX, fiado)
- Histórico completo de transações
- Relatórios de vendas por período

### 👥 **Gestão de Clientes**
- Cadastro completo de clientes
- Importação em massa via Excel
- Controle de fiados e parcelas
- Histórico de compras por cliente

### 📦 **Controle de Estoque**
- Cadastro de produtos com preços
- Controle de quantidade em estoque
- Alertas de estoque baixo
- Importação de produtos via Excel

### 💰 **Gestão Financeira**
- Controle de receitas e despesas
- Categorização de transações
- Relatórios financeiros detalhados
- Gestão de finanças pessoais

### 🤖 **Inteligência Artificial**
- ✅ **Chatbot IA** integrado com Google Gemini
- ✅ Respostas contextuais sobre gestão empresarial
- ✅ Controle de uso (10 perguntas/dia)
- ✅ Fallback offline para respostas básicas

### 📧 **Sistema de Email**
- ✅ **EmailJS** para envio de relatórios
- ✅ Relatórios automáticos por email
- ✅ Fallback para mailto e clipboard

### 📈 **Relatórios e Análises**
- Dashboard com métricas principais
- Relatórios de vendas e financeiro
- Análises de performance
- Exportação de dados

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React 18** + TypeScript + Vite
- **Firebase SDK** v10 (Firestore, Auth, Hosting)
- **CSS Modules** + Design System próprio
- **PWA** com Service Workers

### **Backend**
- **Firebase Functions** (Node.js 20)
- **Firestore** para banco de dados
- **Firebase Auth** para autenticação

### **Integrações**
- **PagarMe API** para pagamentos PIX
- **EmailJS** para envio de relatórios
- **Google Gemini AI** para chatbot
- **Excel Import/Export** para dados

### **Mobile**
- **Capacitor** para apps nativos (Android/iOS)
- **PWA** instalável

## 📱 Plataformas Suportadas

- **Web**: https://bloquinhodigital.web.app
- **PWA**: Instalável como app nativo
- **Android**: APK via Capacitor
- **iOS**: App nativo via Capacitor

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Firebase
- Conta no PagarMe (opcional)

### 1. Clone o repositório
```bash
git clone https://github.com/tecnicorikardo/caderninho-digital.git
cd caderninho-digital
```

### 2. Instale as dependências
```bash
npm install
cd functions && npm install && cd ..
```

### 3. Configure o Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication, Firestore, Hosting e Functions
3. Copie as configurações do Firebase
4. Crie um arquivo `.env` baseado no `.env.example`
5. Configure as variáveis de ambiente:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Configure Integrações (Opcional)

#### PagarMe
```typescript
// functions/src/createPagarMeCharge.ts
const PAGARME_SECRET_KEY = 'sk_sua_chave_secreta';
```

#### EmailJS
```typescript
// src/services/emailjsService.ts
const SERVICE_ID = 'seu_service_id';
const TEMPLATE_ID = 'seu_template_id';
const PUBLIC_KEY = 'sua_public_key';
```

#### Google Gemini AI
```typescript
// src/services/aiService.ts
const GEMINI_API_KEY = 'sua_api_key_gemini';
```

### 5. Execute o projeto
```bash
npm run dev
```

## 🚀 Deploy

### Scripts Automatizados
```bash
# Deploy completo (build + hosting + functions)
deploy-fix.bat

# Apenas build
build-only.bat

# Atualizar GitHub
git-update.bat
```

### Deploy Manual
```bash
# Build do projeto
npm run build

# Deploy hosting
firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# Deploy completo
firebase deploy
```

### Build Mobile
```bash
# Android APK
npm run build
npx cap add android
npx cap copy android
npx cap open android

# iOS App
npm run build
npx cap add ios
npx cap copy ios
npx cap open ios
```

## 💎 Sistema de Assinatura

- **Plano Gratuito**: 2 meses com limite de 50 itens por módulo
- **Plano Premium**: Recursos ilimitados por R$ 20/mês via PIX

### Limites do Plano Gratuito:
- 50 vendas
- 50 clientes  
- 50 produtos
- 50 transações financeiras

### Pagamento Premium:
- ✅ PIX via PagarMe
- ✅ QR Code automático
- ✅ Ativação via webhook
- ✅ Confirmação instantânea

## 📋 Funcionalidades Principais

### ✅ **Implementado**
- [x] Sistema de autenticação
- [x] Gestão completa de vendas
- [x] Controle de estoque
- [x] Cadastro de clientes
- [x] Gestão financeira
- [x] Sistema de fiados
- [x] Relatórios e dashboard
- [x] Importação Excel
- [x] Backup e restauração
- [x] Interface responsiva
- [x] PWA (Progressive Web App)
- [x] Apps nativos (Android/iOS)
- [x] **Sistema PIX com PagarMe**
- [x] **Chatbot IA com Gemini**
- [x] **EmailJS para relatórios**
- [x] **Cache busting**
- [x] **CORS configurado**

### 🔄 **Em Desenvolvimento**
- [ ] Webhook PagarMe para confirmação
- [ ] Relatórios avançados
- [ ] Integração contábil
- [ ] Sistema de comissões

## 🔒 Segurança

- Autenticação via Firebase Auth
- Dados criptografados no Firestore
- Regras de segurança configuradas
- Validação de dados no frontend e backend
- CORS configurado para APIs
- Tokens JWT para autenticação

## 📊 Performance

- ✅ Lighthouse Score: 90+
- ✅ First Contentful Paint: <2s
- ✅ Time to Interactive: <3s
- ✅ PWA compliant
- ✅ Service Worker otimizado

## 🛠️ Estrutura do Projeto

```
caderninho-digital/
├── src/
│   ├── components/          # Componentes React
│   ├── pages/              # Páginas da aplicação
│   ├── services/           # Serviços e APIs
│   ├── contexts/           # Context API
│   └── config/             # Configurações
├── functions/
│   └── src/                # Firebase Functions
├── public/                 # Arquivos estáticos
├── android/                # App Android (Capacitor)
├── ios/                    # App iOS (Capacitor)
└── docs/                   # Documentação (.md files)
```

## 📞 Suporte

- **Email**: tecnicorikardo@gmail.com
- **WhatsApp**: (21) 97090-2074
- **GitHub Issues**: https://github.com/tecnicorikardo/caderninho-digital/issues
- **Demo**: https://bloquinhodigital.web.app

## 🎯 Roadmap 2025

### **Q1 2025**
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento avançado
- [ ] Otimizações de performance

### **Q2 2025**
- [ ] Integração com mais gateways
- [ ] Sistema de comissões
- [ ] Relatórios avançados
- [ ] API pública

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.

## 🤝 Contribuição

Este é um projeto privado. Para sugestões ou melhorias, entre em contato através dos canais de suporte.

---

**🚀 Desenvolvido com ❤️ por [Ricardo Santos](https://github.com/tecnicorikardo)**

**📱 Sistema completo para gestão de pequenos negócios**

**🔗 Demo: https://bloquinhodigital.web.app**

**💰 PIX Payment integrado | 🤖 IA Chatbot | 📧 Email Reports**

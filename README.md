# 📱 Caderninho Digital

Sistema completo de gestão empresarial desenvolvido com React, TypeScript e Firebase. Uma solução moderna e responsiva para pequenas e médias empresas gerenciarem vendas, estoque, clientes e finanças.

## 🚀 Funcionalidades

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

### 📈 **Relatórios e Análises**
- Dashboard com métricas principais
- Relatórios de vendas e financeiro
- Análises de performance
- Exportação de dados

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Estilização**: CSS Modules + Design System próprio
- **Mobile**: Capacitor (Android/iOS)
- **Autenticação**: Firebase Auth
- **Banco de Dados**: Firestore (NoSQL)

## 📱 Plataformas Suportadas

- **Web**: Aplicação responsiva para desktop e mobile
- **PWA**: Instalável como app nativo
- **Android**: APK via Capacitor
- **iOS**: App nativo via Capacitor

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Firebase

### 1. Clone o repositório
```bash
git clone https://github.com/tecnicorikardo/caderninho-digital.git
cd caderninho-digital
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication, Firestore e Hosting
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

### 4. Execute o projeto
```bash
npm run dev
```

## 🚀 Deploy

### Deploy Web (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Build Android APK
```bash
npm run build
npx cap add android
npx cap copy android
npx cap open android
```

### Build iOS App
```bash
npm run build
npx cap add ios
npx cap copy ios
npx cap open ios
```

## 💎 Sistema de Assinatura

- **Plano Gratuito**: 2 meses com limite de 50 itens por módulo
- **Plano Premium**: Recursos ilimitados por R$ 20/mês

### Limites do Plano Gratuito:
- 50 vendas
- 50 clientes  
- 50 produtos
- 50 transações financeiras

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

## 🔒 Segurança

- Autenticação via Firebase Auth
- Dados criptografados no Firestore
- Regras de segurança configuradas
- Validação de dados no frontend e backend

## 📞 Suporte

- **Email**: tecnicorikardo@gmail.com
- **WhatsApp**: (21) 97090-2074

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.

## 🤝 Contribuição

Este é um projeto privado. Para sugestões ou melhorias, entre em contato através dos canais de suporte.

---

**Desenvolvido com ❤️ por Ricardo Técnico**

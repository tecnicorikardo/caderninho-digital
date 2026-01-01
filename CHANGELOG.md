# 📋 Changelog - Caderninho Digital

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

## [2.1.0] - 2025-12-31

### 🚀 **Adicionado**
- **Sistema PIX com PagarMe**
  - Integração completa com API PagarMe
  - Geração automática de QR Code
  - Código PIX para copiar/colar
  - Function `createPagarMeCharge` implementada
  - Correção telefone obrigatório para customers

- **Chatbot IA com Google Gemini**
  - Integração com Gemini API
  - Controle de uso (10 perguntas/dia)
  - Cooldown de 30 segundos
  - Fallback offline para respostas básicas
  - Posicionamento otimizado (100px do bottom)

- **Sistema de Email com EmailJS**
  - Substituição do Firebase Functions por EmailJS
  - Fallback inteligente: EmailJS → mailto → clipboard
  - Service ID: `service_mtv4wwx`
  - Template ID: `template_cfipf57`
  - Public Key configurada

- **Melhorias de Interface**
  - Header redesenhado com gradientes modernos
  - Logo maior e mais visível
  - User card melhorado
  - Cores profissionais aplicadas
  - Responsividade mobile otimizada

### 🔧 **Corrigido**
- **Erro CORS Resolvido**
  - Function convertida de `onCall` para `onRequest`
  - CORS middleware configurado
  - Suporte a múltiplos domínios
  - Headers de autenticação corrigidos

- **Problemas de Cache**
  - Service Worker atualizado para v3
  - Cache busting implementado
  - Timestamp nas URLs das functions
  - Versionamento forçado

- **Navegação Mobile**
  - `MobileNavigation` movido para dentro do Router
  - Erro `useNavigate()` context resolvido
  - Rotas otimizadas

- **Validações de Formulário**
  - Endereço opcional para clientes
  - Campos não obrigatórios marcados corretamente
  - Validação melhorada

### 🔄 **Alterado**
- **Sistema de Assinatura**
  - Plano gratuito reduzido para 2 meses
  - Limites ajustados para 50 itens por módulo
  - Modal de assinatura removido do dashboard
  - Status movido para página de configurações

- **Importação Excel**
  - Suporte para produtos e clientes
  - Validação de dados melhorada
  - Guias de uso incluídas
  - Tratamento de erros aprimorado

- **Configuração Firebase**
  - Projeto migrado de "web-gestao-37a85" para "bloquinhodigital"
  - Configurações atualizadas
  - Deploy otimizado

### 🗑️ **Removido**
- **Integrações Descontinuadas**
  - Sistema Asaas (substituído por PagarMe)
  - Chatbot Telegram (substituído por IA web)
  - Dependências desnecessárias (`groq-sdk`, `@google/generative-ai`, `node-telegram-bot-api`)

- **Notificações Push**
  - FCM temporariamente desabilitado
  - Erro de encoding VAPID resolvido
  - Sistema será reabilitado futuramente

### 📊 **Performance**
- **Build Otimizado**
  - Chunks reduzidos
  - Assets otimizados
  - Service Worker melhorado
  - Cache estratégico implementado

- **Functions Otimizadas**
  - Node.js 20 (1st Gen)
  - Timeout configurado
  - Memory otimizada (256MB)
  - Logs estruturados

### 🔐 **Segurança**
- **Autenticação Melhorada**
  - Tokens JWT validados
  - Headers de autorização padronizados
  - Verificação de usuário aprimorada

- **API Security**
  - CORS configurado corretamente
  - Rate limiting implementado
  - Error handling melhorado

## [2.0.0] - 2025-12-30

### 🚀 **Adicionado**
- Sistema completo de gestão empresarial
- Dashboard com métricas em tempo real
- Gestão de vendas, clientes e estoque
- Sistema de fiados com parcelas
- Relatórios por período
- PWA (Progressive Web App)
- Apps nativos Android/iOS via Capacitor

### 🛠️ **Tecnologias Base**
- React 18 + TypeScript + Vite
- Firebase (Firestore, Auth, Hosting, Functions)
- CSS Modules + Design System
- Service Workers para PWA

## [1.0.0] - 2025-12-01

### 🚀 **Lançamento Inicial**
- Versão MVP do sistema
- Funcionalidades básicas de gestão
- Interface responsiva
- Autenticação Firebase

---

## 📝 **Formato do Changelog**

Este changelog segue o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### **Tipos de Mudanças**
- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades

---

**🚀 Última atualização: 31/12/2025**

**📱 Versão atual: 2.1.0**

**🔗 Demo: https://bloquinhodigital.web.app**
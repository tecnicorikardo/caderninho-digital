# ✅ Checklist - Implementação de Email

## 💡 Como Funciona

**Você configura 1 vez:**
- Seu email (servidor) que vai ENVIAR os relatórios
- Exemplo: comercio@gmail.com

**Cada usuário usa:**
- Digita o próprio email para RECEBER
- Exemplo: funcionario@gmail.com, cliente@hotmail.com
- Não precisa configurar nada!

**Resultado:**
- Todos os emails saem do seu email servidor
- Cada um recebe no próprio email
- ✅ Agora com checkbox "Lembrar meu email"!

---

## 📋 Passo a Passo Rápido

### ☐ 1. Gerar Senha de App do Gmail (2 min)
- [ ] Acessar https://myaccount.google.com/apppasswords
- [ ] Gerar senha de app
- [ ] Copiar senha (16 caracteres)

### ☐ 2. Instalar e Configurar (3 min)
```bash
cd functions
npm install
firebase functions:config:set email.user="seu-email@gmail.com"
firebase functions:config:set email.password="sua-senha-de-app"
```

### ☐ 3. Deploy das Functions (2 min)
```bash
npm run build
cd ..
firebase deploy --only functions
```

### ☐ 4. Adicionar Botão na Página de Vendas (5 min)
- [ ] Abrir `src/pages/Sales/index.tsx`
- [ ] Adicionar import: `import EmailReportModal from '../../components/EmailReportModal';`
- [ ] Adicionar estado: `const [showEmailModal, setShowEmailModal] = useState(false);`
- [ ] Copiar função `prepareEmailReport()` do arquivo `EXEMPLO-BOTAO-EMAIL-VENDAS.tsx`
- [ ] Adicionar botão ao lado de "Nova Venda"
- [ ] Adicionar modal no final do return

### ☐ 5. Testar (2 min)
- [ ] Abrir sistema
- [ ] Ir para página de Vendas
- [ ] Clicar em "Enviar Relatório"
- [ ] Digitar seu email
- [ ] Enviar
- [ ] Verificar caixa de entrada (e spam!)

---

## 🎯 Comandos Rápidos

### Setup Completo (copie e cole)
```bash
cd functions && npm install && firebase functions:config:set email.user="SEU-EMAIL@gmail.com" && firebase functions:config:set email.password="SUA-SENHA-APP" && npm run build && cd .. && firebase deploy --only functions
```

### Verificar Status
```bash
firebase functions:list
firebase functions:config:get
```

### Ver Logs
```bash
firebase functions:log --only sendReportEmail
```

---

## 📁 Arquivos Criados

✅ Backend:
- `functions/src/sendEmail.ts` - Funções de email
- `functions/src/index.ts` - Exportações
- `functions/package.json` - Dependências
- `functions/tsconfig.json` - Config TypeScript

✅ Frontend:
- `src/services/emailService.ts` - Serviço de email
- `src/components/EmailReportModal.tsx` - Modal de envio
- `src/styles/colors.ts` - Cores profissionais

✅ Documentação:
- `GUIA-EMAIL-NOTIFICACOES.md` - Guia completo
- `SETUP-RAPIDO-EMAIL.md` - Setup rápido
- `EXEMPLO-BOTAO-EMAIL-VENDAS.tsx` - Exemplo prático
- `CHECKLIST-EMAIL.md` - Este arquivo

---

## 🚀 Próximas Páginas para Adicionar

Depois de testar em Vendas, adicione em:

### 1. Página de Relatórios
```tsx
// src/pages/Reports/index.tsx
// Mesmo padrão, mudar reportType para o tipo correto
```

### 2. Página de Estoque
```tsx
// src/pages/Stock/index.tsx
reportType="stock"
reportData={{
  totalProducts: products.length,
  lowStockCount: lowStockProducts.length,
  lowStockProducts: lowStockProducts,
}}
```

### 3. Página de Fiados
```tsx
// src/pages/Fiados/index.tsx
reportType="fiados"
reportData={{
  totalPending: totalPending,
  overdueCount: overdueCount,
  pendingFiados: pendingFiados,
}}
```

---

## 💡 Dicas

### ✅ Fazer
- Testar com seu email primeiro
- Verificar pasta de spam
- Manter credenciais seguras
- Usar senha de app (não senha normal)

### ❌ Evitar
- Commitar senhas no código
- Enviar muitos emails de teste
- Usar senha normal do Gmail
- Esquecer de fazer build antes do deploy

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Invalid login" | Gerar nova senha de app |
| "Unauthenticated" | Fazer login no sistema |
| Email não chega | Verificar spam e logs |
| "Module not found" | `cd functions && npm install` |
| Botão não aparece | Verificar imports e estado |

---

## ⏱️ Tempo Estimado

- Setup inicial: **5 minutos**
- Adicionar em 1 página: **5 minutos**
- Testar: **2 minutos**
- **Total: ~12 minutos**

---

## 📞 Comandos de Debug

```bash
# Ver configuração
firebase functions:config:get

# Ver logs em tempo real
firebase functions:log --only sendReportEmail

# Testar localmente
firebase emulators:start --only functions

# Redeploy se necessário
firebase deploy --only functions:sendReportEmail
```

---

## ✨ Resultado Final

Você terá:
- ✅ Botão "📧 Enviar Relatório" nas páginas
- ✅ Modal profissional para envio
- ✅ Emails HTML formatados
- ✅ Validação de email
- ✅ Feedback de sucesso/erro
- ✅ Design profissional (cores novas)

---

**Pronto para começar?** Execute: `setup-email.bat` ou siga o passo 2 manualmente!

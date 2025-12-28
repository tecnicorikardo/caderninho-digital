# 🚀 GUIA DE DEPLOY E TESTE - CADERNINHO DIGITAL

**Data:** 08/11/2025

---

## 📋 PRÉ-REQUISITOS

- [x] Node.js instalado
- [x] Firebase CLI instalado (`npm install -g firebase-tools`)
- [x] Conta Firebase configurada
- [x] Build sem erros ✅

---

## 🔥 PASSO 1: DEPLOY DAS REGRAS DO FIRESTORE

### 1.1 Login no Firebase
```bash
firebase login
```

### 1.2 Verificar Projeto
```bash
firebase projects:list
```

### 1.3 Selecionar Projeto (se necessário)
```bash
firebase use web-gestao-37a85
```

### 1.4 Deploy das Regras
```bash
firebase deploy --only firestore:rules
```

**Resultado Esperado:**
```
✔ Deploy complete!
```

---

## 🏗️ PASSO 2: BUILD E DEPLOY DA APLICAÇÃO

### 2.1 Build de Produção
```bash
npm run build
```

**Resultado Esperado:**
```
✓ built in 10s
dist/index.html                   1.38 kB
dist/assets/index-xxx.css         2.06 kB
dist/assets/index-xxx.js        929.88 kB
```

### 2.2 Deploy do Hosting
```bash
firebase deploy --only hosting
```

**Resultado Esperado:**
```
✔ Deploy complete!
Hosting URL: https://web-gestao-37a85.web.app
```

### 2.3 Deploy Completo (Regras + Hosting)
```bash
npm run deploy
```

---

## ✅ PASSO 3: TESTES FUNCIONAIS

### 3.1 Teste de Autenticação

**Objetivo:** Verificar login, cadastro e recuperação de senha

1. Acesse a aplicação
2. Clique em "Criar nova conta"
3. Preencha email e senha
4. Confirme criação da conta
5. Faça logout
6. Faça login novamente
7. Teste "Esqueci minha senha"

**Verificação no Firebase:**
- Abra Firebase Console
- Vá em Authentication
- Verifique se o usuário aparece

**✅ Passou:** Usuário criado e pode fazer login  
**❌ Falhou:** Erro ao criar conta ou fazer login

---

### 3.2 Teste de Vendas

**Objetivo:** Verificar criação e sincronização de vendas

1. Acesse `/sales`
2. Clique em "Nova Venda"
3. Preencha os dados:
   - Descrição: "Teste de Venda"
   - Preço: R$ 100,00
   - Quantidade: 2
   - Forma de pagamento: Dinheiro
4. Clique em "Criar Venda"
5. Verifique se aparece na lista

**Verificação no Firebase:**
- Abra Firebase Console
- Vá em Firestore Database
- Abra a coleção `sales`
- Verifique se a venda está lá

**Teste de Sincronização:**
1. Abra a aplicação em outro navegador (modo anônimo)
2. Faça login com a mesma conta
3. Acesse `/sales`
4. Verifique se a venda aparece

**✅ Passou:** Venda criada e aparece em ambos os navegadores  
**❌ Falhou:** Venda não aparece ou não sincroniza

---

### 3.3 Teste de Clientes

**Objetivo:** Verificar CRUD completo de clientes

1. Acesse `/clients`
2. Clique em "Novo Cliente"
3. Preencha os dados:
   - Nome: "Cliente Teste"
   - Email: "teste@email.com"
   - Telefone: "(11) 99999-9999"
4. Salve o cliente
5. Edite o cliente
6. Verifique se as alterações persistem

**Verificação no Firebase:**
- Abra Firebase Console
- Vá em Firestore Database
- Abra a coleção `clients`
- Verifique se o cliente está lá

**✅ Passou:** Cliente criado, editado e sincronizado  
**❌ Falhou:** Erro ao salvar ou editar

---

### 3.4 Teste de Produtos

**Objetivo:** Verificar gestão de estoque

1. Acesse `/stock`
2. Clique em "Novo Produto"
3. Preencha os dados:
   - Nome: "Produto Teste"
   - Preço de Custo: R$ 50,00
   - Preço de Venda: R$ 100,00
   - Quantidade: 10
   - Estoque Mínimo: 5
4. Salve o produto
5. Faça uma movimentação de estoque
6. Verifique se a quantidade atualiza

**Verificação no Firebase:**
- Abra Firebase Console
- Vá em Firestore Database
- Abra a coleção `products`
- Verifique se o produto está lá

**✅ Passou:** Produto criado e quantidade atualizada  
**❌ Falhou:** Erro ao salvar ou atualizar quantidade

---

### 3.5 Teste de Assinatura

**Objetivo:** Verificar sistema de assinatura gratuita

1. Crie uma nova conta
2. Após login, verifique o banner de assinatura
3. Deve mostrar "12 meses gratuitos"
4. Crie algumas vendas
5. Verifique se o contador aumenta

**Verificação no Firebase:**
- Abra Firebase Console
- Vá em Firestore Database
- Abra a coleção `subscriptions`
- Verifique se há um documento com seu userId
- Abra a coleção `usage`
- Verifique os contadores

**✅ Passou:** Assinatura criada e contadores funcionando  
**❌ Falhou:** Assinatura não criada ou contadores não atualizam

---

### 3.6 Teste de Migração

**Objetivo:** Verificar migração de dados do localStorage

**Preparação:**
1. Abra o Console do navegador (F12)
2. Vá em Application > Local Storage
3. Adicione dados de teste manualmente (opcional)

**Teste:**
1. Recarregue a aplicação
2. Deve aparecer o prompt de migração
3. Clique em "Migrar Agora"
4. Aguarde conclusão
5. Verifique mensagem de sucesso

**Verificação no Firebase:**
- Abra Firebase Console
- Vá em Firestore Database
- Verifique as coleções:
  - `transactions`
  - `stock_movements`
  - `fiado_payments`

**✅ Passou:** Dados migrados com sucesso  
**❌ Falhou:** Erro na migração ou dados não aparecem

---

## 🔍 PASSO 4: VERIFICAÇÃO DE SEGURANÇA

### 4.1 Teste de Isolamento de Dados

**Objetivo:** Garantir que usuários não vejam dados de outros

1. Crie duas contas diferentes
2. Na conta 1, crie uma venda
3. Faça login na conta 2
4. Verifique se a venda da conta 1 NÃO aparece

**✅ Passou:** Dados isolados por usuário  
**❌ Falhou:** Usuário vê dados de outros

### 4.2 Teste de Regras do Firestore

**Objetivo:** Verificar se as regras estão funcionando

1. Abra Firebase Console
2. Vá em Firestore Database
3. Clique em "Rules"
4. Clique em "Simulator"
5. Teste operações:
   - Read em `sales` com auth
   - Write em `sales` com auth
   - Read em `sales` sem auth (deve falhar)

**✅ Passou:** Regras bloqueiam acesso não autorizado  
**❌ Falhou:** Acesso sem autenticação permitido

---

## 📊 PASSO 5: MONITORAMENTO

### 5.1 Verificar Logs de Erro

**Firebase Console:**
1. Vá em Firestore Database
2. Clique em "Usage"
3. Verifique se há erros

**Console do Navegador:**
1. Abra DevTools (F12)
2. Vá em Console
3. Verifique se há erros em vermelho

### 5.2 Verificar Performance

**Métricas a Observar:**
- Tempo de carregamento inicial
- Tempo de resposta das queries
- Tamanho do bundle JavaScript

**Comandos:**
```bash
# Analisar tamanho do build
npm run build -- --mode production

# Ver estatísticas detalhadas
npx vite-bundle-visualizer
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Permission Denied" no Firestore

**Causa:** Regras não foram deployadas ou estão incorretas

**Solução:**
```bash
firebase deploy --only firestore:rules
```

### Problema: Dados não aparecem após login

**Causa:** userId não está sendo salvo corretamente

**Solução:**
1. Abra Console do navegador
2. Verifique se `user.uid` está definido
3. Verifique se as queries incluem `where('userId', '==', userId)`

### Problema: Build falha

**Causa:** Erros de TypeScript

**Solução:**
```bash
npm run build:check
```

### Problema: Migração não funciona

**Causa:** Dados no formato incorreto no localStorage

**Solução:**
1. Abra Console do navegador
2. Vá em Application > Local Storage
3. Verifique o formato dos dados
4. Limpe localStorage e tente novamente

---

## ✅ CHECKLIST FINAL

### Deploy
- [ ] Regras do Firestore deployadas
- [ ] Aplicação buildada sem erros
- [ ] Hosting deployado
- [ ] URL de produção acessível

### Funcionalidades
- [ ] Login/Cadastro funcionando
- [ ] Vendas salvando no Firebase
- [ ] Clientes salvando no Firebase
- [ ] Produtos salvando no Firebase
- [ ] Assinatura criada automaticamente
- [ ] Contadores de uso funcionando

### Segurança
- [ ] Regras do Firestore ativas
- [ ] Dados isolados por usuário
- [ ] Acesso sem auth bloqueado

### Migração
- [ ] Prompt de migração aparece
- [ ] Migração funciona corretamente
- [ ] Dados aparecem no Firebase
- [ ] localStorage limpo após migração

### Performance
- [ ] Carregamento rápido (< 3s)
- [ ] Queries otimizadas
- [ ] Sem erros no console

---

## 🎯 PRÓXIMOS PASSOS

### Após Testes Bem-Sucedidos
1. ✅ Compartilhar URL com usuários
2. ✅ Monitorar uso nas primeiras 24h
3. ✅ Coletar feedback
4. ✅ Ajustar conforme necessário

### Melhorias Futuras
1. Implementar PWA (Progressive Web App)
2. Adicionar notificações push
3. Implementar modo offline
4. Adicionar analytics
5. Implementar testes automatizados

---

## 📞 SUPORTE

### Em Caso de Problemas

**Firebase Console:**
https://console.firebase.google.com/project/web-gestao-37a85

**Documentação Firebase:**
https://firebase.google.com/docs

**Logs de Erro:**
- Firebase Console > Firestore > Usage
- Browser DevTools > Console

---

**Guia criado por:** Kiro AI  
**Data:** 08/11/2025  
**Versão:** 1.0

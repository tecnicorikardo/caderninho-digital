# 📱 GUIA - Notificações Push do Navegador

**Data:** 12/11/2025  
**Funcionalidade:** Notificações que aparecem no telefone/desktop

---

## 🎯 O QUE SÃO NOTIFICAÇÕES PUSH?

São notificações que aparecem **fora do app**, diretamente no seu dispositivo:

- 📱 **No celular:** Aparecem na barra de notificações (como WhatsApp, Instagram)
- 💻 **No desktop:** Aparecem no canto da tela (Windows/Mac/Linux)
- ✅ **Funcionam mesmo com o app fechado**
- ✅ **Funcionam em segundo plano**

---

## 🚀 COMO ATIVAR

### Passo 1: Acessar Configurações
1. Ir em **Configurações de Notificações**
2. Procurar seção **"📱 Notificações Push do Navegador"**

### Passo 2: Ativar
1. Clicar em **"🔔 Ativar Notificações Push"**
2. Navegador vai pedir permissão
3. Clicar em **"Permitir"** ou **"Allow"**

### Passo 3: Testar
1. Clicar em **"🧪 Testar Push"**
2. Notificação deve aparecer no seu dispositivo
3. Se aparecer, está funcionando! 🎉

---

## 📱 COMPATIBILIDADE

### ✅ Funciona em:
- **Android:** Chrome, Firefox, Edge, Samsung Internet
- **Desktop:** Chrome, Firefox, Edge, Opera, Brave
- **iOS/iPhone:** Safari 16.4+ (com PWA instalado)

### ❌ Não funciona em:
- **iOS/iPhone:** Safari normal (sem PWA)
- **Navegadores antigos**
- **Modo anônimo/privado**

---

## 🔔 TIPOS DE NOTIFICAÇÕES PUSH

O sistema envia notificações push para:

### 1. Estoque Baixo ⚠️
```
Título: ⚠️ Estoque Baixo
Mensagem: Produto X: 3 unidades (Mínimo: 10)
```

### 2. Fiado Vencido ⏰
```
Título: ⏰ Fiado Vencido
Mensagem: Cliente Y: R$ 50,00 (5 dias de atraso)
```

### 3. Venda Grande 🎉
```
Título: 🎉 Venda Importante!
Mensagem: Venda de R$ 500,00 para Cliente Z
```

---

## 🧪 COMO TESTAR

### Teste 1: Notificação de Teste
1. Ir em **Configurações de Notificações**
2. Clicar em **"🧪 Testar Push"**
3. Deve aparecer: "🧪 Teste de Notificação"

### Teste 2: Estoque Baixo
1. Editar um produto com estoque baixo
2. Aguardar alguns segundos
3. Notificação push deve aparecer

### Teste 3: Fiado (com botão de teste)
1. Criar venda fiada
2. Clicar em **"🧪 Testar Fiados (Ignora Prazo)"**
3. Notificação push deve aparecer

---

## 🔧 CONFIGURAÇÕES DO NAVEGADOR

### Chrome (Android/Desktop):
1. Configurações → Privacidade e segurança
2. Configurações do site → Notificações
3. Procurar seu site
4. Permitir notificações

### Firefox:
1. Configurações → Privacidade e segurança
2. Permissões → Notificações
3. Configurações
4. Procurar seu site e permitir

### Safari (iOS - requer PWA):
1. Instalar o app na tela inicial
2. Abrir o app instalado
3. Permitir notificações quando solicitado

---

## 💡 DICAS

### Para Melhor Experiência:

1. **Ative as notificações push** logo ao entrar
2. **Teste** para garantir que está funcionando
3. **Mantenha o navegador atualizado**
4. **No celular:** Adicione o app à tela inicial (PWA)

### Quando Usar:

- ✅ **Estoque baixo:** Receba alerta imediato
- ✅ **Fiados vencidos:** Não esqueça de cobrar
- ✅ **Vendas grandes:** Comemore suas conquistas

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: Botão não aparece
**Causa:** Navegador não suporta  
**Solução:** Usar Chrome, Firefox ou Edge

### Problema 2: Permissão negada
**Causa:** Você clicou em "Bloquear"  
**Solução:** 
1. Ir nas configurações do navegador
2. Procurar permissões de notificações
3. Permitir para o site

### Problema 3: Notificação não aparece
**Verificar:**
1. Permissão está concedida?
2. Notificações do sistema estão ativadas?
3. Modo "Não perturbe" está desativado?

### Problema 4: Funciona no desktop mas não no celular
**Causa:** iOS Safari não suporta (sem PWA)  
**Solução:** 
1. Adicionar app à tela inicial
2. Abrir pelo ícone instalado
3. Permitir notificações

---

## 📊 DIFERENÇAS

### Notificações Internas (Sino 🔔):
- ✅ Aparecem dentro do app
- ✅ Ficam salvas no histórico
- ✅ Podem ser marcadas como lidas
- ❌ Só vê quando está no app

### Notificações Push (📱):
- ✅ Aparecem fora do app
- ✅ Funcionam com app fechado
- ✅ Chamam sua atenção imediatamente
- ❌ Não ficam no histórico do app

### Melhor Estratégia:
**Usar AMBAS!**
- Push: Para alertas urgentes
- Internas: Para histórico e detalhes

---

## 🎨 PERSONALIZAÇÃO

### Ícone das Notificações:
O sistema usa o ícone do app (`/icon-192x192.png`)

### Sons e Vibração:
- **Som:** Padrão do sistema
- **Vibração:** 200ms, pausa 100ms, 200ms
- **Pode ser alterado em:** `src/services/pushNotificationService.ts`

---

## 🔐 PRIVACIDADE E SEGURANÇA

### O que é enviado:
- ✅ Título da notificação
- ✅ Mensagem
- ✅ Ícone do app

### O que NÃO é enviado:
- ❌ Dados pessoais
- ❌ Senhas
- ❌ Informações bancárias

### Segurança:
- ✅ Notificações são locais (não passam por servidor)
- ✅ Você controla quando ativar/desativar
- ✅ Pode revogar permissão a qualquer momento

---

## 📈 PRÓXIMOS PASSOS

### Após Ativar:
1. ✅ Testar notificação
2. ✅ Configurar preferências
3. ✅ Usar o app normalmente
4. ✅ Receber alertas automaticamente

### Melhorias Futuras:
- [ ] Agendar notificações
- [ ] Notificações personalizadas por tipo
- [ ] Estatísticas de notificações
- [ ] Notificações por email

---

## ✅ CHECKLIST

- [ ] Notificações push ativadas
- [ ] Teste realizado com sucesso
- [ ] Notificação apareceu no dispositivo
- [ ] Preferências configuradas
- [ ] Sistema funcionando

---

## 🎉 CONCLUSÃO

Notificações push são a melhor forma de:

✅ **Não perder nenhum alerta importante**  
✅ **Ser notificado mesmo com app fechado**  
✅ **Gerenciar seu negócio com mais eficiência**  
✅ **Responder rapidamente a situações urgentes**  

**Ative agora e teste!** 🚀

---

**Desenvolvido para manter você sempre informado**

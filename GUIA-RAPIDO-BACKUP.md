# 📱 GUIA RÁPIDO - BACKUP E RESTAURAÇÃO

## 🎯 Como Fazer Backup Completo

### Passo 1: Acessar Configurações
1. Abra o aplicativo
2. Clique no menu (☰)
3. Selecione "⚙️ Configurações"

### Passo 2: Exportar Dados
1. Role até a seção "💾 Gerenciar Dados"
2. Clique em "📥 Exportar" (botão verde)
3. Aguarde o processamento
4. O arquivo será baixado automaticamente

**Nome do arquivo:** `backup-completo-YYYY-MM-DD.json`

### O que é incluído no backup?
- ✅ Vendas (Firebase)
- ✅ Clientes (Firebase)
- ✅ Pagamentos (Firebase)
- ✅ Produtos (Firebase)
- ✅ Transações financeiras (localStorage)

---

## 📥 Como Restaurar Backup

### Passo 1: Preparar
1. Tenha o arquivo de backup (.json) salvo
2. **IMPORTANTE:** Faça um novo backup antes de importar!

### Passo 2: Importar
1. Vá em Configurações
2. Seção "💾 Gerenciar Dados"
3. Clique em "📤 Importar" (botão azul)
4. Selecione o arquivo de backup
5. Aguarde a importação

### Avisos durante importação:
- Se o backup for de outro usuário, você será avisado
- Erros individuais não param a importação completa
- Você verá quantos itens foram restaurados

---

## 🔄 Como Migrar Dados Antigos

Se você tem dados no localStorage (sistema antigo), pode migrá-los para o Firebase:

### Opção 1: Migração Automática
O sistema detecta dados antigos e oferece migração automática.

### Opção 2: Migração Manual
1. Vá em Configurações
2. Procure por opção de migração (se disponível)
3. Confirme a migração
4. Aguarde o processo

**O que é migrado:**
- Transações financeiras
- Movimentações de estoque
- Pagamentos de fiados
- Produtos

---

## ⚠️ IMPORTANTE - LEIA ANTES DE USAR

### Antes de Importar Backup
1. ✅ Faça backup dos dados atuais
2. ✅ Verifique se o arquivo está correto
3. ✅ Confirme que é o backup desejado
4. ⚠️ A importação ADICIONA dados, não substitui

### Antes de Resetar Sistema
1. ⚠️ **FAÇA BACKUP PRIMEIRO!**
2. ⚠️ Esta ação é IRREVERSÍVEL
3. ⚠️ Todos os dados serão apagados
4. ✅ Você precisará digitar confirmação

### Segurança dos Dados
- ✅ Backups são salvos localmente no seu dispositivo
- ✅ Dados no Firebase são protegidos por autenticação
- ✅ Apenas você pode acessar seus dados
- ⚠️ Guarde seus backups em local seguro

---

## 🆘 PROBLEMAS COMUNS

### "Erro ao exportar dados"
**Solução:**
1. Verifique sua conexão com internet
2. Faça logout e login novamente
3. Tente novamente

### "Erro ao importar backup"
**Possíveis causas:**
- Arquivo corrompido
- Formato inválido
- Falta de permissões

**Solução:**
1. Verifique se o arquivo é .json
2. Tente abrir o arquivo em um editor de texto
3. Confirme que contém dados válidos

### "Alguns itens não foram importados"
**Normal!** Isso pode acontecer se:
- Item já existe (evita duplicatas)
- Dados inválidos no backup
- Erro de conexão temporário

**Solução:**
- Verifique o console do navegador para detalhes
- Tente importar novamente
- Entre em contato com suporte se persistir

---

## 📞 SUPORTE

### Precisa de ajuda?
- **Email:** tecnicorikardo@gmail.com
- **WhatsApp:** (21) 97090-2074

### Antes de entrar em contato:
1. Faça backup dos seus dados
2. Anote a mensagem de erro exata
3. Informe o que você estava fazendo
4. Mencione o dispositivo/navegador usado

---

## 💡 DICAS ÚTEIS

### Frequência de Backup
- 📅 **Diário:** Se usa muito o sistema
- 📅 **Semanal:** Uso moderado
- 📅 **Mensal:** Uso ocasional

### Onde Guardar Backups
- ☁️ Google Drive / OneDrive
- 📧 Enviar por email para você mesmo
- 💾 Salvar em múltiplos dispositivos
- 🔒 Usar serviço de backup na nuvem

### Boas Práticas
1. ✅ Mantenha múltiplas cópias de backup
2. ✅ Teste a restauração periodicamente
3. ✅ Nomeie backups com data clara
4. ✅ Não delete backups antigos imediatamente
5. ✅ Faça backup antes de atualizações

---

## 🔧 RECURSOS AVANÇADOS

### Verificar Dados
Use "🔍 Verificar Dados" para:
- Ver quantos itens existem
- Identificar problemas
- Confirmar sincronização

### Reset Seletivo
Você pode escolher:
- 🗑️ Apagar apenas transações
- 💥 Reset completo do sistema

### Backup Automático (Futuro)
Em breve: backup automático na nuvem!

---

**Última atualização:** 08/11/2025  
**Versão do sistema:** 1.1.0

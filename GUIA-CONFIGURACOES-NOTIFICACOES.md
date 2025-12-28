# 🔔 Guia de Configurações de Notificações

## 📋 Funcionalidade Implementada

Sistema completo de configuração de notificações que permite aos usuários escolher quais alertas desejam receber.

## 🎯 Como Acessar

### Pelo Dashboard:
1. Acesse o **Dashboard** principal
2. Clique no card **"🔔 Notificações"**
3. Configure suas preferências

### Pela URL direta:
- `/notification-settings`

## 🔧 Tipos de Notificações Disponíveis

### 🏢 Notificações de Negócio
- **📦 Estoque Baixo**: Produtos com estoque baixo
- **💰 Vendas Grandes**: Vendas acima de R$ 500
- **📊 Resumo Diário**: Resumo das vendas do dia
- **📈 Relatório Semanal**: Desempenho semanal
- **📅 Relatório Mensal**: Desempenho mensal
- **👤 Novo Cliente**: Novos clientes cadastrados
- **💳 Lembrete de Fiado**: Pagamentos em atraso

### 💰 Notificações Pessoais
- **💵 Receitas Grandes**: Receitas acima de R$ 1.000
- **💸 Despesas Grandes**: Despesas acima de R$ 500
- **⚠️ Gastos Mensais Altos**: Gastos > 80% da receita
- **📊 Categoria com Gasto Alto**: Categoria > 30% dos gastos
- **🎉 Economia Positiva**: Parabéns por economizar

### ⚙️ Configurações Gerais
- **📧 Notificações por Email**: (Em desenvolvimento)
- **🔔 Notificações Push**: (Em desenvolvimento)

## 🎛️ Interface de Configuração

### Cards de Notificação
Cada tipo de notificação tem seu próprio card com:
- **Título e ícone** identificativo
- **Descrição** do que a notificação faz
- **Botão Ativar/Desativar** para controle individual
- **Indicador visual** quando ativada

### Ações Rápidas
- **✅ Ativar Importantes**: Ativa notificações essenciais
- **🔕 Modo Silencioso**: Desativa notificações menos importantes

## 🔄 Como Funciona

### 1. Configuração Padrão
- Notificações importantes **ativadas** por padrão
- Notificações menos críticas **desativadas** por padrão
- Usuário pode personalizar conforme preferência

### 2. Verificação Automática
- Antes de enviar qualquer notificação, o sistema verifica se está habilitada
- Se desabilitada, a notificação não é criada
- Log no console indica quando notificação foi bloqueada

### 3. Sincronização
- Configurações salvas no Firebase
- Aplicadas imediatamente
- Sincronizadas em todos os dispositivos

## 💾 Armazenamento

### Coleção Firebase: `notification_preferences`
```javascript
{
  userId: "string",
  lowStock: boolean,
  bigSale: boolean,
  // ... outras preferências
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Regras de Segurança
- Usuário só acessa suas próprias preferências
- Criação, leitura e atualização permitidas
- Exclusão permitida (para reset)

## 🛠️ Implementação Técnica

### Serviços Criados
1. **`notificationPreferencesService.ts`**
   - Gerencia preferências no Firebase
   - Métodos para ler, salvar e atualizar
   - Verificação de preferências individuais

2. **Atualização do `notificationService.ts`**
   - Verificação automática antes de criar notificações
   - Parâmetro opcional para tipo de preferência
   - Log quando notificação é bloqueada

### Página de Configuração
- **`NotificationSettings/index.tsx`**
- Interface intuitiva com cards
- Atualização em tempo real
- Feedback visual das configurações

## 🎯 Benefícios

### Para o Usuário
- **Controle total** sobre notificações
- **Redução de spam** de alertas
- **Personalização** conforme necessidade
- **Interface intuitiva** para configurar

### Para o Sistema
- **Melhor experiência** do usuário
- **Redução de notificações** desnecessárias
- **Performance otimizada** (menos notificações = menos processamento)
- **Flexibilidade** para adicionar novos tipos

## 📊 Configurações Recomendadas

### Usuário Iniciante
```
✅ Estoque Baixo
✅ Vendas Grandes  
✅ Novo Cliente
✅ Receitas Grandes
✅ Economia Positiva
❌ Resumo Diário
❌ Categoria com Gasto Alto
```

### Usuário Avançado
```
✅ Todas as notificações de negócio
✅ Gastos Mensais Altos
✅ Despesas Grandes
❌ Apenas notificações críticas pessoais
```

### Modo Silencioso
```
✅ Apenas estoque baixo
✅ Apenas fiado vencido
❌ Todas as outras
```

## 🔮 Futuras Melhorias

1. **Notificações por Email**
   - Configuração de horários
   - Resumos semanais/mensais por email

2. **Notificações Push**
   - Alertas no navegador
   - Configuração de sons

3. **Horários Personalizados**
   - Não incomodar em horários específicos
   - Configuração por tipo de notificação

4. **Agrupamento Inteligente**
   - Agrupar notificações similares
   - Resumos em vez de alertas individuais

---

**Resultado**: Sistema completo que respeita as preferências do usuário e melhora significativamente a experiência com notificações personalizadas!
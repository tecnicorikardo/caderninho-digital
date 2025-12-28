# 💰 Gestão Pessoal - Caderninho Digital

## Visão Geral

O módulo de **Gestão Pessoal** foi criado para você gerenciar suas finanças pessoais **completamente separado** do seu negócio. Isso permite ter controle total sobre suas receitas e despesas pessoais sem misturar com as transações comerciais.

## 🎯 Por que separar?

- ✅ **Clareza**: Saiba exatamente quanto você ganha e gasta pessoalmente
- ✅ **Organização**: Não misture finanças pessoais com do negócio
- ✅ **Controle**: Entenda seus hábitos de consumo
- ✅ **Planejamento**: Faça metas financeiras pessoais
- ✅ **Independência**: Funciona totalmente separado do módulo comercial

## 📱 Funcionalidades

### 1. Gestão Pessoal (`/personal`)

Página principal onde você gerencia suas transações pessoais.

#### Recursos:
- ➕ **Adicionar Transações**: Receitas e despesas pessoais
- 📊 **Resumo em Tempo Real**: Veja totais de receitas, despesas e saldo
- 🏷️ **Categorias**: Organize por categorias (Alimentação, Transporte, etc.)
- 💳 **Métodos de Pagamento**: Dinheiro, PIX, Cartão, Transferência
- 🗑️ **Excluir**: Remova transações quando necessário
- 🔍 **Filtros**: Veja todas, só receitas ou só despesas

#### Categorias Padrão:

**Despesas:**
- 🍔 Alimentação
- 🚗 Transporte
- 🏠 Moradia
- ⚕️ Saúde
- 📚 Educação
- 🎮 Lazer
- 👕 Vestuário
- 📄 Contas
- 📦 Outros

**Receitas:**
- 💰 Salário
- 💼 Freelance
- 📈 Investimentos
- 💵 Outros

### 2. Relatórios Pessoais (`/personal-reports`)

Análise detalhada das suas finanças pessoais.

#### Recursos:
- 📅 **Filtro por Período**: Escolha mês e ano
- 📊 **Gráficos por Categoria**: Veja onde você mais gasta
- 💡 **Insights Inteligentes**: Dicas baseadas nos seus dados
- 📈 **Taxa de Economia**: Quanto você está economizando
- ⚠️ **Alertas**: Avisos quando despesas superam receitas

## 🚀 Como Usar

### Adicionar uma Despesa

1. Acesse **Gestão Pessoal** no menu
2. Clique em **+ Nova Transação**
3. Selecione **Despesa**
4. Escolha a **Categoria** (ex: Alimentação)
5. Digite a **Descrição** (ex: "Almoço no restaurante")
6. Informe o **Valor**
7. Selecione a **Data**
8. Escolha o **Método de Pagamento**
9. Adicione **Notas** (opcional)
10. Clique em **Salvar**

### Adicionar uma Receita

1. Acesse **Gestão Pessoal** no menu
2. Clique em **+ Nova Transação**
3. Selecione **Receita**
4. Escolha a **Categoria** (ex: Salário)
5. Digite a **Descrição** (ex: "Salário de Novembro")
6. Informe o **Valor**
7. Selecione a **Data**
8. Escolha o **Método de Pagamento**
9. Clique em **Salvar**

### Ver Relatórios

1. Acesse **Relatórios Pessoais** no menu
2. Selecione o **Mês** e **Ano** desejados
3. Veja os gráficos e análises
4. Leia os **Insights** para entender seus hábitos

## 📊 Estrutura de Dados

### Coleções no Firestore

```
personal_transactions/
  {transactionId}/
    - userId: string
    - type: 'receita' | 'despesa'
    - category: string
    - description: string
    - amount: number
    - date: timestamp
    - paymentMethod: string
    - isRecurring: boolean
    - tags: array (opcional)
    - notes: string (opcional)
    - createdAt: timestamp
    - updatedAt: timestamp

personal_categories/
  {categoryId}/
    - userId: string
    - name: string
    - type: 'receita' | 'despesa'
    - icon: string
    - color: string
    - createdAt: timestamp
```

## 🔒 Segurança

- ✅ Dados completamente isolados por usuário
- ✅ Não interfere com dados comerciais
- ✅ Regras de segurança do Firebase aplicadas
- ✅ Cada usuário vê apenas seus próprios dados

## 🎨 Personalização

### Adicionar Nova Categoria

Você pode adicionar categorias personalizadas editando o serviço:

```typescript
// src/services/personalFinanceService.ts
await personalFinanceService.createCategory({
  name: 'Pets',
  icon: '🐶',
  color: '#FF6B6B',
  type: 'despesa',
  userId: user.uid
}, user.uid);
```

### Alterar Categorias Padrão

Edite as constantes em `personalFinanceService.ts`:

```typescript
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Sua Categoria', icon: '🎯', color: '#FF6B6B' },
  // ... adicione mais
];
```

## 📈 Relatórios Disponíveis

### Resumo Mensal
- Total de receitas
- Total de despesas
- Saldo do período
- Número de transações

### Análise por Categoria
- Gráfico de barras com percentuais
- Ranking de categorias
- Comparação visual

### Insights Automáticos
- ⚠️ Alerta quando despesas > receitas
- ✅ Parabéns quando há economia
- 📊 Maior categoria de despesa
- 💰 Taxa de economia do período

## 🔄 Diferenças do Módulo Comercial

| Característica | Comercial | Pessoal |
|---------------|-----------|---------|
| **Propósito** | Gestão do negócio | Finanças pessoais |
| **Clientes** | Sim | Não |
| **Produtos** | Sim | Não |
| **Estoque** | Sim | Não |
| **Fiados** | Sim | Não |
| **Categorias** | Receitas/Despesas do negócio | Receitas/Despesas pessoais |
| **Relatórios** | Análise comercial | Análise pessoal |
| **Dados** | Separados | Separados |

## 💡 Dicas de Uso

1. **Registre Diariamente**: Anote suas despesas assim que acontecem
2. **Use Categorias Corretas**: Facilita a análise posterior
3. **Adicione Notas**: Ajuda a lembrar detalhes importantes
4. **Revise Mensalmente**: Veja os relatórios todo mês
5. **Defina Metas**: Use os insights para melhorar seus hábitos
6. **Não Misture**: Mantenha pessoal separado do comercial

## 🚀 Próximos Passos

Possíveis melhorias futuras:
- 🔄 Transações recorrentes automáticas
- 🎯 Metas de economia por categoria
- 📊 Comparação entre meses
- 📱 Exportar relatórios em PDF
- 💳 Integração com bancos
- 📈 Gráficos de evolução temporal
- 🏷️ Tags personalizadas
- 🔔 Alertas de gastos excessivos

## ❓ Perguntas Frequentes

**P: Os dados pessoais aparecem nos relatórios comerciais?**
R: Não! São completamente separados.

**P: Posso usar as mesmas categorias?**
R: Não, cada módulo tem suas próprias categorias.

**P: Preciso de assinatura premium?**
R: Não, a gestão pessoal está disponível para todos.

**P: Posso exportar meus dados?**
R: Atualmente não, mas está nos planos futuros.

**P: Como faço backup?**
R: Os dados estão no Firebase, que já faz backup automático.

## 📞 Suporte

Se tiver dúvidas ou sugestões sobre o módulo de Gestão Pessoal, entre em contato através das configurações do sistema.

---

**Lembre-se**: Manter suas finanças pessoais organizadas é tão importante quanto gerenciar seu negócio! 💰✨

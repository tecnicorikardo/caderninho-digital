# 🔔 Sistema de Notificações - Caderninho Digital

## Visão Geral

O sistema de notificações foi implementado usando Firebase Firestore e monitora eventos importantes do seu negócio em tempo real.

## Tipos de Notificações

### 1. 📦 Estoque Baixo
- **Quando**: Produto atinge ou fica abaixo do estoque mínimo
- **Frequência**: Uma vez a cada 24 horas por produto
- **Ação**: Reabastecer o produto

### 2. 💰 Pagamento Recebido
- **Quando**: Cliente paga fiado
- **Frequência**: Imediata
- **Ação**: Confirmar recebimento

### 3. 🎉 Nova Venda
- **Quando**: Venda é registrada
- **Frequência**: Imediata
- **Ação**: Informativa

### 4. 🚀 Venda Importante
- **Quando**: Venda acima de R$ 500
- **Frequência**: Imediata
- **Ação**: Comemorar!

### 5. ⏰ Fiado Vencido
- **Quando**: Fiado passa da data de vencimento
- **Frequência**: Uma vez a cada 7 dias
- **Ação**: Cobrar cliente

## Como Funciona

### Monitoramento Automático

O sistema monitora automaticamente:
- Alterações no estoque
- Novos pagamentos
- Vendas registradas
- Datas de vencimento

### Notificações em Tempo Real

1. **Toast Notifications**: Aparecem no canto da tela quando algo acontece
2. **Sino de Notificações**: Mostra contador de notificações não lidas
3. **Centro de Notificações**: Histórico completo de todas as notificações

## Usando o Sistema

### Ver Notificações

1. Clique no sino 🔔 no topo da página
2. Veja todas as notificações não lidas (destacadas)
3. Clique em uma notificação para marcá-la como lida
4. Use "Marcar todas como lidas" para limpar tudo

### Notificações Toast

- Aparecem automaticamente quando eventos ocorrem
- Desaparecem após 5 segundos
- Cores diferentes para cada tipo de evento

## Estrutura Técnica

### Coleção no Firestore

```
notifications/
  {notificationId}/
    - userId: string
    - title: string
    - message: string
    - type: 'info' | 'warning' | 'success' | 'error' | 'stock' | 'payment' | 'sale'
    - read: boolean
    - createdAt: timestamp
    - metadata: object (dados adicionais)
```

### Serviços

- **notificationService.ts**: Criar e gerenciar notificações
- **useNotifications.ts**: Hook para monitoramento automático
- **NotificationBell.tsx**: Componente do sino
- **NotificationToast.tsx**: Toast em tempo real

## Personalizações

### Adicionar Nova Notificação

```typescript
import { notifyCustom } from '../services/notificationService';

await notifyCustom(
  userId,
  '🎯 Título',
  'Mensagem da notificação',
  'success'
);
```

### Alterar Frequência

Edite os valores em `useNotifications.ts`:
- Estoque baixo: `hasRecentNotification(userId, title, 24)` (24 horas)
- Fiado vencido: `hasRecentNotification(userId, title, 24 * 7)` (7 dias)

### Alterar Limite de Venda Grande

Edite em `saleService.ts`:
```typescript
if (total >= 500) { // Altere o valor aqui
  await notifyBigSale(userId, total, saleData.clientName);
}
```

## Regras do Firestore

Certifique-se de ter estas regras configuradas:

```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

## Índices Necessários

O Firestore pode solicitar estes índices:

1. **notifications**
   - userId (Ascending)
   - createdAt (Descending)

2. **notifications**
   - userId (Ascending)
   - read (Ascending)
   - createdAt (Descending)

O Firebase mostrará links para criar os índices automaticamente quando necessário.

## Benefícios

✅ **Nunca perca eventos importantes**
✅ **Monitore seu negócio em tempo real**
✅ **Tome ações rápidas quando necessário**
✅ **Histórico completo de eventos**
✅ **Notificações inteligentes (sem spam)**

## Próximos Passos

Possíveis melhorias futuras:
- 📧 Notificações por email
- 📱 Push notifications (PWA)
- 🔊 Notificações sonoras
- ⚙️ Configurações personalizadas por usuário
- 📊 Relatório de notificações

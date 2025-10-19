# API para Agentes - Sistema de Gestão

## Visão Geral

Este documento descreve como configurar e usar a API para comunicação com agentes externos no sistema de gestão.

## Configuração

### 1. Instalar Firebase Functions

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Fazer login no Firebase
firebase login

# Navegar para a pasta functions
cd functions

# Instalar dependências
npm install
```

### 2. Deploy das Functions

```bash
# Deploy das functions
firebase deploy --only functions

# Ou deploy completo
npm run deploy
```

### 3. URLs das Functions

Após o deploy, suas functions estarão disponíveis em:
- **API Principal**: `https://us-central1-web-gestao-37a85.cloudfunctions.net/agentAPI`
- **Webhook**: `https://us-central1-web-gestao-37a85.cloudfunctions.net/agentWebhook`

## Uso da API

### Estrutura da Requisição

```json
{
  "userId": "ID_DO_USUARIO",
  "action": "ACAO_DESEJADA",
  "data": { /* dados opcionais */ },
  "token": "TOKEN_DE_AUTENTICACAO" // opcional
}
```

### Ações Disponíveis

#### 1. Buscar Vendas
```json
{
  "userId": "user123",
  "action": "get_sales"
}
```

#### 2. Criar Venda
```json
{
  "userId": "user123",
  "action": "create_sale",
  "data": {
    "clientName": "João Silva",
    "products": [
      {
        "name": "Produto A",
        "price": 10.50,
        "quantity": 2
      }
    ],
    "total": 21.00,
    "paymentMethod": "dinheiro"
  }
}
```

#### 3. Buscar Clientes
```json
{
  "userId": "user123",
  "action": "get_clients"
}
```

#### 4. Dashboard
```json
{
  "userId": "user123",
  "action": "get_dashboard"
}
```

## Exemplos de Agentes

### JavaScript/Node.js
```javascript
const agent = new GestaoAgent('USER_ID');
const sales = await agent.getSales();
```

### Python
```python
agent = GestaoAgent('USER_ID')
sales = agent.get_sales()
```

### cURL
```bash
curl -X POST https://us-central1-web-gestao-37a85.cloudfunctions.net/agentAPI \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "action": "get_sales"
  }'
```

## Autenticação

Para usar autenticação (recomendado para produção):

1. Obtenha um token de autenticação do Firebase
2. Inclua o token na requisição:

```json
{
  "userId": "user123",
  "action": "get_sales",
  "token": "SEU_TOKEN_FIREBASE"
}
```

## Segurança

### Regras do Firestore
Certifique-se de que suas regras do Firestore permitam acesso via Functions:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso via Functions
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Variáveis de Ambiente
Para maior segurança, use variáveis de ambiente:

```bash
firebase functions:config:set api.key="SUA_CHAVE_SECRETA"
```

## Monitoramento

### Logs das Functions
```bash
firebase functions:log
```

### Métricas
Acesse o console do Firebase para ver métricas de uso das functions.

## Limitações

- **Timeout**: Functions têm timeout de 60 segundos por padrão
- **Memória**: 256MB por padrão (pode ser aumentado)
- **Requests**: Limite de requests simultâneos
- **Cold Start**: Primeira execução pode ser mais lenta

## Troubleshooting

### Erro de Permissão
- Verifique as regras do Firestore
- Confirme que o usuário está autenticado

### Timeout
- Otimize consultas ao banco
- Use paginação para grandes datasets

### CORS
- As functions já estão configuradas com CORS habilitado

## Próximos Passos

1. **Deploy das Functions**: `firebase deploy --only functions`
2. **Testar API**: Use os exemplos fornecidos
3. **Integrar Agente**: Adapte os exemplos para seu caso de uso
4. **Monitorar**: Acompanhe logs e métricas

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `firebase functions:log`
2. Consulte a documentação do Firebase Functions
3. Teste com os exemplos fornecidos
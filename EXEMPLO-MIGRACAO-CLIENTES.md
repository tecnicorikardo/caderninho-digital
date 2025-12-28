# 📝 Exemplo de Migração - Página de Clientes

## Objetivo

Demonstrar como migrar botões inline para componentes padronizados na página de Clientes.

---

## 🔧 Passo 1: Importar Componentes

### Antes
```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
```

### Depois
```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import { MobileButton } from '../../components/MobileButton';
import { CardHeader } from '../../components/CardHeader';
```

---

## 🎨 Passo 2: Adicionar Hook de Responsividade

### Adicionar no início do componente
```tsx
export function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useWindowSize(); // ← ADICIONAR ESTA LINHA
  
  // ... resto do código
}
```

---

## 📱 Passo 3: Atualizar Header da Página

### Antes
```tsx
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  marginBottom: '2rem'
}}>
  <div>
    <h1>Clientes</h1>
    <button
      onClick={() => navigate('/')}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginTop: '0.5rem'
      }}
    >
      ← Voltar ao Dashboard
    </button>
  </div>
  
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <button
      onClick={handleCreateClient}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500'
      }}
    >
      + Novo Cliente
    </button>
  </div>
</div>
```

### Depois
```tsx
<div style={{ 
  display: 'flex', 
  flexDirection: isMobile ? 'column' : 'row',
  justifyContent: 'space-between', 
  alignItems: isMobile ? 'stretch' : 'center',
  gap: isMobile ? '1rem' : '0',
  marginBottom: '2rem'
}}>
  <div>
    <h1 style={{ marginBottom: isMobile ? '0.5rem' : '0' }}>Clientes</h1>
    <MobileButton
      onClick={() => navigate('/')}
      variant="secondary"
      size="sm"
      icon="←"
      style={{ marginTop: '0.5rem' }}
    >
      Voltar ao Dashboard
    </MobileButton>
  </div>
  
  <div className={isMobile ? 'btn-group-mobile' : ''} style={{ 
    display: 'flex', 
    gap: '1rem', 
    alignItems: 'center',
    flexDirection: isMobile ? 'column' : 'row'
  }}>
    <MobileButton
      onClick={handleCreateClient}
      variant="success"
      icon="+"
    >
      Novo Cliente
    </MobileButton>
  </div>
</div>
```

---

## 🗂️ Passo 4: Usar CardHeader para Lista

### Antes
```tsx
<div style={{ marginBottom: '2rem' }}>
  <h2>Lista de Clientes</h2>
  {/* Conteúdo */}
</div>
```

### Depois
```tsx
<CardHeader
  title="Lista de Clientes"
  icon="👥"
  actions={
    <MobileButton
      onClick={handleCreateClient}
      variant="success"
      icon="+"
      size="sm"
    >
      Adicionar
    </MobileButton>
  }
>
  {/* Conteúdo da lista */}
</CardHeader>
```

---

## 🎯 Passo 5: Atualizar Botões de Ação nos Cards

### Antes
```tsx
<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
  <button
    onClick={() => handleEditClient(client)}
    style={{
      padding: '0.5rem 1rem',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
  >
    ✏️ Editar
  </button>
  
  <button
    onClick={() => handleShareClient(client)}
    style={{
      padding: '0.5rem 1rem',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
  >
    📤 Compartilhar
  </button>
  
  <button
    onClick={() => handleDeleteClient(client.id)}
    style={{
      padding: '0.5rem 1rem',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
  >
    🗑️ Excluir
  </button>
</div>
```

### Depois
```tsx
<div className={isMobile ? 'btn-group-mobile' : 'btn-group-mobile-row'} style={{ 
  display: 'flex', 
  gap: '0.75rem', 
  justifyContent: 'flex-end',
  flexDirection: isMobile ? 'column' : 'row'
}}>
  <MobileButton
    onClick={() => handleEditClient(client)}
    variant="primary"
    icon="✏️"
    size="sm"
  >
    Editar
  </MobileButton>
  
  <MobileButton
    onClick={() => handleShareClient(client)}
    variant="success"
    icon="📤"
    size="sm"
  >
    Compartilhar
  </MobileButton>
  
  <MobileButton
    onClick={() => handleDeleteClient(client.id)}
    variant="danger"
    icon="🗑️"
    size="sm"
  >
    Excluir
  </MobileButton>
</div>
```

---

## 📋 Passo 6: Atualizar Formulário

### Antes
```tsx
<form onSubmit={handleSubmit}>
  {/* Campos do formulário */}
  
  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
    <button
      type="button"
      onClick={() => setShowForm(false)}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      Cancelar
    </button>
    <button
      type="submit"
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      {editingClient ? 'Atualizar' : 'Criar'} Cliente
    </button>
  </div>
</form>
```

### Depois
```tsx
<form onSubmit={handleSubmit}>
  {/* Campos do formulário */}
  
  <div className="btn-group-mobile" style={{ 
    display: 'flex', 
    gap: '1rem', 
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    flexDirection: isMobile ? 'column-reverse' : 'row'
  }}>
    <MobileButton
      type="button"
      onClick={() => setShowForm(false)}
      variant="secondary"
    >
      Cancelar
    </MobileButton>
    
    <MobileButton
      type="submit"
      variant="success"
      icon={editingClient ? '✅' : '➕'}
    >
      {editingClient ? 'Atualizar' : 'Criar'} Cliente
    </MobileButton>
  </div>
</form>
```

---

## 📊 Resultado Final

### Benefícios da Migração

✅ **Consistência Visual**
- Todos os botões seguem o mesmo padrão
- Cores e tamanhos padronizados
- Espaçamento uniforme

✅ **Responsividade Automática**
- Botões se adaptam ao tamanho da tela
- Empilhamento vertical em mobile
- Tamanho de toque adequado (48px mínimo)

✅ **Manutenibilidade**
- Código mais limpo e legível
- Fácil de atualizar estilos globalmente
- Menos código duplicado

✅ **Acessibilidade**
- Tamanhos adequados para toque
- Contraste de cores apropriado
- Feedback visual consistente

✅ **Performance**
- Menos estilos inline
- Reutilização de componentes
- CSS otimizado

---

## 🎯 Checklist de Migração

### Para cada página:

- [ ] Importar `useWindowSize` e `MobileButton`
- [ ] Adicionar `const { isMobile } = useWindowSize()`
- [ ] Substituir botões do header
- [ ] Substituir botões de ação
- [ ] Substituir botões de formulário
- [ ] Adicionar classes `btn-group-mobile` onde necessário
- [ ] Testar em mobile (DevTools ou dispositivo real)
- [ ] Verificar tamanhos de toque
- [ ] Validar espaçamento entre botões
- [ ] Testar todas as interações

---

## 🔍 Páginas Prioritárias para Migração

1. ✅ **Dashboard** - Já migrado
2. **Clientes** - Exemplo neste documento
3. **Vendas** - Muitos botões de ação
4. **Estoque** - Formulários e ações
5. **Financeiro** - Cards com múltiplas ações
6. **Fiados** - Botões de pagamento
7. **Relatórios** - Botões de exportação
8. **Configurações** - Formulários

---

## 💡 Dicas Importantes

### 1. Ordem dos Botões em Mobile
```tsx
// Em mobile, inverta a ordem para botão primário ficar em cima
<div style={{ 
  flexDirection: isMobile ? 'column-reverse' : 'row'
}}>
  <MobileButton variant="secondary">Cancelar</MobileButton>
  <MobileButton variant="success">Salvar</MobileButton>
</div>
```

### 2. Botões com Conteúdo Complexo
```tsx
<MobileButton
  onClick={handleAction}
  variant="success"
  style={{
    padding: '1.25rem',
    justifyContent: 'flex-start',
    textAlign: 'left'
  }}
>
  <div style={{ flex: 1 }}>
    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
      Título
    </div>
    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
      Descrição
    </div>
  </div>
</MobileButton>
```

### 3. Botões Condicionais
```tsx
{canEdit && (
  <MobileButton
    onClick={handleEdit}
    variant="primary"
    icon="✏️"
  >
    Editar
  </MobileButton>
)}
```

### 4. Loading State
```tsx
<MobileButton
  onClick={handleSave}
  variant="success"
  disabled={loading}
>
  {loading ? 'Salvando...' : 'Salvar'}
</MobileButton>
```

---

**Última atualização:** Novembro 2025

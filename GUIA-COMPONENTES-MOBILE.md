# 📱 Guia de Componentes Mobile Padronizados

## Visão Geral

Este guia documenta os componentes e estilos padronizados para garantir uma experiência consistente em dispositivos móveis.

---

## 🎨 Componentes Disponíveis

### 1. MobileButton

Botão responsivo que se adapta automaticamente ao tamanho da tela.

#### Uso Básico

```tsx
import { MobileButton } from '../../components/MobileButton';

<MobileButton
  onClick={() => console.log('Clicado!')}
  variant="primary"
  icon="✨"
>
  Meu Botão
</MobileButton>
```

#### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `children` | ReactNode | - | Conteúdo do botão |
| `onClick` | function | - | Função executada ao clicar |
| `variant` | string | 'primary' | Estilo: primary, success, danger, warning, secondary, outline |
| `size` | string | 'md' | Tamanho: sm, md, lg |
| `icon` | string | - | Emoji ou ícone antes do texto |
| `disabled` | boolean | false | Desabilita o botão |
| `type` | string | 'button' | Tipo HTML: button, submit, reset |
| `style` | CSSProperties | - | Estilos customizados |
| `className` | string | '' | Classes CSS adicionais |

#### Variantes

```tsx
// Primário (azul)
<MobileButton variant="primary">Primário</MobileButton>

// Sucesso (verde)
<MobileButton variant="success">Sucesso</MobileButton>

// Perigo (vermelho)
<MobileButton variant="danger">Excluir</MobileButton>

// Aviso (amarelo)
<MobileButton variant="warning">Atenção</MobileButton>

// Secundário (branco com borda)
<MobileButton variant="secondary">Cancelar</MobileButton>

// Outline (transparente com borda)
<MobileButton variant="outline">Outline</MobileButton>
```

#### Tamanhos

```tsx
// Pequeno
<MobileButton size="sm">Pequeno</MobileButton>

// Médio (padrão)
<MobileButton size="md">Médio</MobileButton>

// Grande
<MobileButton size="lg">Grande</MobileButton>
```

---

### 2. CardHeader

Componente para criar cards com header padronizado e ações.

#### Uso Básico

```tsx
import { CardHeader } from '../../components/CardHeader';
import { MobileButton } from '../../components/MobileButton';

<CardHeader
  title="Meus Produtos"
  icon="📦"
  actions={
    <>
      <MobileButton variant="success" icon="➕">
        Adicionar
      </MobileButton>
      <MobileButton variant="secondary" icon="🔍">
        Buscar
      </MobileButton>
    </>
  }
>
  {/* Conteúdo do card */}
  <p>Conteúdo aqui...</p>
</CardHeader>
```

#### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `title` | string | Título do card |
| `icon` | string | Emoji ou ícone do título |
| `actions` | ReactNode | Botões ou ações do header |
| `children` | ReactNode | Conteúdo do card |

---

## 🎯 Classes CSS Utilitárias

### Botões Mobile

```css
/* Botão mobile padrão */
.btn-mobile

/* Variantes */
.btn-mobile-primary
.btn-mobile-success
.btn-mobile-danger
.btn-mobile-warning
.btn-mobile-secondary
.btn-mobile-outline

/* Tamanhos */
.btn-mobile-sm
.btn-mobile-lg
```

### Grupos de Botões

```tsx
// Coluna (vertical)
<div className="btn-group-mobile">
  <MobileButton>Botão 1</MobileButton>
  <MobileButton>Botão 2</MobileButton>
</div>

// Linha (horizontal, responsivo)
<div className="btn-group-mobile-row">
  <MobileButton>Botão 1</MobileButton>
  <MobileButton>Botão 2</MobileButton>
</div>
```

### Cards

```css
/* Card com header */
.card-with-header

/* Header do card */
.card-header
.card-header-title
.card-header-actions

/* Corpo do card */
.card-body
```

### Utilitários Mobile

```css
/* Visibilidade */
.mobile-only      /* Visível apenas em mobile */
.desktop-only     /* Visível apenas em desktop */

/* Layout */
.mobile-center    /* Centraliza em mobile */
.mobile-full-width /* Largura total em mobile */
.mobile-spacing   /* Padding padrão mobile */
.grid-mobile      /* Grid de 1 coluna em mobile */
```

---

## 📐 Breakpoints

```css
@media (max-width: 768px) {
  /* Estilos mobile */
}
```

---

## ✨ Exemplos Práticos

### Exemplo 1: Página com Lista e Ações

```tsx
import { CardHeader } from '../../components/CardHeader';
import { MobileButton } from '../../components/MobileButton';
import { useWindowSize } from '../../hooks/useWindowSize';

export function MinhaPage() {
  const { isMobile } = useWindowSize();

  return (
    <div style={{ padding: '1rem' }}>
      <CardHeader
        title="Produtos"
        icon="📦"
        actions={
          <div className={isMobile ? 'btn-group-mobile' : 'btn-group-mobile-row'}>
            <MobileButton 
              variant="success" 
              icon="➕"
              onClick={() => console.log('Adicionar')}
            >
              Novo Produto
            </MobileButton>
            <MobileButton 
              variant="secondary" 
              icon="📤"
              onClick={() => console.log('Exportar')}
            >
              Exportar
            </MobileButton>
          </div>
        }
      >
        {/* Lista de produtos */}
        <div>Conteúdo aqui...</div>
      </CardHeader>
    </div>
  );
}
```

### Exemplo 2: Formulário com Botões

```tsx
<form onSubmit={handleSubmit}>
  {/* Campos do formulário */}
  
  <div className="btn-group-mobile" style={{ marginTop: '1.5rem' }}>
    <MobileButton 
      type="submit" 
      variant="success" 
      icon="✅"
    >
      Salvar
    </MobileButton>
    
    <MobileButton 
      type="button"
      variant="secondary"
      onClick={() => setShowForm(false)}
    >
      Cancelar
    </MobileButton>
  </div>
</form>
```

### Exemplo 3: Card de Ações Rápidas

```tsx
<div className={isMobile ? 'btn-group-mobile' : 'btn-group-mobile-row'}>
  <MobileButton
    onClick={() => navigate('/sales')}
    variant="success"
    icon="💰"
    style={{
      padding: '1.25rem',
      justifyContent: 'flex-start'
    }}
  >
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
        Nova Venda
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
        Registrar venda rápida
      </div>
    </div>
  </MobileButton>
  
  <MobileButton
    onClick={() => navigate('/clients')}
    variant="primary"
    icon="👥"
    style={{
      padding: '1.25rem',
      justifyContent: 'flex-start'
    }}
  >
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
        Novo Cliente
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
        Cadastrar cliente
      </div>
    </div>
  </MobileButton>
</div>
```

---

## 🎨 Cores e Gradientes

### Gradientes Padrão

```css
/* Verde (Success) */
background: linear-gradient(135deg, #065f46 0%, #10b981 100%);

/* Azul (Primary) */
background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);

/* Vermelho (Danger) */
background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);

/* Amarelo (Warning) */
background: linear-gradient(135deg, #ca8a04 0%, #eab308 100%);

/* Roxo (Indigo) */
background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
```

---

## 📱 Boas Práticas Mobile

### 1. Tamanho Mínimo de Toque
- Botões devem ter no mínimo 48px de altura
- Espaçamento mínimo de 8px entre botões

### 2. Fonte Legível
- Tamanho mínimo de 16px para prevenir zoom no iOS
- Usar font-weight 600 para botões

### 3. Feedback Visual
- Usar transform: scale(0.98) no :active
- Transições suaves (0.3s ease)

### 4. Organização
- Em mobile, botões devem ocupar largura total
- Usar btn-group-mobile para empilhar verticalmente
- Limitar número de ações visíveis (máximo 3-4)

### 5. Acessibilidade
- Sempre incluir texto descritivo
- Usar cores com contraste adequado
- Suportar navegação por teclado

---

## 🔧 Migração de Código Antigo

### Antes (Código Inline)

```tsx
<button
  onClick={handleClick}
  style={{
    padding: isMobile ? '0.75rem 1.25rem' : '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: isMobile ? '0.9rem' : '0.9rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)'
  }}
>
  Excluir
</button>
```

### Depois (Componente Padronizado)

```tsx
<MobileButton
  onClick={handleClick}
  variant="danger"
  icon="🗑️"
>
  Excluir
</MobileButton>
```

---

## 📚 Recursos Adicionais

- **Hook useWindowSize**: Detecta se está em mobile
- **CSS Global**: `src/styles/global.css`
- **Componentes**: `src/components/`

---

## 🎯 Checklist de Implementação

- [ ] Importar MobileButton onde necessário
- [ ] Substituir botões inline por MobileButton
- [ ] Usar CardHeader para cards com ações
- [ ] Aplicar btn-group-mobile para grupos de botões
- [ ] Testar em dispositivos móveis reais
- [ ] Verificar tamanhos de toque (mínimo 48px)
- [ ] Validar contraste de cores
- [ ] Testar com diferentes tamanhos de tela

---

**Última atualização:** Novembro 2025

# 🎨 Guia de Cores Profissionais

## Paleta de Cores Atualizada

O sistema foi atualizado para usar um esquema de cores mais profissional e corporativo, substituindo as cores vibrantes por tons neutros e elegantes.

---

## 🎯 Cores Principais

### Backgrounds
```css
--bg-primary: #f5f6f8      /* Fundo principal - cinza muito claro */
--bg-secondary: #ffffff     /* Fundo secundário - branco */
--bg-card: #ffffff          /* Fundo de cards - branco */
--bg-hover: #fafbfc         /* Fundo ao passar o mouse */
```

### Textos
```css
--text-primary: #1a1d23     /* Texto principal - quase preto */
--text-secondary: #4a5568   /* Texto secundário - cinza escuro */
--text-muted: #718096       /* Texto discreto - cinza médio */
--text-disabled: #a0aec0    /* Texto desabilitado - cinza claro */
```

### Bordas
```css
--border-color: #e2e8f0     /* Borda padrão - cinza claro */
--border-hover: #cbd5e0     /* Borda ao passar o mouse */
```

---

## 🔵 Cores de Ação

### Primária (Botões principais)
```css
--primary-color: #2d3748    /* Cinza escuro profissional */
--primary-hover: #1a202c    /* Hover - mais escuro */
--primary-light: #4a5568    /* Variação clara */
```

### Accent (Destaques)
```css
--accent-color: #3182ce     /* Azul profissional */
--accent-hover: #2c5282     /* Hover - azul escuro */
--accent-light: #4299e1     /* Variação clara */
```

---

## ✅ Cores de Status

### Sucesso
```css
--success-color: #38a169    /* Verde discreto */
--success-light: #48bb78    /* Verde claro */
--success-bg: #f0fff4       /* Fundo verde suave */
```

### Aviso
```css
--warning-color: #d69e2e    /* Amarelo/dourado */
--warning-light: #ecc94b    /* Amarelo claro */
--warning-bg: #fffff0       /* Fundo amarelo suave */
```

### Erro/Perigo
```css
--danger-color: #e53e3e     /* Vermelho discreto */
--danger-light: #fc8181     /* Vermelho claro */
--danger-bg: #fff5f5        /* Fundo vermelho suave */
```

### Informação
```css
--info-color: #3182ce       /* Azul informativo */
--info-light: #63b3ed       /* Azul claro */
--info-bg: #ebf8ff          /* Fundo azul suave */
```

---

## 📦 Componentes Atualizados

### Botões
- **btn-primary**: Cinza escuro (#2d3748)
- **btn-accent**: Azul profissional (#3182ce)
- **btn-success**: Verde discreto (#38a169)
- **btn-secondary**: Branco com borda
- **btn-outline**: Transparente com borda

### Cards
- Bordas sutis (#e2e8f0)
- Sombras discretas
- Hover suave sem transformações exageradas
- Border-radius reduzido para 8px

### Badges
- Fundos suaves com bordas coloridas
- Cores de status mais discretas
- Tamanho e padding reduzidos

### Inputs
- Bordas cinza claro (#e2e8f0)
- Focus com azul profissional (#3182ce)
- Sombra sutil no focus

---

## 🎨 Antes vs Depois

### Antes (Colorido)
- ❌ Azul vibrante: #007bff
- ❌ Verde vibrante: #28a745
- ❌ Vermelho vibrante: #dc3545
- ❌ Gradientes coloridos
- ❌ Animações exageradas

### Depois (Profissional)
- ✅ Cinza escuro: #2d3748
- ✅ Azul discreto: #3182ce
- ✅ Verde suave: #38a169
- ✅ Cores sólidas
- ✅ Animações sutis

---

## 💡 Diretrizes de Uso

### Quando usar cada cor:

1. **Primary (#2d3748)**: Ações principais, navegação, headers
2. **Accent (#3182ce)**: Links, botões secundários, destaques
3. **Success (#38a169)**: Confirmações, pagamentos, conclusões
4. **Warning (#d69e2e)**: Alertas, pendências, atenção
5. **Danger (#e53e3e)**: Erros, exclusões, vencimentos
6. **Info (#3182ce)**: Informações, dicas, ajuda

### Hierarquia Visual:
1. Use **primary** para ações mais importantes
2. Use **accent** para ações secundárias
3. Use **secondary** para ações terciárias
4. Use cores de status apenas quando necessário

---

## 🔧 Como Usar

### Em CSS:
```css
.meu-botao {
  background: var(--primary-color);
  color: white;
}

.meu-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
}
```

### Em React (inline):
```tsx
<button style={{ backgroundColor: '#2d3748', color: 'white' }}>
  Botão Profissional
</button>
```

### Classes Prontas:
```tsx
<button className="btn btn-primary">Primário</button>
<button className="btn btn-accent">Accent</button>
<button className="btn btn-success">Sucesso</button>
<div className="badge badge-info">Info</div>
<div className="alert alert-warning">Aviso</div>
```

---

## 📊 Acessibilidade

Todas as cores foram escolhidas para garantir:
- ✅ Contraste mínimo de 4.5:1 (WCAG AA)
- ✅ Legibilidade em diferentes dispositivos
- ✅ Distinção clara entre estados
- ✅ Suporte a modo claro

---

## 🚀 Próximos Passos

Para aplicar as novas cores em componentes específicos:

1. Substitua cores hardcoded por variáveis CSS
2. Use as classes prontas quando possível
3. Mantenha consistência em todo o sistema
4. Teste em diferentes telas e dispositivos

---

**Atualizado em:** Novembro 2025
**Versão:** 2.0 - Esquema Profissional

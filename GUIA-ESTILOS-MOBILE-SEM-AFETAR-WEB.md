# 📱 Guia: Estilos Mobile sem Afetar Web

## ✅ **GARANTIA: Web permanece inalterada**

O Capacitor permite detectar a plataforma e aplicar estilos específicos para mobile **sem afetar a web**.

---

## 🔍 **Como funciona a detecção:**

### **JavaScript - Detectar Plataforma**
```typescript
import { Capacitor } from '@capacitor/core';

// Verificar se está no mobile
const isMobile = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'web', 'android', 'ios'

if (isMobile) {
  // Código específico para mobile
} else {
  // Código específico para web
}
```

### **CSS - Classes Condicionais**
```css
/* Estilos para web (padrão) */
.header {
  height: 60px;
  background: #fff;
}

/* Estilos específicos para mobile */
.mobile .header {
  height: 80px;
  background: #f0f0f0;
  padding-top: 20px; /* Para status bar */
}

/* Estilos específicos para Android */
.android .header {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Estilos específicos para iOS */
.ios .header {
  border-bottom: 1px solid #e0e0e0;
}
```

---

## 🛠 **Implementação Prática:**

### **1. Adicionar detecção de plataforma no App.tsx**
```typescript
// src/App.tsx
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

function App() {
  useEffect(() => {
    // Adicionar classes CSS baseadas na plataforma
    const platform = Capacitor.getPlatform();
    document.body.classList.add(platform);
    
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.add('web');
    }
  }, []);

  return (
    // Seu app atual...
  );
}
```

### **2. Criar arquivo CSS específico para mobile**
```css
/* src/styles/mobile.css */

/* Aplicado apenas quando body tem classe 'mobile' */
.mobile {
  /* Ajustes globais para mobile */
  font-size: 16px; /* Evita zoom no iOS */
  -webkit-text-size-adjust: 100%;
}

.mobile .header {
  /* Header específico para mobile */
  padding-top: 20px; /* Espaço para status bar */
  height: 80px;
}

.mobile .button {
  /* Botões maiores no mobile */
  min-height: 48px;
  font-size: 16px;
}

.mobile .modal {
  /* Modais full-screen no mobile */
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

/* Web permanece com estilos originais */
.web .header {
  /* Mantém estilo original */
  height: 60px;
}

.web .button {
  /* Mantém estilo original */
  min-height: 40px;
}
```

### **3. Componente com estilos condicionais**
```typescript
// src/components/Header.tsx
import { Capacitor } from '@capacitor/core';

export function Header() {
  const isMobile = Capacitor.isNativePlatform();
  
  return (
    <header 
      className={`header ${isMobile ? 'mobile-header' : 'web-header'}`}
      style={{
        paddingTop: isMobile ? '20px' : '0', // Status bar no mobile
        height: isMobile ? '80px' : '60px'
      }}
    >
      <h1>Caderninho Digital</h1>
    </header>
  );
}
```

---

## 📱 **Exemplos de Ajustes Específicos para Mobile:**

### **1. Status Bar e Safe Area**
```css
.mobile {
  /* Espaço para status bar */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### **2. Botões Touch-Friendly**
```css
.mobile .btn {
  min-height: 48px; /* Tamanho mínimo para touch */
  padding: 12px 20px;
  font-size: 16px;
}

.web .btn {
  min-height: 36px; /* Menor para desktop */
  padding: 8px 16px;
  font-size: 14px;
}
```

### **3. Modais Full-Screen no Mobile**
```css
.mobile .modal {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  top: 0;
  left: 0;
}

.web .modal {
  max-width: 600px;
  border-radius: 8px;
  /* Centralizado na tela */
}
```

### **4. Navegação Específica**
```css
.mobile .navigation {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 60px;
}

.web .navigation {
  position: relative;
  width: auto;
  height: auto;
}
```

---

## 🔧 **Hook Personalizado para Plataforma:**

```typescript
// src/hooks/usePlatform.ts
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function usePlatform() {
  const [platform, setPlatform] = useState({
    isMobile: false,
    isWeb: true,
    isAndroid: false,
    isIOS: false,
    platform: 'web'
  });

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform();
    const isMobile = Capacitor.isNativePlatform();
    
    setPlatform({
      isMobile,
      isWeb: !isMobile,
      isAndroid: currentPlatform === 'android',
      isIOS: currentPlatform === 'ios',
      platform: currentPlatform
    });
  }, []);

  return platform;
}

// Uso no componente:
function MyComponent() {
  const { isMobile, isAndroid } = usePlatform();
  
  return (
    <div className={`component ${isMobile ? 'mobile' : 'web'}`}>
      {isMobile ? 'Versão Mobile' : 'Versão Web'}
    </div>
  );
}
```

---

## ✅ **Garantias:**

### **1. Web não é afetada**
- Classes CSS específicas (`.mobile`, `.web`)
- Detecção de plataforma em runtime
- Estilos condicionais

### **2. Mobile otimizado**
- Touch targets maiores
- Safe area respeitada
- Navegação mobile-friendly

### **3. Mesmo código base**
- Um projeto, múltiplas plataformas
- Manutenção simplificada
- Deploy único

---

## 🎯 **Exemplo Prático - Implementar Agora:**

Quer que eu implemente um exemplo específico? Por exemplo:
- Header com altura diferente
- Botões maiores no mobile
- Modal full-screen no mobile
- Navegação bottom no mobile

**A web continuará funcionando exatamente igual!** ✅
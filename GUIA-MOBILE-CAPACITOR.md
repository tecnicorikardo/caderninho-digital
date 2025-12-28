# Guia: Converter para App Mobile com Capacitor

## 1. Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Caderninho Digital" "com.caderninho.app"
```

## 2. Adicionar Plataformas

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

## 3. Configurar capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caderninho.app',
  appName: 'Caderninho Digital',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
```

## 4. Build e Sync

```bash
npm run build
npx cap sync
```

## 5. Abrir no Android Studio

```bash
npx cap open android
```

## 6. Plugins Úteis para seu App

```bash
# Notificações push
npm install @capacitor/push-notifications

# Camera para fotos de produtos
npm install @capacitor/camera

# Compartilhamento
npm install @capacitor/share

# Status bar
npm install @capacitor/status-bar
```

## Vantagens:
- ✅ Rápido (mantém todo código atual)
- ✅ Funciona com Firebase
- ✅ PWA existente continua funcionando
- ✅ Acesso a APIs nativas

## Desvantagens:
- ❌ Performance inferior ao nativo
- ❌ Tamanho do app maior
# Como Reverter as Mudanças (se necessário)

## Para voltar ao estado original:

### 1. Reverter App.tsx:
```typescript
// Remover esta linha:
import { initializeCapacitorPlugins } from './utils/capacitorPlugins';

// E remover esta linha do useEffect:
initializeCapacitorPlugins();
```

### 2. Deletar arquivos novos:
- `src/utils/capacitorPlugins.ts`
- `capacitor.config.ts`
- Pasta `android/`
- Pasta `ios/`

### 3. Remover dependências:
```bash
npm uninstall @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/status-bar @capacitor/splash-screen @capacitor/share @capacitor/toast
```

## Mas não precisa!

O sistema funciona **exatamente igual** na web. As mudanças só ativam no mobile.

Teste você mesmo:
- Abra no navegador: funciona igual
- PWA: funciona igual  
- Deploy: funciona igual
- Firebase: funciona igual
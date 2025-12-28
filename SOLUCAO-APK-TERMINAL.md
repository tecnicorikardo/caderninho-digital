# 🔧 Solução: Gerar APK pelo Terminal

## ❌ Problema Encontrado:
O Gradle está tentando usar Java 21, mas o Android precisa de Java 17. Isso é comum em projetos Capacitor.

## ✅ Soluções Disponíveis:

### **Opção 1: Android Studio (Mais Confiável)**
```bash
# Abrir projeto no Android Studio
npx cap open android
```

No Android Studio:
1. Build → Generate Signed Bundle/APK
2. Escolha "APK" → Next
3. Escolha "debug" → Finish
4. APK será gerado em: `android/app/build/outputs/apk/debug/`

### **Opção 2: Corrigir Java e tentar novamente**
```bash
# 1. Definir JAVA_HOME permanentemente
setx JAVA_HOME "C:\Program Files\Java\jdk-17"

# 2. Reiniciar terminal e tentar
cd android
gradlew clean assembleDebug
```

### **Opção 3: Usar Capacitor Live Reload (Teste Rápido)**
```bash
# Testar no celular sem gerar APK
npx cap run android --livereload --external
```

### **Opção 4: Gerar via Capacitor CLI**
```bash
# Build e abrir Android Studio automaticamente
npm run build
npx cap sync android
npx cap open android
```

## 🎯 Recomendação:

**Use a Opção 1 (Android Studio)** porque:
- ✅ Mais confiável
- ✅ Interface visual
- ✅ Detecta problemas automaticamente
- ✅ Gera APK assinado facilmente

## 📱 Após gerar o APK:

```bash
# Instalar no celular via USB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou enviar APK por WhatsApp/Email para instalar
```

## 🔍 Verificar se APK foi gerado:
```bash
dir android\app\build\outputs\apk\debug\
```

O arquivo será: `app-debug.apk` (cerca de 10-20MB)
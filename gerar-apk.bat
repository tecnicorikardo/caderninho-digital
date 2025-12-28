@echo off
echo ========================================
echo    GERADOR DE APK - CADERNINHO DIGITAL
echo ========================================
echo.

echo [1/4] Fazendo build da aplicacao web...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha no build da aplicacao web
    pause
    exit /b 1
)

echo.
echo [2/4] Sincronizando com Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERRO: Falha na sincronizacao
    pause
    exit /b 1
)

echo.
echo [3/4] Gerando APK debug...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ERRO: Falha na geracao do APK
    echo.
    echo SOLUCAO ALTERNATIVA:
    echo 1. Abra o Android Studio
    echo 2. Abra a pasta 'android' deste projeto
    echo 3. Build ^> Generate Signed Bundle/APK
    echo 4. Escolha APK ^> Next ^> Debug ^> Finish
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] APK gerado com sucesso!
echo.
echo Localizacao do APK:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Para instalar no celular:
echo 1. Ative 'Opcoes do desenvolvedor' no Android
echo 2. Ative 'Depuracao USB'
echo 3. Conecte o celular via USB
echo 4. Execute: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
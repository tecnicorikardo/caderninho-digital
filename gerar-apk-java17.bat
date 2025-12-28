@echo off
echo ========================================
echo    GERADOR DE APK - JAVA 17 FORCADO
echo ========================================

echo Configurando Java 17...
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=C:\Program Files\Java\jdk-17\bin;%PATH%

echo Verificando versao do Java...
java -version

echo.
echo Parando daemons do Gradle...
cd android
gradlew.bat --stop

echo.
echo Limpando build anterior...
gradlew.bat clean

echo.
echo Gerando APK com Java 17...
gradlew.bat assembleDebug

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo           APK GERADO COM SUCESSO!
    echo ========================================
    echo.
    echo Localizacao: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    dir app\build\outputs\apk\debug\*.apk
) else (
    echo.
    echo ========================================
    echo              ERRO NO BUILD
    echo ========================================
    echo.
    echo Tente abrir o Android Studio:
    echo npx cap open android
)

cd ..
pause
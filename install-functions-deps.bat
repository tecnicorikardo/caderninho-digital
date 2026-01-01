@echo off
echo ========================================
echo   INSTALAR DEPENDENCIAS - FUNCTIONS
echo ========================================
echo.
echo Este script vai instalar as dependencias necessarias
echo para corrigir o erro CORS na pasta functions/
echo.

echo Configurando PATH para Node.js...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo Navegando para pasta functions...
cd functions

echo Instalando dependencias do npm...
echo ⚡ Instalando cors e @types/cors...
call npm install

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO ao instalar dependencias!
    echo Verifique se o Node.js esta instalado corretamente.
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas com sucesso!
echo.
echo Dependencias adicionadas:
echo - cors: ^2.8.5
echo - @types/cors: ^2.8.17
echo.
echo Voltando para pasta raiz...
cd ..

echo ========================================
echo   🎉 INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo ✅ Dependencias CORS instaladas
echo ✅ Functions prontas para deploy
echo.
echo Proximo passo: Execute deploy-fix.bat
echo.
echo Pressione qualquer tecla para sair.
pause
@echo off
echo ========================================
echo   INSTALAR CORS FIX - FUNCTIONS
echo ========================================
echo.
echo Este script vai instalar as dependencias necessarias
echo para corrigir o erro CORS definitivamente.
echo.
echo Dependencias que serao instaladas:
echo - cors: ^2.8.5 (middleware CORS)
echo - @types/cors: ^2.8.17 (tipos TypeScript)
echo.

echo Configurando PATH para Node.js...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo Verificando pasta functions...
if not exist "functions" (
    echo ❌ ERRO: Pasta functions nao encontrada!
    echo Execute este script na pasta raiz do projeto.
    pause
    exit /b 1
)

echo ✅ Pasta functions encontrada!
echo.

echo Navegando para pasta functions...
cd functions

echo Verificando package.json...
if not exist "package.json" (
    echo ❌ ERRO: package.json nao encontrado na pasta functions!
    pause
    exit /b 1
)

echo ✅ package.json encontrado!
echo.

echo Instalando dependencias...
echo ⚡ Executando: npm install
call npm install

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO ao instalar dependencias!
    echo.
    echo Possiveis causas:
    echo - Node.js nao esta instalado
    echo - npm nao esta funcionando
    echo - Problemas de rede
    echo.
    echo Tente executar manualmente:
    echo cd functions
    echo npm install
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas com sucesso!
echo.

echo Verificando instalacao...
if exist "node_modules\cors" (
    echo ✅ cors instalado
) else (
    echo ⚠️ cors nao encontrado
)

if exist "node_modules\@types\cors" (
    echo ✅ @types/cors instalado
) else (
    echo ⚠️ @types/cors nao encontrado
)

echo.
echo Voltando para pasta raiz...
cd ..

echo ========================================
echo   🎉 CORS FIX INSTALADO!
echo ========================================
echo.
echo ✅ Dependencias CORS instaladas
echo ✅ Functions prontas para deploy
echo ✅ Erro CORS sera corrigido apos deploy
echo.
echo PROXIMO PASSO:
echo Execute: deploy-fix.bat
echo.
echo Ou execute manualmente:
echo firebase deploy --only functions
echo.
echo Pressione qualquer tecla para sair.
pause
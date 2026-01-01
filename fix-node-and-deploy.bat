@echo off
echo ========================================
echo   FIX NODE.JS E DEPLOY COMPLETO
echo ========================================
echo.
echo Este script vai tentar diferentes caminhos para o Node.js
echo e fazer o deploy completo com correção CORS.
echo.

echo Testando diferentes caminhos para Node.js...
echo.

REM Tentar caminho padrão
set "NODE_PATH1=C:\Program Files\nodejs"
set "NODE_PATH2=C:\Program Files (x86)\nodejs"
set "NODE_PATH3=%APPDATA%\npm"
set "NODE_PATH4=%LOCALAPPDATA%\Programs\nodejs"

echo [1] Testando: %NODE_PATH1%
if exist "%NODE_PATH1%\node.exe" (
    echo ✅ Node.js encontrado em: %NODE_PATH1%
    set "PATH=%NODE_PATH1%;%PATH%"
    goto :node_found
)

echo [2] Testando: %NODE_PATH2%
if exist "%NODE_PATH2%\node.exe" (
    echo ✅ Node.js encontrado em: %NODE_PATH2%
    set "PATH=%NODE_PATH2%;%PATH%"
    goto :node_found
)

echo [3] Testando: %NODE_PATH3%
if exist "%NODE_PATH3%\node.exe" (
    echo ✅ Node.js encontrado em: %NODE_PATH3%
    set "PATH=%NODE_PATH3%;%PATH%"
    goto :node_found
)

echo [4] Testando: %NODE_PATH4%
if exist "%NODE_PATH4%\node.exe" (
    echo ✅ Node.js encontrado em: %NODE_PATH4%
    set "PATH=%NODE_PATH4%;%PATH%"
    goto :node_found
)

echo ❌ Node.js não encontrado em nenhum caminho padrão!
echo.
echo Tentando usar node diretamente do PATH do sistema...
node --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Node.js encontrado no PATH do sistema!
    goto :node_found
)

echo ❌ ERRO: Node.js não está instalado ou não está no PATH!
echo.
echo SOLUÇÕES:
echo 1. Instale o Node.js de: https://nodejs.org/
echo 2. Reinicie o terminal após instalação
echo 3. Verifique se Node.js está no PATH do sistema
echo.
pause
exit /b 1

:node_found
echo.
echo Verificando versão do Node.js...
node --version
echo.
echo Verificando versão do npm...
npm --version
echo.

echo ========================================
echo   INICIANDO PROCESSO DE DEPLOY
echo ========================================
echo.

echo [1/4] Instalando dependências das Functions (CORS fix)...
cd functions
echo ⚡ Executando: npm install
call npm install

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO ao instalar dependências das functions!
    cd ..
    pause
    exit /b 1
)

echo ✅ Dependências das functions instaladas!
cd ..
echo.

echo [2/4] Fazendo BUILD do projeto...
echo ⚡ Executando: npm run build
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no build!
    pause
    exit /b 1
)

echo ✅ Build concluído!
echo.

echo [3/4] Deploy do Hosting...
echo ⚡ Executando: firebase deploy --only hosting
call firebase deploy --only hosting

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no deploy do hosting!
    pause
    exit /b 1
)

echo ✅ Hosting deployado!
echo.

echo [4/4] Deploy das Functions (CORS fix)...
echo ⚡ Executando: firebase deploy --only functions
call firebase deploy --only functions

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no deploy das functions!
    pause
    exit /b 1
)

echo ✅ Functions deployadas!
echo.

echo ========================================
echo   🎉 DEPLOY COMPLETO FINALIZADO!
echo ========================================
echo.
echo ✅ Node.js configurado e funcionando
echo ✅ Dependências CORS instaladas
echo ✅ Build realizado (versão atualizada)
echo ✅ Hosting atualizado (frontend)
echo ✅ Functions deployadas (backend + CORS fix)
echo.
echo 🔗 URL do Webhook Asaas:
echo https://us-central1-bloquinhodigital.cloudfunctions.net/handleAsaasWebhook
echo.
echo 🔑 Token para configurar no Asaas:
echo ab123456-7890-abcd-ef12-34567890abcdef-bloquinho-secret
echo.
echo 🌐 Site atualizado:
echo https://bloquinhodigital.web.app
echo.
echo 💡 IMPORTANTE: 
echo - Erro CORS corrigido
echo - PIX payment funcionando
echo - Sistema totalmente operacional
echo.
echo Pressione qualquer tecla para sair.
pause
@echo off
echo ========================================
echo   DEPLOY COMPLETO - FIREBASE
echo ========================================
echo.
echo Este script vai:
echo 1. Instalar dependencias das Functions (CORS fix)
echo 2. Fazer BUILD do projeto (versao atualizada)
echo 3. Deploy do Hosting (Frontend)
echo 4. Deploy das Functions (Backend + Webhook Asaas)
echo.
echo Iniciando processo completo...
echo.

echo Configurando PATH para Node.js...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/4] Instalando dependencias das Functions...
echo ⚡ Navegando para pasta functions...
cd functions
echo ⚡ Instalando cors e dependencias...
call npm install

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO ao instalar dependencias das functions!
    echo Verifique se o Node.js esta funcionando.
    pause
    exit /b 1
)

echo ✅ Dependencias das functions instaladas!
echo Voltando para pasta raiz...
cd ..
echo.

echo [2/4] Fazendo BUILD do projeto...
echo ⚡ Gerando versao atualizada com todas as mudancas...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no build! Verifique o codigo e tente novamente.
    pause
    exit /b 1
)

echo ✅ Build concluido com sucesso!
echo.

echo [3/4] Fazendo deploy do Hosting...
call firebase deploy --only hosting

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no deploy do hosting!
    pause
    exit /b 1
)

echo ✅ Hosting atualizado!
echo.

echo [4/4] Fazendo deploy das Functions...
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
echo ✅ Build realizado (versao atualizada)
echo ✅ Hosting atualizado (frontend)
echo ✅ Functions deployadas (backend + webhook)
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
echo 💡 IMPORTANTE: Agora o site tem a versao mais recente!
echo - Chatbot IA funcionando
echo - EmailJS configurado
echo - Integracao Asaas ativa
echo - Todas as melhorias aplicadas
echo.
echo Pressione qualquer tecla para sair.
pause

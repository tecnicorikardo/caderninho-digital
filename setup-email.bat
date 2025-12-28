@echo off
echo ========================================
echo   Setup de Email - Caderninho Digital
echo ========================================
echo.

echo [1/5] Instalando dependencias das functions...
cd functions
call npm install
echo.

echo [2/5] Configurando credenciais de email...
echo.
echo Por favor, informe suas credenciais:
echo.
set /p EMAIL_USER="Email (ex: seu-email@gmail.com): "
set /p EMAIL_PASS="Senha de App do Gmail: "
echo.

echo Configurando no Firebase...
call firebase functions:config:set email.user="%EMAIL_USER%"
call firebase functions:config:set email.password="%EMAIL_PASS%"
echo.

echo [3/5] Verificando configuracao...
call firebase functions:config:get
echo.

echo [4/5] Fazendo build das functions...
call npm run build
echo.

echo [5/5] Fazendo deploy das functions...
cd ..
call firebase deploy --only functions
echo.

echo ========================================
echo   Setup concluido com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo 1. Teste o envio de email no sistema
echo 2. Verifique os logs: firebase functions:log
echo 3. Configure notificacoes automaticas
echo.
pause

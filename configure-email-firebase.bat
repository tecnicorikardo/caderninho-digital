@echo off
echo ========================================
echo   CONFIGURAR EMAIL NO FIREBASE
echo ========================================
echo.
echo Este script vai configurar o email para envio de relatorios
echo.
echo IMPORTANTE: Voce precisa ter:
echo 1. Uma conta Gmail
echo 2. Senha de app do Gmail (nao a senha normal)
echo.
echo Como criar senha de app no Gmail:
echo 1. Va em Configuracoes do Gmail
echo 2. Aba "Seguranca"
echo 3. Ative "Verificacao em duas etapas"
echo 4. Procure por "Senhas de app"
echo 5. Gere uma senha para "Aplicativo personalizado"
echo.
pause
echo.

set /p EMAIL="Digite seu email (ex: seuemail@gmail.com): "
set /p PASSWORD="Digite a senha de app do Gmail: "

echo.
echo Configurando email no Firebase Functions...
echo.

firebase functions:config:set email.user="%EMAIL%"
firebase functions:config:set email.password="%PASSWORD%"

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Agora execute o deploy das functions:
echo firebase deploy --only functions
echo.
pause
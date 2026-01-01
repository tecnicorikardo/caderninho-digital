@echo off
echo ========================================
echo   ATUALIZANDO GITHUB - CADERNINHO DIGITAL
echo ========================================
echo.

REM Tentar diferentes caminhos do Git
set "GIT_PATH1=C:\Program Files\Git\bin\git.exe"
set "GIT_PATH2=C:\Program Files (x86)\Git\bin\git.exe"
set "GIT_PATH3=%LOCALAPPDATA%\Programs\Git\bin\git.exe"

echo Procurando Git instalado...

if exist "%GIT_PATH1%" (
    echo ✅ Git encontrado em: %GIT_PATH1%
    set "GIT_CMD=%GIT_PATH1%"
    goto :git_found
)

if exist "%GIT_PATH2%" (
    echo ✅ Git encontrado em: %GIT_PATH2%
    set "GIT_CMD=%GIT_PATH2%"
    goto :git_found
)

if exist "%GIT_PATH3%" (
    echo ✅ Git encontrado em: %GIT_PATH3%
    set "GIT_CMD=%GIT_PATH3%"
    goto :git_found
)

echo ❌ Git não encontrado nos caminhos padrão!
echo.
echo Tente uma destas opções:
echo 1. Abra o Git Bash e execute os comandos lá
echo 2. Reinicie o terminal após instalar o Git
echo 3. Use o GitHub Desktop
echo.
pause
exit /b 1

:git_found
echo.
echo Verificando status do repositório...
"%GIT_CMD%" status

echo.
echo Adicionando todos os arquivos...
"%GIT_CMD%" add .

echo.
echo Fazendo commit das mudanças...
"%GIT_CMD%" commit -m "feat: Sistema PIX PagarMe + IA Chatbot + Correções CORS - v2.1.0

✅ Migração completa para PagarMe
✅ Sistema PIX funcionando com QR Code  
✅ Chatbot IA com Google Gemini
✅ EmailJS para relatórios
✅ Correções CORS aplicadas
✅ Cache busting implementado
✅ Interface melhorada
✅ Documentação completa

Funcionalidades:
- PIX payment com QR Code
- Integração PagarMe completa
- Sistema de pagamento operacional
- EmailJS funcionando
- Chatbot IA implementado

Deploy: 31/12/2025"

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no commit!
    pause
    exit /b 1
)

echo ✅ Commit realizado com sucesso!
echo.

echo Fazendo push para GitHub...
"%GIT_CMD%" push origin main

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no push para main!
    echo.
    echo Tentando push para branch master...
    "%GIT_CMD%" push origin master
    
    if %ERRORLEVEL% neq 0 (
        echo ❌ ERRO no push!
        echo Verifique se o repositório remoto está configurado.
        pause
        exit /b 1
    )
)

echo ✅ Push realizado com sucesso!
echo.
echo ========================================
echo   🎉 GITHUB ATUALIZADO!
echo ========================================
echo.
echo ✅ Repositório atualizado: https://github.com/tecnicorikardo/caderninho-digital.git
echo ✅ Versão: 2.1.0
echo ✅ Deploy: 31/12/2025
echo.
pause
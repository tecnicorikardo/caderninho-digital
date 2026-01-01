@echo off
echo ========================================
echo   ATUALIZANDO GITHUB - CADERNINHO DIGITAL
echo ========================================
echo.
echo Este script vai fazer commit e push de todas as mudancas:
echo - Migracao para PagarMe
echo - Correcoes de CORS
echo - Melhorias no sistema PIX
echo - Documentacao completa
echo.

echo Verificando status do Git...
git status

echo.
echo Adicionando todos os arquivos...
git add .

echo.
echo Fazendo commit das mudancas...
git commit -m "feat: Migração completa para PagarMe e correções PIX

- ✅ Migração de Asaas para PagarMe
- ✅ Correção de erros CORS
- ✅ Sistema PIX funcionando
- ✅ Function createPagarMeCharge implementada
- ✅ Correção telefone obrigatório PagarMe
- ✅ Cache busting implementado
- ✅ Logs de debug melhorados
- ✅ Documentação completa

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
git push origin main

if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO no push!
    echo.
    echo Tentando push para branch master...
    git push origin master
    
    if %ERRORLEVEL% neq 0 (
        echo ❌ ERRO no push para master tambem!
        echo Verifique se o repositorio remoto esta configurado.
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
echo ✅ Todas as mudancas foram enviadas para:
echo 🔗 https://github.com/tecnicorikardo/caderninho-digital.git
echo.
echo 📊 Mudancas incluidas:
echo - Migracao PagarMe completa
echo - Sistema PIX funcionando
echo - Correcoes CORS aplicadas
echo - Documentacao atualizada
echo - Functions deployadas
echo.
echo 🚀 Repositorio atualizado em: %date% %time%
echo.
echo Pressione qualquer tecla para sair.
pause
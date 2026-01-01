@echo off
echo ========================================
echo   BUILD DO PROJETO
echo ========================================
echo.
echo Este script vai gerar a versao atualizada do projeto
echo com todas as mudancas mais recentes.
echo.

echo Configurando PATH para Node.js...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ⚡ Fazendo BUILD do projeto...
echo Compilando React + TypeScript...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERRO no build!
    echo.
    echo Possiveis causas:
    echo - Erro de sintaxe no codigo
    echo - Dependencia faltando
    echo - Problema de TypeScript
    echo.
    echo Verifique os erros acima e corrija antes de tentar novamente.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ BUILD CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo 📁 Arquivos gerados na pasta 'dist/'
echo 🔄 Versao atualizada com todas as mudancas
echo.
echo 💡 Proximos passos:
echo 1. Execute 'deploy-fix.bat' para fazer deploy completo
echo 2. Ou execute 'firebase deploy --only hosting' para deploy rapido
echo.
echo Pressione qualquer tecla para sair.
pause
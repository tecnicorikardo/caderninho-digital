@echo off
echo ========================================
echo       INSTALACAO JAVA 21 - ORACLE
echo ========================================
echo.
echo Este script vai:
echo 1. Baixar Java 21 LTS da Oracle
echo 2. Instalar automaticamente
echo 3. Configurar variaveis de ambiente
echo.
pause

echo Baixando Java 21 LTS...
echo.
echo OPCOES DE DOWNLOAD:
echo.
echo 1. AUTOMATICO (recomendado):
echo    Abrir pagina de download da Oracle
echo.
echo 2. MANUAL:
echo    Baixar: https://download.oracle.com/java/21/latest/jdk-21_windows-x64_bin.exe
echo.

set /p opcao="Escolha (1 ou 2): "

if "%opcao%"=="1" (
    echo Abrindo pagina de download...
    start https://www.oracle.com/java/technologies/downloads/#java21
    echo.
    echo INSTRUCOES:
    echo 1. Baixe: "Windows x64 Installer"
    echo 2. Execute o arquivo .exe baixado
    echo 3. Siga o assistente de instalacao
    echo 4. Volte aqui e pressione qualquer tecla
    echo.
    pause
) else (
    echo.
    echo Baixe manualmente de:
    echo https://download.oracle.com/java/21/latest/jdk-21_windows-x64_bin.exe
    echo.
    echo Depois execute o arquivo e volte aqui.
    pause
)

echo.
echo Verificando instalacao...
if exist "C:\Program Files\Java\jdk-21" (
    echo ✓ Java 21 encontrado!
    
    echo Configurando variaveis de ambiente...
    setx JAVA_HOME "C:\Program Files\Java\jdk-21"
    setx PATH "C:\Program Files\Java\jdk-21\bin;%PATH%"
    
    echo.
    echo ========================================
    echo         INSTALACAO CONCLUIDA!
    echo ========================================
    echo.
    echo Java 21 instalado e configurado com sucesso!
    echo.
    echo PROXIMO PASSO:
    echo 1. Feche este terminal
    echo 2. Abra um novo terminal
    echo 3. Execute: java -version
    echo 4. Deve mostrar "java version 21"
    echo.
) else (
    echo ❌ Java 21 nao encontrado.
    echo.
    echo Certifique-se de:
    echo 1. Baixar o instalador correto
    echo 2. Executar como administrador
    echo 3. Escolher instalacao padrao
    echo.
)

pause
@echo off
echo Configurando Java 21...

if exist "C:\Program Files\Java\jdk-21" (
    echo ✓ Java 21 encontrado!
    
    echo Configurando JAVA_HOME...
    setx JAVA_HOME "C:\Program Files\Java\jdk-21"
    
    echo Configurando PATH...
    setx PATH "C:\Program Files\Java\jdk-21\bin;%PATH%"
    
    echo.
    echo ========================================
    echo       CONFIGURACAO CONCLUIDA!
    echo ========================================
    echo.
    echo Feche este terminal e abra um novo.
    echo Depois execute: java -version
    echo.
) else (
    echo ❌ Java 21 nao encontrado em C:\Program Files\Java\jdk-21
    echo.
    echo Certifique-se de que o Java 21 foi instalado corretamente.
)

pause
@echo off
echo ========================================
echo       LIMPEZA DE VERSOES DO JAVA
echo ========================================
echo.
echo Versoes encontradas:
dir "C:\Program Files\Java\"
echo.
echo Vamos manter apenas o JDK-17 (necessario para Android)
echo.
pause

echo Removendo JDK-11...
rmdir /s /q "C:\Program Files\Java\jdk-11" 2>nul
if exist "C:\Program Files\Java\jdk-11" (
    echo AVISO: Nao foi possivel remover JDK-11 automaticamente
    echo Execute como administrador ou remova manualmente
) else (
    echo ✓ JDK-11 removido
)

echo Removendo JDK-21...
rmdir /s /q "C:\Program Files\Java\jdk-21" 2>nul
if exist "C:\Program Files\Java\jdk-21" (
    echo AVISO: Nao foi possivel remover JDK-21 automaticamente
    echo Execute como administrador ou remova manualmente
) else (
    echo ✓ JDK-21 removido
)

echo Removendo JDK 1.8...
rmdir /s /q "C:\Program Files\Java\jdk1.8.0_202" 2>nul
if exist "C:\Program Files\Java\jdk1.8.0_202" (
    echo AVISO: Nao foi possivel remover JDK 1.8 automaticamente
) else (
    echo ✓ JDK 1.8 removido
)

echo Removendo JRE 1.8...
rmdir /s /q "C:\Program Files\Java\jre1.8.0_471" 2>nul
if exist "C:\Program Files\Java\jre1.8.0_471" (
    echo AVISO: Nao foi possivel remover JRE 1.8 automaticamente
) else (
    echo ✓ JRE 1.8 removido
)

echo Removendo pasta 'latest'...
rmdir /s /q "C:\Program Files\Java\latest" 2>nul
if exist "C:\Program Files\Java\latest" (
    echo AVISO: Nao foi possivel remover pasta 'latest' automaticamente
) else (
    echo ✓ Pasta 'latest' removida
)

echo.
echo ========================================
echo Configurando JAVA_HOME para JDK-17...
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
setx PATH "C:\Program Files\Java\jdk-17\bin;%PATH%"

echo.
echo Versoes restantes:
dir "C:\Program Files\Java\" 2>nul

echo.
echo ========================================
echo           LIMPEZA CONCLUIDA!
echo ========================================
echo.
echo Agora voce tem apenas o JDK-17 instalado
echo Reinicie o terminal para aplicar as mudancas
echo.
pause
@echo off
echo Configurando PATH para Node.js...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo Construindo Frontend...
call npm run build

echo Deploying Hosting...
call firebase deploy --only hosting

echo.
echo Deploy Finalizado!
pause

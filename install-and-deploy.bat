@echo off
echo Configurando PATH para Node.js...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo Instalando dependencias (atualizando lockfile)...
cd functions
call npm install
cd ..

echo Reiniciando Deploy...
call .\deploy-fix.bat

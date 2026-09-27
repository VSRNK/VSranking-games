@echo off
title Ranking de Videojuegos
cd /d "%~dp0"

echo ======================================================
echo    Iniciando servidor del Ranking de Videojuegos
echo ======================================================
echo.

rem Si el puerto 8080 ya esta en uso (p. ej. un server.js zombie de una
rem sesion anterior), no se arranca un segundo servidor: este esperaria a
rem morir por puerto ocupado y la pagina la serviria el proceso viejo,
rem lo que parecia "un monton de fallos al iniciar".
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 goto ya_activo

echo [1/2] Arrancando el servidor en http://localhost:8080 ...
rem Se abre el navegador 2 s despues de lanzar Node: asi la primera carga ya
rem encuentra al servidor escuchando (sin "conexion rechazada").
start "" /min cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8080"
node server.js
pause
exit /b 0

:ya_activo
echo [OK] Ya hay un servidor activo en http://localhost:8080
echo      (no se crea un segundo proceso). Abriendo la pagina...
start "" "http://localhost:8080"
pause
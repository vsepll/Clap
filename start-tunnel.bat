@echo off
title CLAP - Inicio con Cloudflare Tunnel

echo ============================================
echo   CLAP - Servidor de produccion + Tunnel
echo ============================================
echo.

:: Verificar que el build existe
if not exist "dist\index.html" (
    echo [!] El build no existe. Ejecutando npm run build...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] El build fallo. Revisa los errores arriba.
        pause
        exit /b 1
    )
)

echo [1/2] Iniciando servidor Express en puerto 3001...
start "CLAP Server" cmd /k "cd /d %~dp0 && npm run start"

:: Esperar un segundo para que el servidor arranque
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Cloudflare Tunnel...
echo.
echo *** La URL del tunnel aparecera abajo en unos segundos ***
echo *** Busca una linea que diga: https://xxxx.trycloudflare.com ***
echo.

"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001

pause

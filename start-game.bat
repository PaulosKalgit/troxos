@echo off
title Wheel of Fortune - Server
cd /d "%~dp0"
set "PATH=%PATH%;%LOCALAPPDATA%\nodejs-portable\node-v24.18.0-win-x64"
set "NODE_OPTIONS=--use-system-ca"

echo ===========================================================
echo   Starting the Wheel of Fortune server...
echo.
echo   This PC          : http://localhost:5173/
echo   Phones (same WiFi): http://192.168.1.15:5173/
echo.
echo   Chrome will open automatically in a few seconds.
echo   Keep this window open while playing.
echo   Press Ctrl+C (or just close this window) to stop.
echo ===========================================================
echo.

REM Open Chrome in its own app-style window once the server is up (runs in
REM parallel, since the server command below blocks this window).
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process chrome -ArgumentList '--app=http://localhost:5173/'"

REM Force port 5173 so the URL above is always correct.
call npm run dev -- --host --port 5173 --strictPort

echo.
echo Server stopped.
pause

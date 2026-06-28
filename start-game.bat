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
echo   Keep this window open while playing.
echo   Press Ctrl+C (or just close this window) to stop.
echo ===========================================================
echo.

call npm run dev -- --host

echo.
echo Server stopped.
pause

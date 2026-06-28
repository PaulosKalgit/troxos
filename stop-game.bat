@echo off
title Wheel of Fortune - Stop
echo Stopping the Wheel of Fortune server...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo Done.
timeout /t 2 >nul

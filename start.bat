@echo off
cd /d "%~dp0"
title Serwer animacji - localhost:8090
start "" http://localhost:8090/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

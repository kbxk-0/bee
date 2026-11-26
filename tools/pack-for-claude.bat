@echo off
chcp 65001 >nul
cd /d "%~dp0.."
node tools\pack-for-claude.js
echo.
pause

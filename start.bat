@echo off
set "PATH=c:\VS Code\Codes\node;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo   Starting PDF Studio (Offline-First PDF Suite)
echo   Target: Windows 10/11
echo ========================================================
npm run dev
pause


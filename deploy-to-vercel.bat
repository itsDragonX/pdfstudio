@echo off
setlocal
set "PATH=C:\VS Code\Codes\node;%PATH%"
cd /d "c:\VS Code\Codes\pdfstudio"

echo ========================================================
echo   PDF Studio - One-Click Vercel Deployment
echo ========================================================
echo.
echo Step 1: Building production bundle...
call cmd.exe /c npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Deploying to Vercel...
echo (If prompted, log in with your GitHub or Vercel account in your browser)
echo.
call cmd.exe /c npx vercel --prod

echo.
echo ========================================================
echo   Deployment completed!
echo ========================================================
pause


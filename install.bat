@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════╗
echo ║     FX9-VOICE Bot — تثبيت المكتبات      ║
echo ╚══════════════════════════════════════════╝
echo.

echo [1/3] حذف node_modules القديمة لتجنب التعارض...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo [2/3] تثبيت المكتبات...
npm install --no-audit --no-fund

echo.
echo [3/3] التحقق...
node -e "require('play-dl'); require('youtube-sr'); require('@discordjs/voice'); console.log('[OK] جميع المكتبات مثبتة!');" 2>nul
if errorlevel 1 (
    echo [خطأ] فشل التحقق. تأكد من اتصال الإنترنت وأعد المحاولة.
    pause & exit /b 1
)

echo.
echo ╔══════════════════════════════════════════╗
echo ║  ✅ التثبيت مكتمل! الخطوات التالية:    ║
echo ║  1. عدّل ملف .env بتوكنك               ║
echo ║  2. انقر مرتين على deploy.bat           ║
echo ║  3. انقر مرتين على start.bat            ║
echo ╚══════════════════════════════════════════╝
echo.
pause

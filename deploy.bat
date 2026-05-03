@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════╗
echo ║   FX9-VOICE Bot — تسجيل الأوامر        ║
echo ╚══════════════════════════════════════════╝
echo.

if not exist node_modules (
    echo [!] شغّل install.bat أولاً
    pause
    exit /b 1
)

if not exist .env (
    echo [!] ملف .env غير موجود
    pause
    exit /b 1
)

node src/deploy-commands.js
echo.
pause

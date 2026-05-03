@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════╗
echo ║      FX9-VOICE Bot v3.0 — تشغيل        ║
echo ╚══════════════════════════════════════════╝
echo.

:: Check node_modules
if not exist node_modules (
    echo [!] لم يتم تثبيت المكتبات. شغّل install.bat أولاً
    pause
    exit /b 1
)

:: Check .env
if not exist .env (
    echo [!] ملف .env غير موجود. انسخ .env.example وعدّله
    pause
    exit /b 1
)

echo [✓] بدء تشغيل البوت...
echo.
node src/index.js
pause

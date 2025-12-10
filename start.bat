@echo off
echo ========================================
echo   Challengers Component Tracker
echo ========================================
echo.

echo [1/3] Checking MongoDB...
net start | findstr /i "mongodb" >nul
if %errorlevel% equ 0 (
    echo MongoDB is running
) else (
    echo WARNING: MongoDB might not be running
    echo Please start MongoDB or use MongoDB Atlas
    echo.
)

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo   Network:  http://10.101.230.216:3000
echo.
echo   Login: admin / admin123
echo ========================================
echo.
echo Press any key to open the browser...
pause >nul
start http://localhost:3000

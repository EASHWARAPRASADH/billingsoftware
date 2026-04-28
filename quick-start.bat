@echo off
echo ========================================
echo  Bill Management System - Quick Fix
echo ========================================
echo.

echo Checking system status...
echo.

REM Check if backend is running
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo [OK] Backend server is running on port 8000
) else (
    echo [ERROR] Backend server is NOT running!
    echo.
    echo Starting backend server...
    start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"
    timeout /t 5 /nobreak >nul
)

echo.

REM Check if frontend is running
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running on port 3000
) else (
    echo [ERROR] Frontend server is NOT running!
    echo.
    echo Starting frontend server...
    start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"
)

echo.
echo ========================================
echo  Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Check the new terminal windows for server logs.
echo.
pause

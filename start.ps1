# Bill Management System - Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Bill Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version 2>$null
    if ($mysqlVersion) {
        Write-Host "✓ MySQL is installed" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ MySQL not found!" -ForegroundColor Red
    Write-Host "Please install MySQL first. See MYSQL_SETUP.md for instructions." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick options:" -ForegroundColor Yellow
    Write-Host "1. MySQL Installer: https://dev.mysql.com/downloads/installer/" -ForegroundColor White
    Write-Host "2. XAMPP: https://www.apachefriends.org/" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "1. Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Backend Server' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "2. Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend Development Server' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Check the separate terminal windows for logs." -ForegroundColor Yellow
Write-Host ""

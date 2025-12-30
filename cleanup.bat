@echo off
echo ========================================
echo  Cleaning up unwanted files...
echo ========================================
echo.

REM Delete test and debug files from root
echo Removing test and debug files from root...
if exist backend_test.py del /f /q backend_test.py
if exist backend_test_results.json del /f /q backend_test_results.json
if exist debug-backend.bat del /f /q debug-backend.bat
if exist diagnose-and-fix.ps1 del /f /q diagnose-and-fix.ps1
if exist force-start.bat del /f /q force-start.bat
if exist test_duplicate.py del /f /q test_duplicate.py
if exist test_result.md del /f /q test_result.md

REM Delete summary markdown files
echo Removing summary documentation files...
if exist CHANGES_SUMMARY.md del /f /q CHANGES_SUMMARY.md
if exist CURRENCY_UPDATE_SUMMARY.md del /f /q CURRENCY_UPDATE_SUMMARY.md
if exist DASHBOARD_FINAL_UPDATES.md del /f /q DASHBOARD_FINAL_UPDATES.md
if exist DASHBOARD_UPDATES.md del /f /q DASHBOARD_UPDATES.md
if exist ERROR_FIX_SUMMARY.md del /f /q ERROR_FIX_SUMMARY.md

REM Delete test directories
echo Removing test directories...
if exist test_reports rmdir /s /q test_reports
if exist tests rmdir /s /q tests

REM Delete backend test files
echo Removing backend test files...
if exist backend\seed_users.js del /f /q backend\seed_users.js
if exist backend\test-db.js del /f /q backend\test-db.js
if exist backend\verify_data.sql del /f /q backend\verify_data.sql
if exist backend\__pycache__ rmdir /s /q backend\__pycache__

REM Delete frontend copy scripts
echo Removing frontend copy scripts...
if exist frontend\copy-assets.js del /f /q frontend\copy-assets.js
if exist frontend\copy-ceo-detailed.js del /f /q frontend\copy-ceo-detailed.js
if exist frontend\copy-ceo-final.js del /f /q frontend\copy-ceo-final.js
if exist frontend\copy-ceo-sign.js del /f /q frontend\copy-ceo-sign.js
if exist frontend\copy-sign-verbose.bat del /f /q frontend\copy-sign-verbose.bat
if exist frontend\copy-sign.bat del /f /q frontend\copy-sign.bat
if exist frontend\copy-sign.ps1 del /f /q frontend\copy-sign.ps1
if exist frontend\copy_sign.py del /f /q frontend\copy_sign.py
if exist frontend\copy_sign_full.py del /f /q frontend\copy_sign_full.py
if exist frontend\plugins rmdir /s /q frontend\plugins

echo.
echo ========================================
echo  Cleanup complete!
echo ========================================
echo.
echo Removed files:
echo - Test scripts and results
echo - Debug and diagnostic scripts
echo - Temporary summary documentation
echo - Copy utility scripts
echo - Python cache directories
echo.

pause

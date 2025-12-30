# 🔧 Bill Management System - Error Fix Guide

## ❌ Problem Summary

You're experiencing the following errors:
1. **ERR_CONNECTION_REFUSED** - Backend server at `localhost:8000` is not running
2. **TypeError: Cannot read properties of null (reading 'totalRevenue')** - Dashboard crashes when backend is unavailable
3. **WebSocket connection failures** - Frontend dev server issues

## ✅ Root Cause

**The backend server is NOT running!** All API calls are failing because there's no server listening on port 8000.

## 🛠️ Solution Steps

### Step 1: Check MySQL Database

The backend requires MySQL to be running. Verify MySQL is installed and running:

```powershell
# Check if MySQL is installed
mysql --version

# Test MySQL connection (you may need to enter password)
mysql -u root -p -e "SELECT 1;"
```

**If MySQL is not installed:**
- Download from: https://dev.mysql.com/downloads/installer/
- Or install XAMPP: https://www.apachefriends.org/

**If MySQL is installed but not running:**
- Start MySQL service from Windows Services
- Or start XAMPP Control Panel and start MySQL

### Step 2: Verify Backend Dependencies

```powershell
cd backend
npm install
```

### Step 3: Check Backend Environment Configuration

The backend needs a `.env` file in the `backend` folder. Create one if missing:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=billmanagement
DB_USER=root
DB_PASSWORD=

# Server Configuration
PORT=8000
NODE_ENV=development

# JWT Secret (change this to a random string)
JWT_SECRET=your-secret-key-here-change-this

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Step 4: Create Database

```powershell
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE IF NOT EXISTS billmanagement;
exit;
```

### Step 5: Start Backend Server

```powershell
cd backend
npm start
```

**Expected output:**
```
Server is running on port 8000
Successfully connected to MySQL
Database synchronized
```

**If you see errors:**
- MySQL connection error → Check MySQL is running and credentials in `.env`
- Port already in use → Another process is using port 8000
- Module not found → Run `npm install` again

### Step 6: Start Frontend Server

In a **new terminal window**:

```powershell
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view the app in the browser.
Local: http://localhost:3000
```

### Step 7: Verify Everything Works

1. Open browser to `http://localhost:3000`
2. You should see the login page (not error messages)
3. Check browser console - no more `ERR_CONNECTION_REFUSED` errors
4. Backend health check: `http://localhost:8000/api/health`

## 🚀 Quick Start Script

We've created an automated diagnostic script. Run it to check everything:

```powershell
.\diagnose-and-fix.ps1
```

This script will:
- ✓ Check if MySQL is installed and running
- ✓ Check if backend server is running on port 8000
- ✓ Check if frontend server is running on port 3000
- ✓ Check if dependencies are installed
- ✓ Offer to start servers automatically

## 📋 Manual Startup (Alternative)

Use the existing startup script:

```powershell
.\start.ps1
```

## 🔍 Troubleshooting Common Issues

### Issue: "MySQL connection error"
**Solution:** 
- Ensure MySQL is running
- Check credentials in `backend/.env`
- Verify database exists: `CREATE DATABASE billmanagement;`

### Issue: "Port 8000 already in use"
**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: "Cannot find module"
**Solution:**
```powershell
# Reinstall dependencies
cd backend
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: Dashboard still shows errors
**Solution:**
- Hard refresh browser: `Ctrl + Shift + R`
- Clear browser cache
- Check browser console for specific errors

## ✨ What We Fixed

1. **Dashboard.js** - Added null safety check to prevent crashes when backend is unavailable
2. **Created diagnostic script** - `diagnose-and-fix.ps1` to automatically detect and fix issues
3. **This guide** - Step-by-step instructions to resolve all errors

## 📞 Next Steps

1. Run `.\diagnose-and-fix.ps1` to check system status
2. Start backend server: `cd backend && npm start`
3. Start frontend server: `cd frontend && npm start`
4. Refresh browser and verify no errors

---

**Note:** Both backend AND frontend must be running simultaneously for the application to work properly.

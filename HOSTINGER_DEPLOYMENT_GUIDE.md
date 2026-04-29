# 🚀 Hostinger Deployment Guide - Bill Management System

## 📋 Overview

This guide will help you deploy your Bill Management System to Hostinger. You'll migrate:
- ✅ **Frontend** (React App) → Hostinger Web Hosting
- ✅ **Backend** (Node.js API) → Hostinger VPS or Cloud Hosting
- ✅ **Database** (MySQL) → Hostinger MySQL Database

---

## 🎯 Prerequisites

### What You'll Need:

1. **Hostinger Account** with appropriate plan:
   - **Option A**: VPS Hosting (Recommended - Full control)
   - **Option B**: Cloud Hosting (Managed Node.js environment)
   - **Note**: Shared hosting won't work for Node.js backend

2. **Domain Name** (Optional but recommended)
   - Example: `yourbusiness.com`

3. **SSH Access** to Hostinger server

4. **Your Local Data**:
   - MySQL database backup
   - Application code

---

## 📦 Phase 1: Prepare Your Application

### Step 1.1: Export Your Local Database

Open MySQL Workbench and export your data:

```sql
-- In MySQL Workbench, run this to get your database
-- Then use File > Data Export

-- Or use command line:
mysqldump -u root -p billmanagement > billmanagement_backup.sql
```

**Save the file**: `billmanagement_backup.sql`

### Step 1.2: Prepare Environment Variables

Create a production environment file:

**File: `backend/.env.production`**
```env
NODE_ENV=production
PORT=8000

# Database Configuration (will be updated with Hostinger details)
DB_HOST=your-hostinger-mysql-host.com
DB_PORT=3306
DB_NAME=billmanagement
DB_USER=your-db-username
DB_PASSWORD=your-secure-password

# JWT Secret (generate a new one for production)
JWT_SECRET=your-super-secure-random-string-here-min-32-chars

# CORS Origins (your Hostinger domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL
API_URL=https://api.yourdomain.com
```

### Step 1.3: Update Frontend Configuration

**File: `frontend/.env.production`**
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Step 1.4: Build Frontend for Production

```bash
cd frontend
npm run build
```

This creates a `frontend/build` folder with optimized production files.

---

## 🗄️ Phase 2: Set Up Hostinger MySQL Database

### Step 2.1: Create MySQL Database on Hostinger

1. **Log in to Hostinger Control Panel**
2. Go to **Databases** → **MySQL Databases**
3. Click **Create Database**
   - Database Name: `billmanagement`
   - Username: `bill_user` (or your choice)
   - Password: Generate a strong password
   - Click **Create**

4. **Note down these details**:
   ```
   Database Host: mysql-xxxxx.hostinger.com (or localhost)
   Database Name: billmanagement
   Username: bill_user
   Password: [your-password]
   Port: 3306
   ```

### Step 2.2: Import Your Database

**Option A: Using phpMyAdmin (Easier)**

1. In Hostinger Panel, click **Manage** next to your database
2. Click **phpMyAdmin**
3. Select your database (`billmanagement`)
4. Click **Import** tab
5. Choose `billmanagement_backup.sql`
6. Click **Go**
7. Wait for import to complete

**Option B: Using SSH and Command Line**

```bash
# Upload your SQL file to server first
scp billmanagement_backup.sql username@your-server-ip:/home/username/

# SSH into server
ssh username@your-server-ip

# Import database
mysql -h mysql-xxxxx.hostinger.com -u bill_user -p billmanagement < billmanagement_backup.sql
# Enter your database password when prompted
```

### Step 2.3: Verify Database Import

```sql
-- Connect to database and verify tables
USE billmanagement;
SHOW TABLES;

-- Verify data
SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Invoices;
SELECT COUNT(*) FROM Expenses;
```

---

## 🖥️ Phase 3: Deploy Backend (Node.js API)

### Step 3.1: Connect to Your Hostinger VPS via SSH

```bash
ssh root@your-vps-ip-address
# Or
ssh username@your-vps-ip-address
```

### Step 3.2: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show v9.x.x or higher

# Install PM2 (Process Manager for Node.js)
sudo npm install -g pm2

# Install Nginx (Web Server/Reverse Proxy)
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 3.3: Upload Your Backend Code

**Option A: Using Git (Recommended)**

```bash
# On your server
cd /var/www
sudo mkdir billmanagement
sudo chown -R $USER:$USER billmanagement
cd billmanagement

# Clone your repository (if you have it on GitHub)
git clone https://github.com/yourusername/billmanagement.git .

# Or if no Git repo, use SCP:
```

**Option B: Using SCP (Secure Copy)**

```bash
# From your local machine
cd d:\Billmanagement
scp -r backend username@your-vps-ip:/var/www/billmanagement/
```

### Step 3.4: Configure Backend Environment

```bash
# On server
cd /var/www/billmanagement/backend

# Create production .env file
nano .env

# Paste your production environment variables
# (Use the Hostinger database credentials from Step 2.1)
```

**.env file content:**
```env
NODE_ENV=production
PORT=8000

DB_HOST=mysql-xxxxx.hostinger.com
DB_PORT=3306
DB_NAME=billmanagement
DB_USER=bill_user
DB_PASSWORD=your-actual-password

JWT_SECRET=your-super-secure-random-string-min-32-chars

CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 3.5: Install Dependencies and Start Backend

```bash
# Install dependencies
npm install --production

# Test the backend
node server.js
# Should show: "Successfully connected to MySQL" and "Server is running on port 8000"

# Press Ctrl+C to stop

# Start with PM2 (keeps running in background)
pm2 start server.js --name "billmanagement-api"

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Follow the command it displays
```

### Step 3.6: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/billmanagement-api
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/billmanagement-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 3.7: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts and select option to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🌐 Phase 4: Deploy Frontend (React App)

### Step 4.1: Upload Frontend Build

**Option A: Using Hostinger File Manager**

1. In Hostinger Panel, go to **File Manager**
2. Navigate to `public_html` (or your domain's root folder)
3. Upload all files from `frontend/build` folder
4. Extract if compressed

**Option B: Using SCP**

```bash
# From your local machine
cd d:\Billmanagement\frontend
npm run build

# Upload to server
scp -r build/* username@your-vps-ip:/var/www/html/
```

### Step 4.2: Configure Nginx for Frontend

```bash
# On server
sudo nano /etc/nginx/sites-available/billmanagement-frontend
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable and reload:**

```bash
sudo ln -s /etc/nginx/sites-available/billmanagement-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4.3: Install SSL for Frontend

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔧 Phase 5: Final Configuration

### Step 5.1: Update DNS Records

In your domain registrar (or Hostinger DNS):

1. **A Record** for main domain:
   - Type: `A`
   - Name: `@`
   - Value: `Your-VPS-IP-Address`

2. **A Record** for www:
   - Type: `A`
   - Name: `www`
   - Value: `Your-VPS-IP-Address`

3. **A Record** for API subdomain:
   - Type: `A`
   - Name: `api`
   - Value: `Your-VPS-IP-Address`

**Wait 1-24 hours for DNS propagation**

### Step 5.2: Update Frontend API URL

```bash
# On server, update the API URL in your React build
# If using .env, rebuild with production API URL
```

Or update during build:

```bash
# On your local machine
cd frontend
echo "REACT_APP_API_URL=https://api.yourdomain.com/api" > .env.production
npm run build

# Re-upload build folder
```

---

## ✅ Phase 6: Testing and Verification

### Step 6.1: Test Backend API

```bash
# Test health endpoint
curl https://api.yourdomain.com/api/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":...}
```

### Step 6.2: Test Frontend

1. Open browser: `https://yourdomain.com`
2. Try to log in
3. Create a test invoice
4. Verify data appears

### Step 6.3: Test Database Connection

```bash
# On server
cd /var/www/billmanagement/backend

# Check PM2 logs
pm2 logs billmanagement-api

# Should show "Successfully connected to MySQL"
```

### Step 6.4: Monitor Application

```bash
# View running processes
pm2 status

# View logs
pm2 logs billmanagement-api

# Restart if needed
pm2 restart billmanagement-api

# Stop
pm2 stop billmanagement-api

# Start
pm2 start billmanagement-api
```

---

## 🔐 Phase 7: Security Hardening

### Step 7.1: Configure Firewall

```bash
# Enable UFW (Uncomplicated Firewall)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Step 7.2: Secure MySQL

```bash
# Change default MySQL root password
sudo mysql_secure_installation

# Follow prompts
```

### Step 7.3: Set Up Automatic Backups

```bash
# Create backup script
nano ~/backup-database.sh
```

**Paste this script:**

```bash
#!/bin/bash
BACKUP_DIR="/home/username/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -h mysql-xxxxx.hostinger.com -u bill_user -pYOUR_PASSWORD billmanagement > $BACKUP_DIR/billmanagement_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "billmanagement_*.sql" -mtime +7 -delete
```

**Make executable and schedule:**

```bash
chmod +x ~/backup-database.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/username/backup-database.sh
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Users (Browsers)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Hostinger VPS Server (Your IP)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Nginx (Port 80/443)                │  │
│  │  ┌─────────────────┐         ┌──────────────────┐   │  │
│  │  │   Frontend      │         │   Backend API    │   │  │
│  │  │ yourdomain.com  │         │ api.yourdomain   │   │  │
│  │  │  (React Build)  │         │  (Node.js:8000)  │   │  │
│  │  └─────────────────┘         └────────┬─────────┘   │  │
│  └───────────────────────────────────────┼─────────────┘  │
│                                           │                 │
│                                           │ Connects to     │
│                                           ▼                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Hostinger MySQL Database Server            │    │
│  │        Database: billmanagement                    │    │
│  │        (Your invoices, users, expenses data)       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference Commands

### Backend Management:
```bash
pm2 status                          # Check status
pm2 logs billmanagement-api         # View logs
pm2 restart billmanagement-api      # Restart
pm2 stop billmanagement-api         # Stop
pm2 start billmanagement-api        # Start
```

### Nginx Management:
```bash
sudo nginx -t                       # Test configuration
sudo systemctl reload nginx         # Reload
sudo systemctl restart nginx        # Restart
sudo systemctl status nginx         # Check status
```

### Database Backup:
```bash
# Manual backup
mysqldump -h mysql-xxxxx.hostinger.com -u bill_user -p billmanagement > backup.sql

# Restore from backup
mysql -h mysql-xxxxx.hostinger.com -u bill_user -p billmanagement < backup.sql
```

---

## 🚨 Troubleshooting

### Backend Not Starting:
```bash
# Check logs
pm2 logs billmanagement-api

# Common issues:
# 1. Database connection failed → Check .env credentials
# 2. Port already in use → Check if another process is using port 8000
# 3. Module not found → Run npm install
```

### Frontend Shows "Cannot connect to API":
```bash
# 1. Check if backend is running
pm2 status

# 2. Check Nginx configuration
sudo nginx -t

# 3. Verify CORS settings in backend .env
# CORS_ORIGINS should include your frontend domain
```

### Database Connection Failed:
```bash
# 1. Verify database credentials in .env
# 2. Check if MySQL service is running
# 3. Verify firewall allows connection to MySQL port (3306)
# 4. Test connection:
mysql -h mysql-xxxxx.hostinger.com -u bill_user -p
```

---

## 💰 Cost Estimate

**Hostinger VPS Plans (Approximate):**
- VPS 1: $4-6/month (2GB RAM, 1 CPU)
- VPS 2: $8-12/month (4GB RAM, 2 CPU) ⭐ **Recommended**
- VPS 3: $12-18/month (6GB RAM, 3 CPU)

**Additional Costs:**
- Domain Name: $10-15/year
- SSL Certificate: FREE (Let's Encrypt)

**Total Estimated Cost: ~$100-150/year**

---

## 📝 Post-Deployment Checklist

- [ ] Database migrated and tested
- [ ] Backend API running and accessible
- [ ] Frontend deployed and accessible
- [ ] SSL certificates installed (HTTPS working)
- [ ] DNS records configured correctly
- [ ] Can log in to application
- [ ] Can create/view invoices
- [ ] Can create/view expenses
- [ ] PM2 auto-restart configured
- [ ] Automatic database backups scheduled
- [ ] Firewall configured
- [ ] Application monitoring set up

---

## 🎉 You're Live!

Once everything is deployed, your application will be:
- Accessible from anywhere in the world
- Running 24/7 on Hostinger's servers
- Database hosted on Hostinger's MySQL
- Secured with HTTPS
- Automatically backed up

**Your local laptop is NO LONGER needed** for the application to run!

---

## 📞 Need Help?

- Hostinger Support: https://www.hostinger.com/support
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Nginx Documentation: https://nginx.org/en/docs/

---

**Last Updated**: December 2024
**Version**: 1.0

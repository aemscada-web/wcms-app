# WCMS Installation Guide

## Welfare Contribution Management System
### Complete Installation and Deployment Guide

---

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Database Setup](#database-setup)
4. [Backend Installation](#backend-installation)
5. [Frontend Installation](#frontend-installation)
6. [Production Deployment](#production-deployment)
7. [Initial User Setup](#initial-user-setup)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum
- **Network**: Stable internet connection

### Software Requirements
- **Operating System**: Ubuntu 20.04+ / Windows Server 2019+ / macOS
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher
- **Web Browser**: Chrome, Firefox, Safari, Edge (latest versions)

---

## Pre-Installation Checklist

✅ MySQL server installed and running  
✅ Node.js and npm installed  
✅ Git installed (optional, for version control)  
✅ Administrator/root access to the server  
✅ Port 5000 (backend) and 3000 (frontend) available  
✅ SSL certificate (for production deployment)  

---

## Database Setup

### Step 1: Install MySQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**Windows:**
Download and install from https://dev.mysql.com/downloads/installer/

**macOS:**
```bash
brew install mysql
brew services start mysql
```

### Step 2: Create Database and User

Login to MySQL:
```bash
mysql -u root -p
```

Execute the following SQL commands:
```sql
-- Create database
CREATE DATABASE wcms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'wcms_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON wcms_db.* TO 'wcms_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### Step 3: Import Database Schema

```bash
# Navigate to database directory
cd wcms-app/database

# Import schema
mysql -u wcms_user -p wcms_db < schema.sql

# Import sample data (optional, for testing)
mysql -u wcms_user -p wcms_db < sample_data.sql
```

### Step 4: Verify Database Installation

```bash
mysql -u wcms_user -p wcms_db -e "SHOW TABLES;"
```

You should see all the tables listed.

---

## Backend Installation

### Step 1: Navigate to Backend Directory

```bash
cd wcms-app/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express (Web framework)
- mysql2 (Database driver)
- bcryptjs (Password hashing)
- jsonwebtoken (Authentication)
- And more...

### Step 3: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor
```

Update the following values in `.env`:

```env
# Application
NODE_ENV=production
PORT=5000
API_BASE_URL=/api/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wcms_db
DB_USER=wcms_user
DB_PASSWORD=YourSecurePassword123!

# JWT Configuration (Generate strong random keys)
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key_here_minimum_32_characters
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=30

# CORS (Update with your frontend URL)
CORS_ORIGIN=http://localhost:3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**Important Security Notes:**
- Generate strong random strings for JWT secrets
- Change all default passwords
- Use HTTPS in production
- Restrict CORS_ORIGIN to your domain

### Step 4: Create Required Directories

```bash
mkdir -p uploads logs
```

### Step 5: Create Default Admin User

First, generate a bcrypt password hash:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Admin@123', 10));"
```

Copy the output hash, then login to MySQL:

```bash
mysql -u wcms_user -p wcms_db
```

Insert admin user:

```sql
-- Update the password_hash with the hash you generated
UPDATE users 
SET password_hash = '$2b$10$YourGeneratedHashHere'
WHERE username = 'admin';

-- Verify
SELECT user_id, username, full_name, role FROM users WHERE username = 'admin';
```

Default login credentials:
- Username: `admin`
- Password: `Admin@123` (CHANGE THIS IMMEDIATELY!)

### Step 6: Test Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

You should see:
```
==================================================
🚀 WCMS Server running on port 5000
📊 Environment: development
🔗 API Base URL: /api/v1
==================================================
✅ Database connected successfully
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

---

## Frontend Installation

### Step 1: Navigate to Frontend Directory

```bash
cd wcms-app/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file:

```bash
# .env
VITE_API_URL=http://localhost:5000/api/v1
```

For production, update with your actual API URL:
```env
VITE_API_URL=https://your-domain.com/api/v1
```

### Step 4: Start Development Server

```bash
npm run dev
```

The application will open at http://localhost:3000

### Step 5: Build for Production

```bash
npm run build
```

This creates optimized files in the `dist` directory.

---

## Production Deployment

### Option 1: Using PM2 (Recommended)

#### Install PM2

```bash
sudo npm install -g pm2
```

#### Start Backend

```bash
cd wcms-app/backend
pm2 start server.js --name wcms-backend
pm2 save
pm2 startup
```

#### Serve Frontend with Nginx

Install Nginx:
```bash
sudo apt install nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/wcms
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        root /path/to/wcms-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/wcms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Using Docker (Alternative)

Create `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: wcms_db
      MYSQL_USER: wcms_user
      MYSQL_PASSWORD: wcms_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/1-schema.sql
      - ./database/sample_data.sql:/docker-entrypoint-initdb.d/2-data.sql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_USER: wcms_user
      DB_PASSWORD: wcms_password
      DB_NAME: wcms_db
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:5000/api/v1

volumes:
  mysql_data:
```

Run:
```bash
docker-compose up -d
```

---

## Initial User Setup

### Step 1: Login as Admin

1. Open http://localhost:3000 (or your domain)
2. Login with admin credentials
3. **Immediately change the admin password**

### Step 2: Create Committee Structure

Navigate to Settings → Committees:

1. CEC (Central) should already exist
2. Create ZEC committees
3. Create REC/DEC committees under each ZEC
4. Assign parent-child relationships

### Step 3: Create User Accounts

Navigate to Settings → Users:

1. Create ZEC users with appropriate roles
2. Create REC/DEC users
3. Assign to respective committees
4. Provide login credentials to users

### Step 4: Import Members

Two options:

**Option A: Excel Upload**
1. Download member template
2. Fill in member details
3. Upload via Members → Import

**Option B: Manual Entry**
1. Navigate to Members → Add New
2. Enter member details
3. Assign to committee

### Step 5: Import Historical Data (2000-2006)

1. Prepare Excel with columns: member_code, deduction_month, deduction_amount
2. Navigate to Deductions → Import Historical
3. Upload file
4. Verify import

---

## Security Checklist

Before going live:

✅ Change all default passwords  
✅ Setup HTTPS/SSL  
✅ Configure firewall (allow only 80, 443)  
✅ Setup database backups  
✅ Enable audit logging  
✅ Update CORS settings  
✅ Set strong JWT secrets  
✅ Configure rate limiting  
✅ Setup monitoring/alerts  
✅ Review user permissions  

---

## Backup and Maintenance

### Daily Database Backup

Create backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="wcms_db"
DB_USER="wcms_user"
DB_PASS="YourPassword"

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/wcms_backup_$DATE.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "wcms_backup_*.sql.gz" -mtime +30 -delete
```

Setup cron job:
```bash
crontab -e

# Add line (runs daily at 2 AM):
0 2 * * * /path/to/backup.sh
```

### Log Rotation

```bash
sudo nano /etc/logrotate.d/wcms
```

Add:
```
/path/to/wcms-app/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

---

## Troubleshooting

### Database Connection Failed

**Issue**: Cannot connect to MySQL

**Solutions**:
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check credentials in `.env` file
3. Test connection: `mysql -u wcms_user -p wcms_db`
4. Check MySQL logs: `/var/log/mysql/error.log`

### Port Already in Use

**Issue**: Port 5000 or 3000 already in use

**Solutions**:
1. Find process: `lsof -i :5000` or `netstat -ano | findstr :5000` (Windows)
2. Kill process or change port in configuration
3. Update CORS settings if changing backend port

### Login Failed

**Issue**: Cannot login with credentials

**Solutions**:
1. Verify user exists in database
2. Check password hash was generated correctly
3. Verify JWT_SECRET is set in `.env`
4. Check browser console for errors
5. Review backend logs

### File Upload Failed

**Issue**: Excel upload not working

**Solutions**:
1. Check `uploads` directory exists and has write permissions
2. Verify file size is within limit
3. Check file format (must be .xlsx or .xls)
4. Review backend logs for specific error

---

## Support and Documentation

### Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health
- **API Documentation**: (Create Swagger/Postman collection)

### Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | System Administrator |
| cec_president | Welcome@123 | CEC President |
| cec_finance | Welcome@123 | CEC Finance |

**⚠️ CHANGE ALL DEFAULT PASSWORDS IMMEDIATELY AFTER FIRST LOGIN**

### File Locations

```
wcms-app/
├── backend/
│   ├── uploads/          # Uploaded files
│   ├── logs/            # Application logs
│   └── .env             # Configuration
├── frontend/
│   └── dist/            # Production build
└── database/
    ├── schema.sql       # Database structure
    └── sample_data.sql  # Test data
```

### Monitoring

Check application status:
```bash
pm2 status
pm2 logs wcms-backend
```

Monitor database:
```bash
mysql -u wcms_user -p wcms_db -e "SELECT COUNT(*) as total_members FROM members;"
```

---

## Appendix

### A. Generating Secure Keys

```bash
# Generate random JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### B. MySQL Performance Tuning

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
query_cache_size = 0
query_cache_type = 0
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### C. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if remote server)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

---

## Version History

- **v1.0** (Initial Release) - Complete WCMS implementation
  - Member management
  - Deduction tracking
  - Multi-level approval workflow
  - Fund withdrawal processing
  - Comprehensive reporting

---

**For support, contact**: admin@mescom.in

**Last Updated**: February 2026

#!/bin/bash

# WCMS Quick Setup Script
# This script automates the initial setup of the Welfare Contribution Management System

echo "================================================="
echo "  WCMS - Quick Setup Script"
echo "  Welfare Contribution Management System"
echo "================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION installed"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+ first."
    echo "  Visit: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm $NPM_VERSION installed"
else
    echo -e "${RED}✗${NC} npm not found. Please install npm first."
    exit 1
fi

# Check MySQL
if command_exists mysql; then
    MYSQL_VERSION=$(mysql -V)
    echo -e "${GREEN}✓${NC} MySQL installed"
else
    echo -e "${YELLOW}⚠${NC} MySQL not found. You'll need to install it manually."
    echo "  Ubuntu/Debian: sudo apt install mysql-server"
    echo "  macOS: brew install mysql"
fi

echo ""
echo "================================================="
echo "  Database Setup"
echo "================================================="
echo ""

read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
echo ""
read -p "Enter database name [wcms_db]: " DB_NAME
DB_NAME=${DB_NAME:-wcms_db}

read -p "Enter database username [wcms_user]: " DB_USER
DB_USER=${DB_USER:-wcms_user}

read -p "Enter database password: " -s DB_PASSWORD
echo ""

# Create database and user
echo "Creating database and user..."

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database and user created successfully"
else
    echo -e "${RED}✗${NC} Failed to create database. Please check MySQL credentials."
    exit 1
fi

# Import schema
echo "Importing database schema..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Schema imported successfully"
else
    echo -e "${RED}✗${NC} Failed to import schema"
    exit 1
fi

# Ask about sample data
read -p "Import sample data for testing? (y/n): " IMPORT_SAMPLE
if [ "$IMPORT_SAMPLE" = "y" ] || [ "$IMPORT_SAMPLE" = "Y" ]; then
    mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/sample_data.sql
    echo -e "${GREEN}✓${NC} Sample data imported"
fi

echo ""
echo "================================================="
echo "  Backend Setup"
echo "================================================="
echo ""

cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install backend dependencies"
    exit 1
fi

# Generate JWT secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create .env file
cat > .env << EOF
# Application
NODE_ENV=development
PORT=5000
API_BASE_URL=/api/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=30

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo -e "${GREEN}✓${NC} Backend environment configured"

# Create directories
mkdir -p uploads logs

# Generate admin password hash
ADMIN_PASSWORD="Admin@123"
ADMIN_HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10));")

# Update admin password in database
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF
UPDATE users SET password_hash = '$ADMIN_HASH' WHERE username = 'admin';
EOF

echo -e "${GREEN}✓${NC} Admin user configured"

cd ..

echo ""
echo "================================================="
echo "  Frontend Setup"
echo "================================================="
echo ""

cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install frontend dependencies"
    exit 1
fi

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api/v1
EOF

echo -e "${GREEN}✓${NC} Frontend environment configured"

cd ..

echo ""
echo "================================================="
echo "  Setup Complete!"
echo "================================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   URL: http://localhost:3000"
echo ""
echo "   Default Login:"
echo "   Username: admin"
echo "   Password: Admin@123"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Change the admin password after first login!${NC}"
echo ""
echo "For detailed documentation, see:"
echo "  - docs/INSTALLATION.md"
echo "  - docs/USER_MANUAL.md"
echo "  - docs/API_DOCUMENTATION.md"
echo ""
echo "================================================="

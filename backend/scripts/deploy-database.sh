#!/bin/bash

# Database deployment script for Simpla
# This script sets up the database for production deployment

set -e  # Exit on any error

echo "🚀 Starting Simpla database deployment..."

# Configuration
DB_NAME=${DB_NAME:-"simpla"}
DB_USER=${DB_USER:-"simpla"}
DB_PASSWORD=${DB_PASSWORD:-"simpla_password"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set!"
    print_error "Please set it to: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    exit 1
fi

print_status "Using database: $DATABASE_URL"

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Run database initialization
print_status "Initializing database tables..."
python scripts/init-database.py

if [ $? -eq 0 ]; then
    print_status "✅ Database deployment completed successfully!"
    print_status "Your database is ready with the following tables:"
    print_status "  - users (user accounts and authentication)"
    print_status "  - refresh_tokens (JWT token management)"
else
    print_error "❌ Database deployment failed!"
    exit 1
fi

print_status "🎉 Simpla database is ready for use!"

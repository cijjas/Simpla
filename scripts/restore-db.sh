#!/bin/bash

# Restore script for Simpla database
# Usage: ./restore-db.sh backup_file.sql.gz

if [ $# -eq 0 ]; then
    echo "Error: Please provide a backup file"
    echo "Usage: ./restore-db.sh backup_file.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="backend-db-1"
DB_USER="simpla"
DB_NAME="simpla"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "Error: Container '$CONTAINER_NAME' is not running"
    echo "Please start your Docker containers first:"
    echo "   cd /backend && docker-compose up -d"
    exit 1
fi

echo "Restoring database from: $BACKUP_FILE"
echo "This will replace all existing data in the database!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoring database..."
    
    # Restore the database
    gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo "Database restored successfully!"
    else
        echo "Error: Database restoration failed"
        exit 1
    fi
else
    echo "Restoration cancelled"
    exit 1
fi

#!/bin/bash

# Backup script for Simpla database
# Usage: ./backup-db.sh [backup_name]

BACKUP_NAME=${1:-"simpla_backup_$(date +%Y%m%d_%H%M%S)"}
CONTAINER_NAME="backend-db-1"
DB_USER="simpla"
DB_NAME="simpla"
BACKUP_DIR="./backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating database backup: $BACKUP_NAME"

# Create compressed SQL dump
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --verbose --clean --no-owner --no-privileges | gzip > "$BACKUP_DIR/${BACKUP_NAME}.sql.gz"

# Get file size
FILESIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" | cut -f1)

echo "Backup completed: $BACKUP_DIR/${BACKUP_NAME}.sql.gz ($FILESIZE)"
echo "To share this backup, send the file: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"
echo ""
echo "To restore this backup:"
echo "   gunzip -c $BACKUP_DIR/${BACKUP_NAME}.sql.gz | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"

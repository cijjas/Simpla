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

# Create compressed SQL dump (compressed by PostgreSQL)
echo "Creating compressed backup..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$BACKUP_DIR/${BACKUP_NAME}.dump"

# Create uncompressed SQL dump
echo "Creating uncompressed backup..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --verbose --clean --no-owner --no-privileges > "$BACKUP_DIR/${BACKUP_NAME}.sql"

# Get file sizes
FILESIZE_COMPRESSED=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.dump" | cut -f1)
FILESIZE_UNCOMPRESSED=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql" | cut -f1)


echo "Backup completed!"
echo "  Compressed:   $BACKUP_DIR/${BACKUP_NAME}.sql.gz ($FILESIZE_COMPRESSED)"
echo "  Uncompressed: $BACKUP_DIR/${BACKUP_NAME}.sql ($FILESIZE_UNCOMPRESSED)"
echo "To share this backup, send either file:"
echo "  For smaller size: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"
echo "  For direct use:   $BACKUP_DIR/${BACKUP_NAME}.sql"
echo ""
echo "To restore the compressed backup:"
echo "   gunzip -c $BACKUP_DIR/${BACKUP_NAME}.sql.gz | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
echo "To restore the uncompressed backup:"
echo "   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $BACKUP_DIR/${BACKUP_NAME}.sql"

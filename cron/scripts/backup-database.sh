#!/bin/sh
# =============================================================================
# SERVISTECH ERP V4.0 - Database Backup Script
# Daily backup with S3 upload
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="servistech_backup_${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
LOG_FILE="/var/log/cron/backup.log"
RETENTION_DAYS=30

# Database credentials from environment
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-servistech}"
DB_PASS="${POSTGRES_PASSWORD:-servistech_secure_2024}"
DB_NAME="${POSTGRES_DB:-servistech_erp}"

# S3 configuration
S3_BUCKET="${BACKUP_S3_BUCKET:-servistech-backups}"
S3_REGION="${BACKUP_S3_REGION:-us-east-1}"
S3_PATH="daily/${COMPRESSED_FILE}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..." >> "$LOG_FILE"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Export password for pg_dump
export PGPASSWORD="$DB_PASS"

# Perform database backup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dumping database $DB_NAME..." >> "$LOG_FILE"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    > "$BACKUP_PATH" 2>> "$LOG_FILE"; then
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database dump completed: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Compress backup
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compressing backup..." >> "$LOG_FILE"
    gzip -f "$BACKUP_PATH"
    
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup compressed: $COMPRESSED_FILE ($BACKUP_SIZE)" >> "$LOG_FILE"
    
    # Upload to S3 if configured
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Uploading to S3..." >> "$LOG_FILE"
        
        if aws s3 cp "${BACKUP_PATH}.gz" "s3://${S3_BUCKET}/${S3_PATH}" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA \
            2>> "$LOG_FILE"; then
            
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup uploaded to S3: s3://${S3_BUCKET}/${S3_PATH}" >> "$LOG_FILE"
            
            # Remove local backup after successful upload
            rm -f "${BACKUP_PATH}.gz"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Local backup removed after S3 upload" >> "$LOG_FILE"
            
            # Send success notification
            if [ -n "$SLACK_WEBHOOK" ]; then
                curl -s -X POST -H 'Content-type: application/json' \
                    --data "{\"text\":\"✅ Database backup completed and uploaded to S3 at $(date '+%Y-%m-%d %H:%M:%S') - Size: $BACKUP_SIZE\"}" \
                    "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
            fi
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: S3 upload failed" >> "$LOG_FILE"
            
            # Keep local backup if S3 upload fails
            if [ -n "$SLACK_WEBHOOK" ]; then
                curl -s -X POST -H 'Content-type: application/json' \
                    --data "{\"text\":\"⚠️ Database backup completed but S3 upload failed at $(date '+%Y-%m-%d %H:%M:%S'). Backup kept locally.\"}" \
                    "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
            fi
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] S3 credentials not configured, keeping local backup" >> "$LOG_FILE"
    fi
    
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Database dump failed" >> "$LOG_FILE"
    
    # Send error notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Database backup failed at $(date '+%Y-%m-%d %H:%M:%S')\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
    fi
    
    exit 1
fi

# Cleanup old backups (local)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up old local backups..." >> "$LOG_FILE"
find "$BACKUP_DIR" -name "servistech_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup process completed" >> "$LOG_FILE"

#!/bin/sh
# =============================================================================
# SERVISTECH ERP V4.0 - Backup Cleanup Script
# Removes old backups based on retention policy
# =============================================================================

set -e

LOG_FILE="/var/log/cron/cleanup.log"
BACKUP_DIR="/backups"
RETENTION_DAYS=30
S3_BUCKET="${BACKUP_S3_BUCKET:-servistech-backups}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup cleanup..." >> "$LOG_FILE"

# Clean local backups
LOCAL_COUNT=$(find "$BACKUP_DIR" -name "servistech_backup_*.sql.gz" -mtime +$RETENTION_DAYS | wc -l)
if [ "$LOCAL_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -name "servistech_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deleted $LOCAL_COUNT old local backups" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No old local backups to delete" >> "$LOG_FILE"
fi

# Clean S3 backups if configured
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning S3 backups..." >> "$LOG_FILE"
    
    # List and delete old backups from S3
    CUTOFF_DATE=$(date -d "-$RETENTION_DAYS days" +%Y-%m-%d)
    
    aws s3 ls "s3://${S3_BUCKET}/daily/" --recursive | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_KEY=$(echo "$line" | awk '{print $4}')
        
        if [ "$FILE_DATE" \< "$CUTOFF_DATE" ]; then
            aws s3 rm "s3://${S3_BUCKET}/${FILE_KEY}" 2>> "$LOG_FILE"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deleted from S3: $FILE_KEY" >> "$LOG_FILE"
        fi
    done
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] S3 cleanup completed" >> "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup cleanup completed" >> "$LOG_FILE"

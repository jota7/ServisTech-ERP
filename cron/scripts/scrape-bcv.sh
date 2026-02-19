#!/bin/sh
# =============================================================================
# SERVISTECH ERP V4.0 - BCV Rate Scraper Cron Job
# Triggered at 8:00 AM and 1:00 PM daily
# =============================================================================

set -e

LOG_FILE="/var/log/cron/bcv.log"
API_URL="${API_URL:-http://api:3001}"
API_KEY="${API_KEY:-cron_secure_key_2024}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting BCV rate scraping..." >> "$LOG_FILE"

# Call the API endpoint to scrape BCV rates
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/api/rates/scrape/bcv" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -H "X-Cron-Job: true" \
    2>> "$LOG_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BCV scraping completed successfully" >> "$LOG_FILE"
    echo "Response: $BODY" >> "$LOG_FILE"
    
    # Send notification to Slack if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ BCV Rate updated successfully at $(date '+%Y-%m-%d %H:%M:%S')\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: BCV scraping failed with HTTP $HTTP_CODE" >> "$LOG_FILE"
    echo "Response: $BODY" >> "$LOG_FILE"
    
    # Send error notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ BCV Rate scraping failed at $(date '+%Y-%m-%d %H:%M:%S') - HTTP $HTTP_CODE\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
    fi
    
    exit 1
fi

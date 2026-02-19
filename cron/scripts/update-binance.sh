#!/bin/sh
# =============================================================================
# SERVISTECH ERP V4.0 - Binance USDT Rate Update
# Updates USDT/VES rate from Binance P2P
# =============================================================================

set -e

LOG_FILE="/var/log/cron/binance.log"
API_URL="${API_URL:-http://api:3001}"
API_KEY="${API_KEY:-cron_secure_key_2024}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Updating Binance USDT rate..." >> "$LOG_FILE"

# Call the API endpoint to update Binance rate
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/api/rates/update/binance" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -H "X-Cron-Job: true" \
    2>> "$LOG_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Binance rate updated successfully" >> "$LOG_FILE"
    echo "Response: $BODY" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Binance update failed with HTTP $HTTP_CODE" >> "$LOG_FILE"
    echo "Response: $BODY" >> "$LOG_FILE"
    exit 1
fi

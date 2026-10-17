#!/bin/sh
# Sends a text file as a Telegram message (plain text, max 4096 chars).
#   TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=… sh scripts/notify-telegram.sh docs/PENDING_TELEGRAM.txt
# Get the token from @BotFather; the chat id from https://api.telegram.org/bot<token>/getUpdates after
# sending the bot any message. Never commit the token.
set -eu
file="${1:?usage: notify-telegram.sh <message-file>}"
: "${TELEGRAM_BOT_TOKEN:?set TELEGRAM_BOT_TOKEN}"
: "${TELEGRAM_CHAT_ID:?set TELEGRAM_CHAT_ID}"
api="${TELEGRAM_API:-https://api.telegram.org}"
[ "$(wc -c < "$file")" -le 4096 ] || { echo "message longer than 4096 bytes" >&2; exit 1; }
resp="$(curl -sS --max-time 20 -X POST "$api/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  --data-urlencode "chat_id=$TELEGRAM_CHAT_ID" --data-urlencode "text@$file" \
  --data-urlencode "disable_web_page_preview=true")"
echo "$resp" | grep -Eq '"ok": *true' || { echo "Telegram error: $resp" >&2; exit 1; }
echo "✅ sent to Telegram chat $TELEGRAM_CHAT_ID"

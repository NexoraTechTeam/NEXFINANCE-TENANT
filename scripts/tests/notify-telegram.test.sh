#!/bin/sh
# Tests scripts/notify-telegram.sh against a local fake Telegram API (no network, no real token).
set -eu
cd "$(dirname "$0")/.."
T="$(mktemp -d)"; trap 'kill $SRV 2>/dev/null || true; rm -rf "$T"' EXIT
fail() { echo "❌ $1" >&2; exit 1; }
PORT=18765
python3 - "$T/req" "$PORT" <<'PY' &
import sys, http.server, json
out, port = sys.argv[1], int(sys.argv[2])
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers['Content-Length'])).decode()
        open(out, 'w').write(self.path + '\n' + body)
        self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
        self.wfile.write(json.dumps({'ok': True, 'result': {'message_id': 1}}).encode())
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', port), H).handle_request()
PY
SRV=$!
sleep 1
printf 'Halo\nbaris kedua & simbol <b>' > "$T/msg.txt"
TELEGRAM_API="http://127.0.0.1:$PORT" TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_CHAT_ID=42 sh notify-telegram.sh "$T/msg.txt" >/dev/null
head -1 "$T/req" | grep -qx '/bot123:abc/sendMessage' || fail "wrong endpoint: $(head -1 "$T/req")"
python3 - "$T/req" <<'PY' || exit 1
import sys, urllib.parse
body = open(sys.argv[1]).read().split('\n', 1)[1]
q = urllib.parse.parse_qs(body)
assert q['chat_id'] == ['42'], q
assert q['text'] == ['Halo\nbaris kedua & simbol <b>'], q
assert 'parse_mode' not in q, 'plain text only (no escaping surprises)'
PY
TELEGRAM_BOT_TOKEN= TELEGRAM_CHAT_ID=42 sh notify-telegram.sh "$T/msg.txt" 2>/dev/null && fail "must refuse without token" || true
echo "✅ notify-telegram.sh"

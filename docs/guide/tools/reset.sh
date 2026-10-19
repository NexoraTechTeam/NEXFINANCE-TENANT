#!/bin/sh
# Issue a fresh temporary password for admin-almusabbihin via the Console API.
B=http://127.0.0.1:5080/api/v1/console; H='Host: console-nexfinance.nexoratech.co'
T=$(curl -s -X POST $B/auth/login -H "$H" -H 'content-type: application/json' -d '{"email":"ops@nexoratech.co","password":"Console-Docs-2026"}' | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
ID=$(curl -s $B/tenants -H "$H" -H "Authorization: Bearer $T" | python3 -c "import json,sys;print(json.load(sys.stdin)['tenants'][0]['id'])")
curl -s -X POST $B/tenants/$ID/reset-password -H "$H" -H "Authorization: Bearer $T" -H 'content-type: application/json' -d "{\"username\":\"${1:-admin-almusabbihin}\"}" | python3 -c "import json,sys;print(json.load(sys.stdin)['temporaryPassword'])"

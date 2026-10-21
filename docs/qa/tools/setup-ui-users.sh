#!/bin/sh
# kabag2 (temp password, exercises forced change in the UI); re-uses the sweep's other users.
B=http://127.0.0.1:5080/api/v1; H='Host: almusabbihin-nexfinance.nexoratech.co'
T=$(curl -s -X POST $B/auth/login -H "$H" -H 'content-type: application/json' -d '{"email":"admin-almusabbihin","password":"Final-Review-2026!"}' | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
curl -s -o /dev/null -w "kabag2 %{http_code}\n" -X POST $B/master/users -H "$H" -H "Authorization: Bearer $T" -H 'content-type: application/json' -d '{"name":"Kabag Dua","email":"kabag2@final.test","password":"Sementara-2026","role":"kabag"}'

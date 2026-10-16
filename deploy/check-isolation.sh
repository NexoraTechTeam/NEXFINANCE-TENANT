#!/bin/sh
# Isolation contract: this repository must never reference or reuse the running
# NexFinance (single-tenant) stacks that share the VPS. Lines that only *observe*
# those stacks (non-interference checks) carry the marker "isolation:allow".
set -eu
cd "$(dirname "$0")/.."
fail() { echo "❌ isolation contract: $1" >&2; exit 1; }

SCAN="docker-compose.saas.yml frontend-next/next.config.mjs frontend-next/Dockerfile backend/Dockerfile deploy/backup.sh deploy/traefik-rule.sh"
SCAN="$SCAN $(find .github/workflows -name '*.yml' | sort)"
for f in $SCAN; do [ -f "$f" ] || fail "expected file missing: $f"; done

for pattern in 'nexfinance-backend' 'nexfinance-frontend' 'nexfinance-dev-' 'dev-nexfinance\.nexoratech\.co' \
               'Host\(`nexfinance\.nexoratech\.co`\)' '/root/nexora-node/apps/nexfinance' 'apps/nexfinance-dev' \
               'nexfinance-dev-deploy' '-p nexfinance-dev'; do
  # grep exits 1 for "no match" (good) and 2 for errors (must fail loudly)
  set +e
  hits="$(grep -nE -e "$pattern" $SCAN | grep -v 'isolation:allow')"
  set -e
  [ -z "$hits" ] || { echo "$hits" >&2; fail "forbidden reference '$pattern'"; }
done

# Every compose invocation in workflows must use the explicit project name.
set +e
bad="$(grep -n 'docker compose' .github/workflows/*.yml | grep -v -- '-p "\$STACK"')"
set -e
[ -z "$bad" ] || { echo "$bad" >&2; fail 'docker compose without -p "$STACK"'; }

for stack in $(grep -hoiE '(STACK|stack): [a-z0-9-]+' .github/workflows/*.yml | awk '{print $2}'); do
  case "$stack" in nexfin-saas*) ;; *) fail "stack name '$stack' must start with nexfin-saas" ;; esac
done

grep -q 'nexfin-saas-backend' frontend-next/next.config.mjs || fail 'next.config.mjs BACKEND_URL default must be nexfin-saas-backend'
grep -q 'nexfin-saas-backend' frontend-next/Dockerfile || fail 'frontend Dockerfile BACKEND_URL default must be nexfin-saas-backend'
echo "✅ isolation contract holds"

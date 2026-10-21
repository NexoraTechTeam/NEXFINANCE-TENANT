#!/bin/sh
# Tests for deploy/custom-domains.sh (DNS gate) and deploy/compose-custom.sh (separate router + certificate)
# (run: sh deploy/tests/custom-domains.test.sh)
set -eu
cd "$(dirname "$0")/.."
fail() { echo "❌ $1" >&2; exit 1; }
stub="$(mktemp)"
cat > "$stub" <<'STUB'
#!/bin/sh
# fake `getent ahostsv4 <host>`: VPS hosts → 72.61.209.201, school.test → elsewhere, unknown → nothing
case "$2" in
  console-nexfinance.nexoratech.co|ready.sch.id) echo "72.61.209.201   STREAM $2" ;;
  elsewhere.sch.id) echo "10.9.9.9        STREAM $2" ;;
  *) exit 2 ;;
esac
STUB
chmod +x "$stub"
export RESOLVE_CMD="$stub ahostsv4"

out="$(sh custom-domains.sh 'ready.sch.id,missing.sch.id,elsewhere.sch.id' console-nexfinance.nexoratech.co)"
[ "$out" = ready.sch.id ] || fail "only domains pointing at the VPS are live (got '$out')"
[ -z "$(sh custom-domains.sh '' console-nexfinance.nexoratech.co)" ] || fail "no custom domains → empty"
[ -z "$(sh custom-domains.sh 'missing.sch.id' console-nexfinance.nexoratech.co)" ] || fail "unregistered domain → empty"

yaml="$(sh compose-custom.sh nexfin-saas 'ready.sch.id,b.sch.id')"
echo "$yaml" | grep -q 'traefik.http.routers.nexfin-saas-custom.rule=Host(`ready.sch.id`) || Host(`b.sch.id`)' || fail "custom router rule"
echo "$yaml" | grep -q 'traefik.http.routers.nexfin-saas-custom.tls.certresolver=myresolver' || fail "own certificate"
echo "$yaml" | grep -q 'traefik.http.routers.nexfin-saas-custom.service=nexfin-saas' || fail "same frontend service"
echo "$yaml" | grep -q 'traefik.http.routers.nexfin-saas-custom-http.middlewares=nexfin-saas-https-redirect' || fail "http → https"
sh compose-custom.sh nexfin-saas 'nexfinance.nexoratech.co' >/dev/null 2>&1 && fail "must refuse NexFinance hosts" || true # isolation:allow (negative test)
sh compose-custom.sh other-stack 'ready.sch.id' >/dev/null 2>&1 && fail "must refuse foreign stacks" || true
rm -f "$stub"
echo "✅ custom-domains tests passed"

#!/bin/sh
# Tests for deploy/env-defaults.sh and the host guard in deploy/traefik-rule.sh
# (run: sh deploy/tests/env-defaults.test.sh)
set -eu
cd "$(dirname "$0")/.."
fail() { echo "❌ $1" >&2; exit 1; }
get() { echo "$1" | grep "^$2=" | cut -d= -f2-; }

prod="$(env -i PATH="$PATH" sh env-defaults.sh production)"
[ "$(get "$prod" CONSOLE_HOSTS)" = console-nexfinance.nexoratech.co ] || fail "prod console host"
[ "$(get "$prod" TENANT_BASE_DOMAIN)" = '{label}-nexfinance.nexoratech.co' ] || fail "prod tenant pattern"
[ "$(get "$prod" SAAS_HOSTS)" = 'console-nexfinance.nexoratech.co,almusabbihin-nexfinance.nexoratech.co' ] || fail "prod hosts"
[ "$(get "$prod" ONBOARD_TENANTS)" = al-musabbihin ] || fail "prod onboard"
[ "$(get "$prod" CONSOLE_ADMIN_EMAIL)" = ops@nexoratech.co ] || fail "prod console email"
[ "$(get "$prod" SAAS_CUSTOM_HOSTS)" = almusabbihin.sch.id ] || fail "prod custom (school) domains"

stg="$(env -i PATH="$PATH" sh env-defaults.sh staging)"
[ "$(get "$stg" CONSOLE_HOSTS)" = console-nexfinance-staging.nexoratech.co ] || fail "staging console host"
[ "$(get "$stg" SAAS_HOSTS)" = 'console-nexfinance-staging.nexoratech.co,almusabbihin-nexfinance-staging.nexoratech.co' ] || fail "staging hosts"
[ -z "$(get "$stg" SAAS_CUSTOM_HOSTS)" ] || fail "staging has no custom domains"

# GitHub variables (non-empty) win over defaults
over="$(env -i PATH="$PATH" CONSOLE_HOSTS=c.example.test SAAS_HOSTS=c.example.test sh env-defaults.sh production)"
[ "$(get "$over" CONSOLE_HOSTS)" = c.example.test ] || fail "override console"
[ "$(get "$over" SAAS_HOSTS)" = c.example.test ] || fail "override hosts"
emp="$(env -i PATH="$PATH" CONSOLE_HOSTS= sh env-defaults.sh production)"
[ "$(get "$emp" CONSOLE_HOSTS)" = console-nexfinance.nexoratech.co ] || fail "empty var falls back"

sh env-defaults.sh qa 2>/dev/null && fail "unknown environment must fail" || true

# The SaaS stack must never claim the hosts of the running NexFinance product.
for h in nexfinance.nexoratech.co dev-nexfinance.nexoratech.co; do # isolation:allow (negative test)
  sh traefik-rule.sh "console-nexfinance.nexoratech.co, $h" >/dev/null 2>&1 && fail "traefik-rule.sh accepted $h" || true
done
[ "$(sh traefik-rule.sh 'console-nexfinance.nexoratech.co,almusabbihin-nexfinance.nexoratech.co')" = \
  'Host(`console-nexfinance.nexoratech.co`) || Host(`almusabbihin-nexfinance.nexoratech.co`)' ] || fail "rule"
echo "✅ env-defaults.sh + traefik-rule.sh"

#!/bin/sh
# Prints the deploy settings of an environment as KEY=VALUE lines. Non-empty values already in the
# environment (GitHub environment variables) win; everything else falls back to the Nexora defaults,
# so a deploy needs no manual GitHub setup.
#   sh deploy/env-defaults.sh <staging|production>
set -eu
case "${1:-}" in
  production) suffix="" ;;
  staging) suffix="-staging" ;;
  *) echo "usage: env-defaults.sh <staging|production>" >&2; exit 1 ;;
esac
zone="nexoratech.co"
: "${CONSOLE_HOSTS:=console-nexfinance$suffix.$zone}"
: "${TENANT_BASE_DOMAIN:={label\}-nexfinance$suffix.$zone}"
: "${SAAS_HOSTS:=$CONSOLE_HOSTS,almusabbihin-nexfinance$suffix.$zone}"
: "${ONBOARD_TENANTS:=al-musabbihin}"
: "${CONSOLE_ADMIN_EMAIL:=ops@nexoratech.co}"
: "${DEMO_TENANT_HOSTS:=}"
for k in CONSOLE_HOSTS TENANT_BASE_DOMAIN SAAS_HOSTS ONBOARD_TENANTS CONSOLE_ADMIN_EMAIL DEMO_TENANT_HOSTS; do
  eval "printf '%s=%s\n' $k \"\$$k\""
done

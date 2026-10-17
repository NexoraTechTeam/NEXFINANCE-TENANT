#!/bin/sh
# One-time GitHub setup for a deploy environment (run by a repo admin, needs `gh auth login`).
#
#   sh deploy/setup-github.sh staging    ops@nexoratech.co
#   sh deploy/setup-github.sh production ops@nexoratech.co
#
# Creates the environment, generates secrets that are not set yet (existing ones are kept
# unless FORCE=1) and writes the variables. Override any variable through the environment,
# e.g. SAAS_HOSTS="console.x, a.x" sh deploy/setup-github.sh production ops@x.
# The generated console password is printed once — store it in the team password manager.
set -eu

ENV_NAME="${1:?usage: setup-github.sh <staging|production> <console-admin-email>}"
ADMIN_EMAIL="${2:?usage: setup-github.sh <staging|production> <console-admin-email>}"
REPO="${REPO:-NexoraTechTeam/NEXFINANCE-TENANT}"
BASE="${BASE_DOMAIN:-nexfinance.nexoratech.co}"

case "$ENV_NAME" in
  staging)
    : "${CONSOLE_HOSTS:=console-staging.$BASE}"
    : "${TENANT_BASE_DOMAIN:=staging.$BASE}" ;;
  production)
    : "${CONSOLE_HOSTS:=console.$BASE}"
    : "${TENANT_BASE_DOMAIN:=$BASE}" ;;
  *) echo "environment must be staging or production" >&2; exit 1 ;;
esac
: "${ONBOARD_TENANTS:=al-musabbihin}"
: "${SAAS_HOSTS:=$CONSOLE_HOSTS, al-musabbihin.$TENANT_BASE_DOMAIN}"
: "${DEMO_TENANT_HOSTS:=}"

command -v gh >/dev/null || { echo "install the GitHub CLI first: https://cli.github.com" >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }
sh "$(dirname "$0")/traefik-rule.sh" "$SAAS_HOSTS" >/dev/null

echo "→ environment $ENV_NAME on $REPO"
gh api -X PUT "repos/$REPO/environments/$ENV_NAME" >/dev/null

existing="$(gh secret list --repo "$REPO" --env "$ENV_NAME" --json name -q '.[].name' 2>/dev/null || true)"
has_secret() { echo "$existing" | grep -qx "$1"; }
put_secret() {
  if has_secret "$1" && [ "${FORCE:-0}" != 1 ]; then echo "  = secret $1 (kept)"; return 1; fi
  printf '%s' "$2" | gh secret set "$1" --repo "$REPO" --env "$ENV_NAME"
  echo "  + secret $1"
}

put_secret SAAS_JWT_SECRET "$(openssl rand -hex 48)" || true
put_secret SAAS_DB_PASSWORD "$(openssl rand -hex 24)" || true
put_secret SAAS_CONSOLE_ADMIN_EMAIL "$ADMIN_EMAIL" || true
CONSOLE_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)Aa1"
if put_secret SAAS_CONSOLE_ADMIN_PASSWORD "$CONSOLE_PASSWORD"; then
  echo
  echo "  Console login for $ENV_NAME (shown once): $ADMIN_EMAIL / $CONSOLE_PASSWORD"
  echo
fi

for pair in "SAAS_HOSTS=$SAAS_HOSTS" "CONSOLE_HOSTS=$CONSOLE_HOSTS" "TENANT_BASE_DOMAIN=$TENANT_BASE_DOMAIN" \
            "ONBOARD_TENANTS=$ONBOARD_TENANTS" "DEMO_TENANT_HOSTS=$DEMO_TENANT_HOSTS"; do
  name="${pair%%=*}"; value="${pair#*=}"
  if [ -z "$value" ]; then echo "  - var $name (empty, skipped)"; continue; fi
  gh variable set "$name" --repo "$REPO" --env "$ENV_NAME" --body "$value"
  echo "  + var $name=$value"
done

echo
echo "DNS: point these hosts to the VPS (or one wildcard *.$TENANT_BASE_DOMAIN):"
for h in $(echo "$SAAS_HOSTS" | tr ',' ' '); do echo "  $h"; done
echo "Then re-run the deploy: gh workflow run deploy-saas$( [ "$ENV_NAME" = staging ] && echo -staging).yml --repo $REPO --ref $( [ "$ENV_NAME" = staging ] && echo dev || echo main)"

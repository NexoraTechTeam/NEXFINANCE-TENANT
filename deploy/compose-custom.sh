#!/bin/sh
# Compose override with a separate Traefik router (and certificate) for schools' own domains, so a domain
# that stops resolving can never block the certificate of the Nexora hosts.
#   sh deploy/compose-custom.sh <stack> "<domain,domain>" > docker-compose.custom-domains.yml
set -eu
stack="$1"
case "$stack" in nexfin-saas | nexfin-saas-staging) ;; *) echo "refusing stack $stack" >&2; exit 1 ;; esac
rule="$(sh "$(dirname "$0")/traefik-rule.sh" "$2")"
r="$stack-custom"
cat <<YAML
services:
  frontend:
    labels:
      - "traefik.http.routers.$r.rule=$rule"
      - "traefik.http.routers.$r.entrypoints=websecure"
      - "traefik.http.routers.$r.tls.certresolver=myresolver"
      - "traefik.http.routers.$r.service=$stack"
      - "traefik.http.routers.$r-http.rule=$rule"
      - "traefik.http.routers.$r-http.entrypoints=web"
      - "traefik.http.routers.$r-http.middlewares=$stack-https-redirect"
      - "traefik.http.routers.$r-http.service=$stack"
YAML

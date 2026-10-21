#!/bin/sh
# Prints the custom (school) domains whose DNS already points at this VPS, comma-separated.
# The reference host is one of ours (e.g. the console host); a domain is live when its IPv4 set matches.
#   sh deploy/custom-domains.sh "<domain,domain>" <reference-host>
set -eu
resolve() { ${RESOLVE_CMD:-getent ahostsv4} "$1" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' '; }
[ -n "$(echo "${1:-}" | tr -d ', ')" ] || exit 0   # no custom domains configured
ref="$(resolve "$2")"
[ -n "$ref" ] || { echo "⚠ cannot resolve reference host $2 — no custom domain routed" >&2; exit 0; }
live=""
for host in $(echo "${1:-}" | tr ',' ' '); do
  ips="$(resolve "$host")"
  [ -n "$ips" ] && [ "$ips" = "$ref" ] && live="${live:+$live,}$host"
done
echo "$live"

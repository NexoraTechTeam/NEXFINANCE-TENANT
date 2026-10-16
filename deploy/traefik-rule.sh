#!/bin/sh
# Builds a Traefik rule from a comma-separated host list:
#   deploy/traefik-rule.sh "console.example.com, a.example.com" → Host(`console.example.com`) || Host(`a.example.com`)
set -eu
rule=""
for host in $(echo "$1" | tr ',' ' '); do
  case "$host" in
    *[!a-z0-9.-]* | "" | .* | *.) echo "invalid host: $host" >&2; exit 1 ;;
  esac
  rule="${rule:+$rule || }Host(\`$host\`)"
done
[ -n "$rule" ] || { echo "no hosts given" >&2; exit 1; }
echo "$rule"

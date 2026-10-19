#!/bin/sh
# Tests for deploy/ensure-secret.sh (run: sh deploy/tests/ensure-secret.test.sh)
set -eu
cd "$(dirname "$0")/.."
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
fail() { echo "❌ $1" >&2; exit 1; }

a="$(sh ensure-secret.sh "$T/s/db_password")"
[ "${#a}" -ge 32 ] || fail "generated secret too short"
echo "$a" | grep -qE '^[0-9a-f]+$' || fail "generated secret must be URL-safe hex"
[ "$(stat -c %a "$T/s/db_password")" = 600 ] || fail "secret file must be mode 600"
[ "$(stat -c %a "$T/s")" = 700 ] || fail "secret dir must be mode 700"

b="$(sh ensure-secret.sh "$T/s/db_password")"
[ "$a" = "$b" ] || fail "secret must be stable across runs"

c="$(PROVIDED=from-github sh ensure-secret.sh "$T/s/jwt" "from-github")"
[ "$c" = from-github ] || fail "provided value must win"
[ "$(cat "$T/s/jwt")" = from-github ] || fail "provided value must be persisted"
d="$(sh ensure-secret.sh "$T/s/jwt" "")"
[ "$d" = from-github ] || fail "empty provided value keeps the stored secret"

sh ensure-secret.sh 2>/dev/null && fail "missing path must fail" || true
echo "✅ ensure-secret.sh"

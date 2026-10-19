#!/bin/sh
# Prints a deployment secret that stays stable across deploys.
#   sh deploy/ensure-secret.sh <file> [provided-value]
# - provided-value (e.g. a GitHub secret) wins and is persisted to <file>;
# - otherwise the value stored in <file> is reused;
# - otherwise a random hex secret is generated and stored.
# Keep <file> OUTSIDE the rsync'd app directory (rsync --delete would remove it).
set -eu
file="${1:?usage: ensure-secret.sh <file> [provided-value]}"
provided="${2:-}"
umask 077
mkdir -p "$(dirname "$file")"
chmod 700 "$(dirname "$file")"
if [ -n "$provided" ]; then
  printf '%s' "$provided" > "$file"
elif [ ! -s "$file" ]; then
  od -An -tx1 -N32 /dev/urandom | tr -d ' \n' > "$file"
fi
chmod 600 "$file"
cat "$file"

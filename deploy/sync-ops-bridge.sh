#!/bin/sh
# Refreshes the interim ops bridge (branch ops/tenant-deploy of Nexora-Tech-Team/NEXFINANCE) with the
# current HEAD of this repository and pushes it, which deploys staging → production with the VPS runner.
# See docs/OPERATIONS.md → "Interim deploy path — ops bridge". Remove once this repo has its own runner.
#
#   sh deploy/sync-ops-bridge.sh <work-dir>
set -eu
WORK="${1:?usage: sync-ops-bridge.sh <work-dir>}"
REMOTE="${BRIDGE_REMOTE:-https://github.com/Nexora-Tech-Team/NEXFINANCE}"
BRANCH=ops/tenant-deploy
SRC="$(cd "$(dirname "$0")/.." && pwd)"
REV="$(git -C "$SRC" rev-parse --short HEAD)"

[ -d "$WORK/.git" ] || git clone -q --depth 5 --branch "$BRANCH" --single-branch "$REMOTE" "$WORK"
git -C "$WORK" pull -q --ff-only origin "$BRANCH"
keep="$(mktemp -d)"
cp "$WORK/.github/workflows/tenant-bridge.yml" "$WORK/ops/handover.pub.pem" "$keep/"

# Replace the snapshot (everything except .git) with this repo's HEAD.
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
git -C "$SRC" archive HEAD | tar -x -C "$WORK"
rm -f "$WORK/.github/workflows/deploy-saas.yml" "$WORK/.github/workflows/deploy-saas-staging.yml"
# The bridge runs in another repository: never bind to its GitHub environments.
sed -i '/^    environment: \${{ inputs.environment }}$/d' "$WORK/.github/workflows/saas-pipeline.yml"
mkdir -p "$WORK/ops"
cp "$keep/tenant-bridge.yml" "$WORK/.github/workflows/"
cp "$keep/handover.pub.pem" "$WORK/ops/"
rm -rf "$keep"

(cd "$WORK" && sh deploy/check-isolation.sh)
git -C "$WORK" add -A
git -C "$WORK" -c user.name="$(git -C "$SRC" config user.name || echo nexora-ops)" \
  -c user.email="$(git -C "$SRC" config user.email || echo ops@nexoratech.co)" \
  commit -qm "ops: sync NexFinance Tenant @$REV" ${BRIDGE_TRAILER:+-m "$BRIDGE_TRAILER"} \
  || { echo "bridge already at $REV"; exit 0; }
git -C "$WORK" push -q origin "$BRANCH"
echo "✅ ops bridge synced to $REV and pushed (deploy running on the VPS runner)"

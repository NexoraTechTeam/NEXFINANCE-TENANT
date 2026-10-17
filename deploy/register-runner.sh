#!/bin/sh
# Registers a dedicated self-hosted runner for this repository on the VPS.
# Run on the VPS as the runner user (the one in the docker group), with a short-lived token from
# GitHub → repo Settings → Actions → Runners → New self-hosted runner (or:
#   gh api -X POST repos/NexoraTechTeam/NEXFINANCE-TENANT/actions/runners/registration-token -q .token)
#
#   RUNNER_TOKEN=xxxx sh register-runner.sh
#
# It installs into its own directory and its own systemd service, so runners that already
# serve other repositories are left exactly as they are.
set -eu

REPO="${REPO:-NexoraTechTeam/NEXFINANCE-TENANT}"
TOKEN="${RUNNER_TOKEN:?set RUNNER_TOKEN (registration token for $REPO)}"
VERSION="${RUNNER_VERSION:-2.328.0}"
DIR="${RUNNER_DIR:-$HOME/actions-runner-nexfin-saas}"
NAME="${RUNNER_NAME:-$(hostname)-nexfin-saas}"

case "$(uname -m)" in x86_64) ARCH=x64 ;; aarch64 | arm64) ARCH=arm64 ;; *) echo "unsupported arch" >&2; exit 1 ;; esac
docker info >/dev/null 2>&1 || { echo "$(id -un) cannot reach docker — run as the runner user in the docker group" >&2; exit 1; }
[ -e "$DIR/.runner" ] && { echo "a runner is already configured in $DIR" >&2; exit 1; }

mkdir -p "$DIR" && cd "$DIR"
curl -fsSL -o runner.tgz "https://github.com/actions/runner/releases/download/v$VERSION/actions-runner-linux-$ARCH-$VERSION.tar.gz"
tar xzf runner.tgz && rm runner.tgz

./config.sh --unattended --replace --url "https://github.com/$REPO" --token "$TOKEN" \
  --name "$NAME" --labels "self-hosted,nexfin-saas" --work _work

sudo ./svc.sh install "$(id -un)"
sudo ./svc.sh start
echo "✅ runner '$NAME' online for $REPO (service in $DIR)"

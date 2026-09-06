#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP_DIR="${APP_DIR:-$ROOT_DIR}" \
DOMAIN="${DOMAIN:-onetripz.com}" \
NGINX_SITE_NAME="${NGINX_SITE_NAME:-onetripz}" \
  "$ROOT_DIR/scripts/deploy-vps.sh"
#!/usr/bin/env bash
set -Eeuo pipefail

# Deploy the built OneTrip static site to an Nginx-backed VPS.
# Usage:
#   DOMAIN=onetrip.example DEPLOY_DIR=/var/www/onetrip ./scripts/deploy-vps.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${DOMAIN:-}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/onetrip}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-onetrip}"

if [[ -z "$DOMAIN" ]]; then
  echo "Missing DOMAIN. Example: DOMAIN=travel.example.com $0" >&2
  exit 1
fi

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm is required. Install Node.js 20+ and pnpm on the VPS first." >&2
  exit 1
}

cd "$ROOT_DIR"

echo "Installing locked dependencies..."
pnpm install --frozen-lockfile

echo "Building OneTrip..."
pnpm --filter @workspace/onetrip run build

if [[ ! -d "$ROOT_DIR/artifacts/onetrip/dist/public" ]]; then
  echo "Build output was not found at artifacts/onetrip/dist/public" >&2
  exit 1
fi

echo "Publishing files to $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo rsync -a --delete "$ROOT_DIR/artifacts/onetrip/dist/public/" "$DEPLOY_DIR/"
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo find "$DEPLOY_DIR" -type d -exec chmod 755 {} \;
sudo find "$DEPLOY_DIR" -type f -exec chmod 644 {} \;

if command -v nginx >/dev/null 2>&1 && [[ -d /etc/nginx/sites-available ]]; then
  NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE_NAME"
  NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE_NAME"
  TMP_CONFIG="$(mktemp)"

  cat > "$TMP_CONFIG" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $DEPLOY_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok\n";
    }

    location ~* \.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)\$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files \$uri =404;
    }
}
EOF

  sudo install -m 644 "$TMP_CONFIG" "$NGINX_AVAILABLE"
  rm -f "$TMP_CONFIG"
  sudo ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  sudo nginx -t
  sudo systemctl reload nginx
  echo "Nginx configured for $DOMAIN."
else
  echo "Nginx was not detected; files were copied but web-server configuration was skipped."
fi

echo "OneTrip deployed successfully to $DEPLOY_DIR."
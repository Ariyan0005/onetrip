#!/usr/bin/env bash
set -Eeuo pipefail

# Update and deploy the built OneTrip static site to an Nginx-backed VPS.
# Usage from the cloned repository:
#   DOMAIN=onetrip.example ./scripts/deploy-vps.sh
#
# Usage when installed as /usr/local/bin/onetrip-deploy:
#   APP_DIR=/var/www/onetripz.com DOMAIN=onetrip.example onetrip-deploy

if [[ -n "${APP_DIR:-}" ]]; then
  APP_DIR="$(cd "$APP_DIR" && pwd)"
elif [[ -d "$PWD/.git" ]]; then
  APP_DIR="$(pwd)"
else
  APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

DOMAIN="${DOMAIN:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
BUILD_DIR="$APP_DIR/artifacts/onetrip/dist/public"
DEPLOY_DIR="${DEPLOY_DIR:-$BUILD_DIR}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-onetripz.com}"

if [[ -z "$DOMAIN" ]]; then
  echo "Missing DOMAIN. Example: DOMAIN=travel.example.com $0" >&2
  exit 1
fi

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm is required. Install Node.js 20+ and pnpm on the VPS first." >&2
  exit 1
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "APP_DIR must point to the cloned OneTrip git repository: $APP_DIR" >&2
  exit 1
fi

if [[ "$DEPLOY_DIR" == "$APP_DIR" ]]; then
  echo "DEPLOY_DIR cannot be the repository root; use the default build output or a separate directory." >&2
  exit 1
fi

echo "Updating source from origin/$GIT_BRANCH..."
git -C "$APP_DIR" pull --ff-only origin "$GIT_BRANCH"

cd "$APP_DIR"

echo "Installing locked dependencies..."
pnpm install --frozen-lockfile

echo "Building OneTrip..."
PORT="${PORT:-23051}" BASE_PATH="${BASE_PATH:-/}" \
  pnpm --filter @workspace/onetrip run build

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Build output was not found at $BUILD_DIR" >&2
  exit 1
fi

if [[ "$DEPLOY_DIR" != "$BUILD_DIR" ]]; then
  echo "Publishing files to $DEPLOY_DIR..."
  sudo mkdir -p "$DEPLOY_DIR"
  sudo rsync -a --delete "$BUILD_DIR/" "$DEPLOY_DIR/"
else
  echo "Serving the build output directly from $BUILD_DIR."
fi

sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo find "$DEPLOY_DIR" -type d -exec chmod 755 {} \;
sudo find "$DEPLOY_DIR" -type f -exec chmod 644 {} \;

if command -v nginx >/dev/null 2>&1 && [[ -d /etc/nginx/sites-available ]]; then
  NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_SITE_NAME"
  NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE_NAME"
  if [[ -f "$NGINX_AVAILABLE" ]]; then
    echo "Existing Nginx config detected at $NGINX_AVAILABLE; leaving it unchanged."
    echo "Make sure its root points to $DEPLOY_DIR."
  else
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
  fi
  sudo nginx -t
  sudo systemctl reload nginx
  echo "Nginx reloaded for $DOMAIN."
else
  echo "Nginx was not detected; files were copied but web-server configuration was skipped."
fi

echo "OneTrip deployed successfully to $DEPLOY_DIR."
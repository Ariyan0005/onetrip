#!/usr/bin/env bash
set -Eeuo pipefail

# Update and deploy the OneTripz static site and API to an Nginx-backed VPS.
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
API_PORT="${API_PORT:-5001}"

if [[ -z "$DOMAIN" ]]; then
  echo "Missing DOMAIN. Example: DOMAIN=travel.example.com $0" >&2
  exit 1
fi

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm is required. Install Node.js 20+ and pnpm on the VPS first." >&2
  exit 1
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "APP_DIR must point to the cloned OneTripz git repository: $APP_DIR" >&2
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

echo "Building OneTripz..."
PORT="${PORT:-23051}" BASE_PATH="${BASE_PATH:-/}" \
  pnpm --filter @workspace/onetrip run build
echo "Building the widget API..."
pnpm --filter @workspace/api-server run build

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
    NGINX_SERVER_NAMES="$DOMAIN"
    if [[ "$DOMAIN" != www.* ]]; then
      NGINX_SERVER_NAMES+=" www.$DOMAIN"
    fi

    # Reconcile the site config on each deploy so stale Nginx rules cannot hide
    # SPA routes or the API. Set PRESERVE_NGINX_CONFIG=1 for externally managed
    # configs (for example, a custom TLS setup) and apply routing manually.
    #
    # The previous config only listened on port 80. When Cloudflare or a browser
    # reached the VPS over HTTPS, Nginx could therefore select another site's
    # 443 server block. Prefer explicit certificate paths, then detect the
    # standard certificate locations used by Certbot and common VPS setups.
    SSL_CERTIFICATE="${SSL_CERTIFICATE:-}"
    SSL_CERTIFICATE_KEY="${SSL_CERTIFICATE_KEY:-}"
    if [[ -z "$SSL_CERTIFICATE" && -z "$SSL_CERTIFICATE_KEY" ]]; then
      for CERT_DIR in \
        "/etc/letsencrypt/live/$DOMAIN" \
        "/etc/ssl/$DOMAIN" \
        "/etc/nginx/ssl/$DOMAIN"; do
        if [[ -f "$CERT_DIR/fullchain.pem" && -f "$CERT_DIR/privkey.pem" ]]; then
          SSL_CERTIFICATE="$CERT_DIR/fullchain.pem"
          SSL_CERTIFICATE_KEY="$CERT_DIR/privkey.pem"
          break
        elif [[ -f "$CERT_DIR/$DOMAIN.crt" && -f "$CERT_DIR/$DOMAIN.key" ]]; then
          SSL_CERTIFICATE="$CERT_DIR/$DOMAIN.crt"
          SSL_CERTIFICATE_KEY="$CERT_DIR/$DOMAIN.key"
          break
        fi
      done
    fi

    if [[ -z "$SSL_CERTIFICATE" && -z "$SSL_CERTIFICATE_KEY" ]] \
      && command -v nginx >/dev/null 2>&1; then
      mapfile -t DETECTED_SSL_PATHS < <(
        sudo nginx -T 2>/dev/null | awk -v domain="$DOMAIN" '
          $1 == "server_name" {
            is_target = 0
            for (i = 2; i <= NF; i++) {
              name = $i
              gsub(";", "", name)
              if (name == domain) is_target = 1
            }
          }
          is_target && $1 == "ssl_certificate" {
            gsub(";", "", $2)
            certificate = $2
          }
          is_target && $1 == "ssl_certificate_key" {
            gsub(";", "", $2)
            certificate_key = $2
          }
          is_target && /^}/ {
            if (certificate != "" && certificate_key != "") {
              print certificate
              print certificate_key
              exit
            }
            certificate = ""
            certificate_key = ""
            is_target = 0
          }
        ' || true
      )
      if [[ "${#DETECTED_SSL_PATHS[@]}" -eq 2 ]]; then
        SSL_CERTIFICATE="${DETECTED_SSL_PATHS[0]}"
        SSL_CERTIFICATE_KEY="${DETECTED_SSL_PATHS[1]}"
      fi
    fi

    NGINX_SSL_DIRECTIVES=""
    if [[ -n "$SSL_CERTIFICATE" && -n "$SSL_CERTIFICATE_KEY" \
      && -f "$SSL_CERTIFICATE" && -f "$SSL_CERTIFICATE_KEY" ]]; then
      NGINX_SSL_DIRECTIVES="  ssl_certificate $SSL_CERTIFICATE;
  ssl_certificate_key $SSL_CERTIFICATE_KEY;"
      echo "HTTPS certificate detected; configuring HTTP and HTTPS for $DOMAIN."
    else
      echo "No TLS certificate pair found for $DOMAIN; configuring HTTP only."
      echo "Set SSL_CERTIFICATE and SSL_CERTIFICATE_KEY to configure the HTTPS server block."
    fi

    write_server_block() {
      local port="$1"
      local ssl_suffix="$2"
      cat <<EOF
server {
  listen ${port}${ssl_suffix};
  listen [::]:${port}${ssl_suffix};
  server_name $NGINX_SERVER_NAMES;

  root $DEPLOY_DIR;
  index index.html;

  ${NGINX_SSL_DIRECTIVES}

  location /api/ {
      proxy_pass http://127.0.0.1:$API_PORT;
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # These are client-side routes. Keep explicit fallbacks so an existing
  # Nginx location or a trailing-slash variant cannot turn them into 404s.
  location = /admin {
      try_files \$uri /index.html;
  }

  location = /admin/ {
      try_files \$uri /index.html;
  }

  location = /admin-setup {
      try_files \$uri /index.html;
  }

  location = /admin-setup/ {
      try_files \$uri /index.html;
  }

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
    }

    TMP_CONFIG="$(mktemp)"
    trap 'rm -f "$TMP_CONFIG"' EXIT
    {
      write_server_block 80 ""
      if [[ -n "$NGINX_SSL_DIRECTIVES" ]]; then
        write_server_block 443 " ssl"
      fi
    } > "$TMP_CONFIG"

    if [[ "${PRESERVE_NGINX_CONFIG:-0}" == "1" && -f "$NGINX_AVAILABLE" ]]; then
      echo "PRESERVE_NGINX_CONFIG=1; leaving existing Nginx config unchanged."
      echo "Ensure it serves $DEPLOY_DIR, falls back to /index.html, and proxies /api/ to 127.0.0.1:$API_PORT."
    else
      sudo install -m 644 "$TMP_CONFIG" "$NGINX_AVAILABLE"
      echo "Installed Nginx config at $NGINX_AVAILABLE."
    fi

    rm -f "$TMP_CONFIG"
    trap - EXIT
    sudo ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    sudo nginx -t
    sudo systemctl reload nginx
    echo "Nginx reloaded for $DOMAIN."
    else
    echo "Nginx was not detected; files were copied but web-server configuration was skipped."
    fi

if command -v systemctl >/dev/null 2>&1; then
  API_UNIT_PATH="/etc/systemd/system/onetrip-api.service"
  if [[ ! -f "$API_UNIT_PATH" ]] || ! cmp -s "$APP_DIR/scripts/onetrip-api.service" "$API_UNIT_PATH"; then
    echo "Installing/updating onetrip-api.service..."
    sudo install -m 644 "$APP_DIR/scripts/onetrip-api.service" "$API_UNIT_PATH"
    sudo systemctl daemon-reload
  fi
  sudo systemctl enable onetrip-api.service
  echo "Restarting onetrip-api.service..."
  sudo systemctl restart onetrip-api.service
else
  echo "No onetrip-api.service found; start the API with PORT=$API_PORT pnpm --filter @workspace/api-server run start."
fi

echo "OneTripz deployed successfully to $DEPLOY_DIR. Configure Supabase and admin secrets in the API process environment."
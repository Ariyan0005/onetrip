# OneTrip

OneTrip is an English-first travel booking website for comparing flights, stays, tours, and transfers through a Travelpayouts partner flow.

## Local development

```bash
pnpm install
PORT=23051 BASE_PATH=/ pnpm --filter @workspace/onetrip run dev
```

## Production build

```bash
PORT=23051 BASE_PATH=/ pnpm --filter @workspace/onetrip run build
```

## Deploy to a VPS

The included script builds the app, syncs the static output to Nginx, and creates an Nginx site configuration when Nginx is installed:

```bash
APP_DIR=/var/www/onetripz.com \
DOMAIN=your-domain.com \
./scripts/deploy-vps.sh
```

After the one-time setup, the same command always pulls the latest `main`
branch, installs the locked dependencies, rebuilds the app, and reloads Nginx.
The site does not need a `.env` file for this static release.

Optional overrides:

```bash
DOMAIN=your-domain.com \
APP_DIR=/var/www/onetripz.com \
DEPLOY_DIR=/var/www/onetrip-public \
NGINX_SITE_NAME=onetrip \
./scripts/deploy-vps.sh
```

After the first HTTP deploy, point the domain DNS to the VPS and use your VPS provider's TLS tooling (for example Certbot) to enable HTTPS.

## Partner booking script

The supplied Travelpayouts loader is included in `artifacts/onetrip/index.html`. The local preview can show provider-side warnings because the partner script validates the live domain; that does not block the static site build.
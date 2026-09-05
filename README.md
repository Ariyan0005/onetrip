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
DOMAIN=your-domain.com ./scripts/deploy-vps.sh
```

Optional overrides:

```bash
DOMAIN=your-domain.com \
DEPLOY_DIR=/var/www/onetrip \
NGINX_SITE_NAME=onetrip \
./scripts/deploy-vps.sh
```

After the first HTTP deploy, point the domain DNS to the VPS and use your VPS provider's TLS tooling (for example Certbot) to enable HTTPS.

## Partner booking script

The supplied Travelpayouts loader is included in `artifacts/onetrip/index.html`. The local preview can show provider-side warnings because the partner script validates the live domain; that does not block the static site build.
# OneTrip

OneTrip is an English-first travel booking website for comparing flights, stays, tours, and transfers through a calm, partner-ready search experience.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- API widget storage env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PANEL_PASSWORD`, and `SESSION_SECRET`
- Run `supabase/widget-config.sql` once in Supabase SQL Editor before publishing widgets.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/onetrip/` — the Vite-powered OneTrip web app and its static production build.
- `artifacts/onetrip/src/App.tsx` — the homepage interactions, booking search surface, language selector, and Travelpayouts loader guard.
- `artifacts/onetrip/src/index.css` — OneTrip visual system and responsive styles.
- `artifacts/onetrip/public/onetrip-logo.png` — canonical supplied logo used in the app and favicon.
- `scripts/deploy-vps.sh` — VPS build, static publish, and optional Nginx configuration script.

## Architecture decisions

- The public Vite app reads published travel widgets from the API; Travelpayouts owns the partner search/booking handoff.
- The Travelpayouts loader is included in `index.html` with the supplied attributes and guarded at runtime against duplicate loading.
- The booking form keeps the comparison flow explicit and partner-ready rather than pretending to process payments locally.
- VPS delivery targets Nginx-served static files plus a long-running API process. Nginx proxies `/api/` to the API port.

## Product

Users can explore destinations, switch between flights/hotels/tours/transfers, enter a trip search, choose a language from a broad global list, and move into the partner booking flow.

## User preferences

- Keep the user-facing product copy and interface fully in English.

## Gotchas

- Build commands need `PORT` and `BASE_PATH` in the Replit workflow; the VPS script supplies the normal Vite build command directly.
- Set `DOMAIN` when running `scripts/deploy-vps.sh`; it configures Nginx only when Nginx is already installed.
- On a VPS, install `scripts/onetrip-api.service`, create `/etc/onetrip/onetrip-api.env` with the four API variables, enable the service, and ensure Nginx proxies `/api/` to `API_PORT`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `scripts/deploy-vps.sh` for the VPS deployment entrypoint.

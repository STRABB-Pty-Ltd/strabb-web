# Web build-arg matrix (F.8)

`strabb-web` bakes three URLs into the image at **build** time. Next.js
evaluates `next.config.ts` during `next build` for the standalone output, so
these cannot be set only at runtime: a runtime-only value falls back to
`http://localhost:8000` and every `/be/*` proxy call dies with ECONNREFUSED
(see `.claude/rules/gotchas.md`). Any change to these needs a rebuild, not a
container restart.

| Build arg | local (`.env.local`) | staging | production |
| --- | --- | --- | --- |
| `NEXTAUTH_URL` | `http://localhost:3100` | `https://staging.strabb.io` | `https://app.strabb.io` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | `https://api.staging.strabb.io` | `https://api.strabb.io` |
| `INTERNAL_API_URL` | `http://localhost:8000` | staging API Container Apps FQDN | production API Container Apps FQDN (`...wittyground-f9a24fce.australiaeast.azurecontainerapps.io`) |

- `NEXTAUTH_SECRET` is **runtime-only** (passed as a Container App env var),
  never baked into the image.
- `NEXT_PUBLIC_API_URL` is client-baked (public); `INTERNAL_API_URL` and
  `NEXTAUTH_URL` are server-side. The production values are the ones the
  `deploy-production.yml` `az acr build --build-arg ...` step passes.

## Deferred (tracked, not yet done)

- **e2e smoke in CI (F.8b):** the Playwright specs sign in against a real
  seeded API (no request mocking), so running them in CI needs a full
  web+api+worker+Postgres compose stack with seed data. Deferred until that
  CI stack is stood up; the specs run locally/QA in the meantime.
- **Post-deploy smoke (F.8d):** a content-asserting probe of the prod domain
  (login page render + `/api/health` through app.strabb.io) depends on the
  prod domains existing (F.9); wire it once F.9 lands.

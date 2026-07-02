# Rule: environments and the QA loop

## Environments
- **QA (branch testing):** `qa.strabb.io` - api/worker/web trio on the
  iMeg Coolify (self-hosted, behind a Cloudflare tunnel + Cloudflare
  Access). Re-point-one-env model: point the apps at a branch, deploy,
  test, reset to main.
- **Staging:** `staging.strabb.io` + `api.staging.strabb.io` - deployed
  on every main push by CI. Migrations run on container boot via the
  Dockerfile CMD (`alembic upgrade head`), not in CI.
- **Production:** Chris only. A session never deploys anywhere.

## The QA loop replaces "verify locally" (Will's machine)
Do not reach for local Docker to verify a branch. Push the branch, then
drive QA with `/Users/willflynn/scripts/strabb/strabb-qa`:
- `strabb-qa deploy <branch>` - re-point the QA apps at the branch and
  deploy (repos without that branch stay on main)
- `strabb-qa watch` - poll until deployments finish, then health-check
  api `/health` JSON and web markup (false-pass guarded)
- `strabb-qa logs api|worker|web` - tail container logs
- `strabb-qa reset` - return everything to main
The script is Will-machine-only (the Coolify API token lives on the
iMeg). On any other machine, use the Coolify dashboard over Tailscale.

## Gotchas that bite in QA/staging
- `DATABASE_URL` must use the `postgresql+asyncpg://` scheme - a plain
  `postgresql://` URL fails at startup.
- Web app domains are `http://` with Force HTTPS OFF (Cloudflare
  terminates TLS); do not "fix" this.
- Cloudflare Access blocks unauthenticated requests to QA, including
  inbound webhooks - add a service-token bypass if a webhook must reach
  QA.

## Docker on Will's MacBook
Ask-first, every time - prior OKs do not carry over. The QA environment
exists precisely so Docker need not run locally.

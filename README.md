# STRABB Web

Next.js frontend for STRABB, a short-term rental booking-aggregation and
automation platform. Pairs with the `strabb-api` backend; OTA distribution
runs through Channex (channel manager).

## Prerequisites

- Node.js 22+
- STRABB API running (http://localhost:8000)

## Setup

```bash
cd strabb-web
npm install
cp .env.example .env.local
```

## Running

```bash
npm run dev
```

App available at http://localhost:3100.

## Demo Account

Login with: `demo@strabb.io` / `demo1234` (after seeding the API database).

## Testing

```bash
npm run test          # Vitest, run once
npm run test:watch    # Vitest, watch mode
npm run test:coverage # Vitest with coverage
npm run e2e           # Playwright end-to-end
npm run e2e:ui        # Playwright UI mode
npx tsc --noEmit      # Type-check (CI gate)
```

## Linting & Formatting

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint autofix
npm run format        # Prettier check
npm run format:fix    # Prettier autofix
```

## Project Structure

```
src/
  app/
    (authenticated)/  - Protected app: bookings, calendar, dashboard,
                        messaging, operations, properties, reporting, settings
    (auth)/           - Forgot/reset password, invite acceptance
    (portal)/         - Cleaner portal
    (public)/         - Privacy, terms
    login/            - Login page
    api/auth/         - Auth.js (NextAuth) route
    api/health/       - Liveness endpoint
  components/
    ui/               - Reusable primitives (Button, DataTable, Dialog, ...)
    shell/            - App shell: sidebar, top nav, submenu, error boundary
    overlays/         - Drawers/dialogs (booking, cleaning, ticket,
                        availability block, share)
    views/            - Calendar / gantt / kanban view primitives
    charts/           - Reporting charts
    listings/         - Listing settings UI
    tickets/          - Ticket UI
    billing/          - Billing banner
    providers/        - App-wide providers (session, query, theme, app-insights)
  hooks/              - React Query + client hooks
  lib/                - auth, api-client, api-hooks, schemas, utils, app-insights
  stores/             - Zustand client state (app-store + slices)
  types/              - Shared TypeScript types
  middleware.ts       - Role-based route guarding (owner/admin vs cleaner)
  test-utils/         - Shared test helpers
```

## Pages

| Area                            | Path                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Dashboard                       | /dashboard                                                                    |
| Calendar                        | /calendar                                                                     |
| Properties                      | /properties                                                                   |
| Bookings                        | /bookings                                                                     |
| Operations (cleaning + tickets) | /operations                                                                   |
| Messaging (inbox + OTA relay)   | /messaging, /messaging/templates, /messaging/scheduled                        |
| Reporting                       | /reporting                                                                    |
| Settings                        | /settings, /settings/listings, /settings/shareable-links, /settings/sync-logs |
| Cleaner portal                  | /portal, /portal/availability, /portal/tasks/[id]                             |
| Auth                            | /login, /forgot-password, /reset-password/[token], /invite/[token]            |

## Deployment

Staging deploys on merge to `main` (GitHub Actions to Azure Container Apps).
Production is a manual, CI-gated, approval-protected workflow
(`.github/workflows/deploy-production.yml`). Build-time config (baked URLs,
App Insights key) is documented in `docs/deploy/build-args.md`.

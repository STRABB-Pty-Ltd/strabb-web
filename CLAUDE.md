# STRABB Web — Claude Code Context

## Project
STRABB frontend — Next.js app for short-term rental booking aggregation and automation.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- Auth.js (next-auth v5) for session management
- TanStack Query for server state
- Tailwind CSS v4 for styling
- Zod for validation
- Vitest + Testing Library for tests

## Architecture
- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — Reusable UI components
- `src/lib/` — Utilities, API client, helpers
- `src/types/` — Shared TypeScript types

## Key Rules
- **Auth flow**: Auth.js stores JWT from backend in session. Every API call includes JWT in Authorization header.
- **Tenant context**: tenant_id is embedded in the JWT — never sent as a separate field.
- **UTC display**: All dates from API are UTC. Convert to property timezone for display using date-fns-tz.
- **Tests alongside features**: every PR includes tests for logic. Don't unit test simple UI — that's what E2E covers.
- **Path alias**: use `@/` for imports from `src/`.

## Commands
- `npm install` — install deps
- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier check
- `npm run test` — run tests
- `npm run test:watch` — tests in watch mode

## Environment
Copy `.env.example` to `.env.local` for local development. Never commit `.env` files.

## Branch Strategy
- `main` branch is protected — no direct pushes
- Feature branches with PR workflow
- All CI gates must pass before merge

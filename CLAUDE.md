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
- **R&D tagging** (Australian R&D Tax Incentive contemporaneous evidence):
  - Prefix commit subject with `[R&D] ` when the change contributes to R&D-eligible work (novel technical experimentation, new integrations, architectural development, performance/correctness research). Example: `[R&D] feat: gantt-style cell ratios`.
  - Apply the GitHub `R&D` label to PRs that contain any `[R&D]`-prefixed commits.
  - Untagged commits/PRs are treated as BAU/non-R&D (routine bug fixes, dep bumps, formatting, copy changes, doc edits).
  - Mixed PRs: prefer splitting into separate commits so the prefix is accurate per commit. Apply the PR label if any commit in the PR is R&D.
  - Do not retroactively tag historical commits.
  - Excluded repos: `strabb-waitlist`.

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

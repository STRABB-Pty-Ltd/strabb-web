# STRABB Web — Claude Code Context

Canonical guidance for AI coding agents working in `strabb-web`. Read
before planning or editing anything. If context is missing, ask before
proceeding.

## Project

STRABB frontend — Next.js app for short-term rental booking
aggregation and automation.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Auth.js (next-auth v5) for session management
- TanStack Query for server state
- Tailwind CSS v4 for styling
- Zod for validation
- Vitest + Testing Library for tests

## Architecture

- `src/app/` — App Router pages and layouts
- `src/components/` — UI and feature components
- `src/hooks/` — React Query and client hooks
- `src/lib/` — auth, API client, schemas, utilities
- `src/types/` — shared TypeScript types
- `src/test-utils/` — shared test helpers

Use existing folder conventions. Do not create parallel patterns
without justification.

## Read First (if relevant)

- `developer-checklist.md` — mandatory development and QA workflow
- `README.md` — setup, commands, structure, page map
- Product specs and phase plans live in the `strabb-internal` repo. Ask
  Will if you need them.

## V1 Scope Guardrails

STRABB v1 prioritises simplicity, automation, reliability, and speed
of iteration. Do not introduce:

- enterprise abstractions or over-engineered config systems
- speculative infrastructure or premature generalisation
- features that don't clearly reduce manual work, mental load, or
  booking friction

Manual fallback is acceptable in v1.

## Mandatory Workflow

- Define the objective in 1–2 sentences before touching code
- Confirm work is in current phase and v1 scope — do not expand scope
  without approval
- Prefer small, targeted changes over broad refactors
- Add or update tests for any logic change in the same PR — never
  deferred
- Review your diff for unrelated edits before finishing
- Do not mark work complete if the repo is in an inconsistent state

## Key Rules

- **Auth flow**: Auth.js stores backend JWT in session. Every API call
  includes the JWT in the `Authorization` header. Do not invent
  alternate auth flows.
- **Tenant context**: `tenant_id` is embedded in the JWT — never send
  it as a separate request field.
- **Dates**: API dates are UTC. Use established date/timezone utilities
  (`date-fns-tz`) to convert for display. Do not hand-roll date
  handling.
- **Imports**: use `@/` path alias for all `src/` imports.
- **Testing**: test meaningful behaviour — hooks, transforms,
  validation, auth/session, data flow. Don't unit-test trivial
  presentational UI; that's what E2E covers.

## Locked Product Decisions

Not up for revision without explicit approval:

- Desktop-first shell
- Top-nav-first structure
- Contextual sidebar behaviour where applicable
- Trusted current-user auth/session model
- This repo pairs with `strabb-api` — frontend work must respect
  backend contracts

## R&D Tagging (Australian R&D Tax Incentive contemporaneous evidence)

- Prefix the commit subject with `[R&D] ` when the change contributes
  to R&D-eligible work (novel technical experimentation, new
  integrations, architectural development, performance/correctness
  research). Example: `[R&D] feat: gantt-style cell ratios`.
- Apply the GitHub `R&D` label to PRs that contain any
  `[R&D]`-prefixed commits.
- Untagged commits/PRs are BAU/non-R&D (routine bug fixes, dep bumps,
  formatting, copy changes, doc edits).
- Mixed PRs: prefer splitting into separate commits so the prefix is
  accurate per commit. Apply the PR label if any commit in the PR is
  R&D.
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

Copy `.env.example` to `.env.local` for local development. Never
commit `.env` files.

## Git and PR Rules

- `main` is protected — branch from latest `main`, never develop on it
- Keep branches focused and short-lived
- All CI and QA gates must pass before merge
- Every PR states: objective, scope/phase alignment, files changed,
  tests added/updated with counts, manual QA, risks
- Will pushes feature branches — Chris owns the PR and merge process

## Implementation Standards

- Follow existing naming conventions and component patterns
- Avoid unrelated cleanup or broad renames in feature PRs
- Keep type safety intact
- New utilities/hooks must solve a repeated problem, live in the
  established location, and have a small obvious API
- Do not hardcode secrets, credentials, or environment-specific values

## What Not To Do

- Change architecture without explanation
- Add dependencies without justification
- Bypass existing utilities or conventions
- Claim completion without validating lint, tests, and build
- Silently ignore failures — leave a note if uncertain

## Dev gotchas

- **Stale `.next/` after rapid edits.** When the `next dev` server
  runs through several quick file edits (especially across
  `npm uninstall`/`install`, large refactors, or many sequential edits
  to imported modules), the in-memory webpack module map can desync
  from disk. The HTML keeps referencing CSS hashes (e.g.
  `/_next/static/css/app/layout.css?v=...`) that 404, so the page
  renders unstyled (raw HTML). Stop the dev server, `rm -rf .next`,
  restart. Should not be necessary on a single edit, only after a
  burst.

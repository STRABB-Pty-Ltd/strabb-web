# strabb-web - CLAUDE.md (team instructions, committed, auto-loaded each session)

Keep this stable. Modular detail lives in `.claude/rules/`. The living
lessons ledger is `.claude/rules/gotchas.md` - review it before planning,
update it after any correction. Personal overrides go in `CLAUDE.local.md`
and `.claude/settings.local.json` (both gitignored).

## Project

STRABB frontend - Next.js app for short-term rental booking aggregation
and automation. Pairs with `strabb-api`: frontend work must respect
backend contracts.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- Auth.js (next-auth v5) for session management
- TanStack Query for server state, Zustand for client state, Tailwind CSS v4, Zod
- Recharts for reporting charts; App Insights browser SDK for client telemetry
- Vitest + Testing Library for unit tests, Playwright for e2e

## Architecture

- `src/app/` - App Router pages and layouts (route groups: (authenticated),
  (auth), (portal), (public))
- `src/components/` - UI and feature components (ui, shell, overlays, views,
  charts, ...)
- `src/hooks/` - React Query and client hooks
- `src/lib/` - auth, API client, schemas, utilities
- `src/stores/` - Zustand client state (app-store + slices)
- `src/types/` - shared TypeScript types
- `src/middleware.ts` - role-based route guarding (owner/admin vs cleaner)
- `src/test-utils/` - shared test helpers

Use existing folder conventions. Do not create parallel patterns without
justification.

## Workflow orchestration

### 1. Plan first

- Define the objective in 1-2 sentences before touching code. Any
  multi-step or ambiguous task gets a plan before implementation.
- Confirm the work fits the current phase and v1 scope - do not expand
  scope without approval.
- If something goes sideways mid-task, stop and re-plan rather than
  pushing through.

### 2. Delegate to keep the main context clean (load-bearing)

- The main thread is for orchestration, judgement, and diff review - not
  raw file bodies. Never pull whole or large files into the main context.
- Offload heavy reading (multi-file surveys, "where is X", audits,
  research) to subagents that return conclusions only, one focused task
  per subagent. Fan out parallel read-only subagents for independent
  questions.
- Locate with `rg`/`grep`, size with `git diff --stat`/`wc -l`, read only
  the slice you need. Throw more compute at hard problems via subagents,
  not more context at the main thread.
- Delegate safely: COMMIT your own work before spawning any background or
  parallel agent; give write-agents worktree isolation OR forbid git ops
  in their prompt; fan parallel build-agents over disjoint files only.

### 3. Verify before done - in the real medium, with a false-pass guard

- A green tsc, lint, curl, or 200 is NOT verification. For UI work:
  screenshot the affected pages (headless Chrome) and LOOK at the PNGs -
  layout, tokens, empty and loading states. For data flow: exercise the
  real request path (browser -> `/be` proxy -> API), not a direct-to-API
  smoke that skips the proxy hop.
- Guard against false passes: an empty page, an unstyled render, or a
  trivially-short response must not count as success.
- Tests for any logic change land in the same PR - never deferred. Suite
  stays green; every bug fix gets a regression test.
- Bar: would a staff engineer sign this off?

### 4. Self-improvement loop

- After any correction, surprise, or dead end: add the trap to
  `.claude/rules/gotchas.md` as one mechanical, specific bullet.
- Review gotchas at session start; prune entries that stop being true.

### 5. Demand elegance (balanced)

- On non-trivial changes, pause: is there a simpler way? If a fix feels
  hacky, redo it right.
- Skip this for simple, obvious fixes - no over-engineering. V1
  prioritises simplicity, automation, reliability, and speed of
  iteration; manual fallback is acceptable. No enterprise abstractions,
  speculative infrastructure, or features that don't clearly reduce
  manual work, mental load, or booking friction.

### 6. Autonomous bug fixing

- Given a bug report or failing CI: reproduce, find the root cause, fix
  it, add the regression test. No hand-holding, no workaround that
  disables a safeguard, no temporary fix left behind.

## Core principles

- Simplicity first: the smallest change that solves the problem; minimal
  blast radius.
- No laziness: root causes, not band-aids; senior-engineer standard.
- Minimal impact: no unrelated edits, broad renames, or drive-by
  refactors; review your diff for stray changes before finishing. Do not
  mark work complete with the repo in an inconsistent state.

## Key rules (non-negotiable)

- **Auth flow:** Auth.js stores the backend JWT in the session; every API
  call sends it in the `Authorization` header. Do not invent alternate
  auth flows.
- **Tenant context:** `tenant_id` is embedded in the JWT - never send it
  as a separate request field.
- **Dates:** API dates are UTC; convert for display with `date-fns-tz`.
  Do not hand-roll date handling.
- **Imports:** use the `@/` path alias for all `src/` imports.
- **Testing:** test meaningful behaviour - hooks, transforms, validation,
  auth/session, data flow. Don't unit-test trivial presentational UI.
- **Type safety stays intact.** New utilities/hooks must solve a repeated
  problem, live in the established location, and have a small obvious
  API. No new dependencies without justification.

## Locked product decisions (not up for revision without approval)

- Desktop-first shell, top-nav-first, at lg+ (1024px). Below lg: bottom
  tab bar (Instagram-style, the 5 main pages) + a minimal top bar
  (wordmark, page title, Settings) - decision 10-07-2026, Chris/Will/
  Chanel. The cutover is lg (1024px), not the more usual md (768px):
  the desktop TopNav's pill group is absolutely-positioned outside the
  flex flow and collides with the flow-positioned Settings/Sign-out
  cluster below ~1024px, confirmed empirically (M.1 follow-up,
  10-07-2026) - not a redesign candidate for a v1 fix, so the shell
  cutover moved instead. Sidebar filters/actions and submenu chips have
  no mobile home yet (hamburger-drawer phase, not yet built) - hidden
  below lg until then, not silently broken.
- Contextual sidebar behaviour where applicable
- Trusted current-user auth/session model

## Deployment infrastructure - do not touch without Chris's sign-off

- Anything under `.github/` (including `ci.yml` and `deploy-production.yml`)
- `Dockerfile`, `.dockerignore`, `next.config.ts` build/deploy seams

## Commands

- `npm install` - install deps
- `npm run dev` - dev server (port 3100)
- `npm run build` - production build
- `npm run lint` / `npm run format` - ESLint / Prettier check
- `npm run test` / `npm run test:coverage` - unit tests; `npm run e2e` - Playwright
- `npx tsc --noEmit` - type-check (CI gate)

## Environment

Secrets are `op://` 1Password references resolved via `op run` - no
`.env` file is used in the QA environment (qa.strabb.io). For local
development only, copy `.env.example` to `.env.local`. Never commit
`.env` files. Never print, log, persist, or bake a secret into an image;
flag any exposed credential for rotation immediately.

## Git, PRs, authority

- `main` is protected - branch from latest `origin/main`, never develop
  on it. Keep branches focused and short-lived.
- **Will pushes feature branches; Chris owns PR merges and deploys.** A
  Claude session NEVER merges (`gh pr merge` is denied in settings) and
  NEVER deploys - it prepares, opens the PR, and stops.
- Every PR states: objective, scope/phase alignment, files changed, tests
  added/updated with counts, manual QA evidence, risks.
- R&D commit tagging is mandatory where eligible: `.claude/rules/rd-tagging.md`.

## Style

- Match existing naming and component patterns; bypass no existing
  utility or convention.
- No em dashes anywhere, including generated copy, comments, and UI text
  (use hyphen, comma, or colon). DD-MM-YYYY dates in prose and filenames.
- Silently ignoring a failure is never acceptable - leave a note if
  uncertain.

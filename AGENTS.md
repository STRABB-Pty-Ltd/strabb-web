# AGENTS.md

## Purpose

Canonical instructions for AI coding agents working in the STRABB Web repository.
Read this before planning or editing anything.

---

## Read First

1. Product docs (specs, phase plans, ui-spec) are in the `strabb-internal` repo, not in this repo. If you need spec context, ask Will for the relevant file.
2. `developer-checklist.md` — mandatory development and QA workflow
3. `README.md` — setup, commands, structure, page map

If context is missing, ask before proceeding.

---

## Mandatory Workflow

Follow the developer checklist for all work.

- Define the objective in 1–2 sentences before touching code
- Confirm work is in current phase and v1 scope — do not expand scope without approval
- Prefer small, targeted changes over broad refactors
- Add or update tests for any logic change
- Review your diff for unrelated edits before finishing
- Do not mark work complete if the repo is in an inconsistent state

---

## V1 Scope Guardrails

STRABB v1 prioritises simplicity, automation, reliability, and speed of iteration.

Do not introduce:

- enterprise abstractions or over-engineered config systems
- speculative infrastructure or premature generalization
- features that don't clearly reduce manual work, mental load, or booking friction

Manual fallback is acceptable in v1.

---

## Core Technical Rules

**Auth:** Auth.js stores backend JWT in session. All authenticated requests include JWT in `Authorization` header. Do not invent alternate auth flows.

**Tenant context:** `tenant_id` is in the JWT. Never send it as a separate request field.

**Dates:** API dates are UTC. Use established date/timezone utilities to convert for display. Do not hand-roll date handling.

**Imports:** Use `@/` path alias for all `src/` imports.

**Testing:** Test meaningful behaviour — hooks, transforms, validation, auth/session, data flow. Don't unit test trivial presentational UI.

---

## Architecture

See `README.md` for full structure. Key folders:

- `src/app/` — App Router pages and layouts
- `src/components/` — UI and feature components
- `src/hooks/` — React Query and client hooks
- `src/lib/` — auth, API client, schemas, utilities
- `src/types/` — shared TypeScript types
- `src/test-utils/` — shared test helpers

Use existing folder conventions. Do not create parallel patterns without justification.

---

## Implementation Standards

- Follow existing naming conventions and component patterns
- Avoid unrelated cleanup or broad renames in feature PRs
- Keep type safety intact
- New utilities/hooks must solve a repeated problem, live in the established location, and have a small obvious API

---

## Locked Product Decisions

These are not up for revision:

- Desktop-first shell
- Top-nav-first structure
- Contextual sidebar behaviour where applicable
- Trusted current-user auth/session model
- This repo pairs with `strabb-api` — frontend work must respect backend contracts

Do not drift from these without explicit approval.

---

## Git and PR Rules

- `main` is protected — branch from latest `main`, never develop on it
- Keep branches focused and short-lived
- All CI and QA gates must pass before merge
- Every PR states: objective, scope/phase alignment, files changed, tests added, manual QA, risks
- Will pushes feature branches — Chris owns the PR and merge process

---

## What Not To Do

- Change architecture without explanation
- Add dependencies without justification
- Bypass existing utilities or conventions
- Claim completion without validating lint, tests, and build
- Silently ignore failures — leave a note if uncertain

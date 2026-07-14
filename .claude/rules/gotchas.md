# Gotchas - living lessons ledger (strabb-web)

Mechanical, codebase-specific traps. Review before planning; add a bullet
after any correction, surprise, or dead end; prune entries that stop
being true. One bullet per trap, specific enough to act on.

## Build / deploy

- `INTERNAL_API_URL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_API_URL` are baked
  at BUILD time: `next.config.ts` is evaluated during `next build` for
  standalone output, so the `/be` rewrite destination lives in the image.
  Setting them only at runtime falls back to `http://localhost:8000` and
  every `/be/*` call dies with ECONNREFUSED. Any env change to these
  needs a rebuild, not a restart.
- Next.js caps PROXIED request bodies (default ~10 MB via
  `experimental.middlewareClientMaxBodySize`): a larger upload through
  the `/be` rewrite truncates and 500s (socket hang up) in dev AND the
  standalone prod server. For any upload feature, raise the cap in
  `next.config.ts` AND test through the real browser -> `/be` -> API
  path - a direct-to-API curl skips the hop and hides the cap.

## Dev server

- After the machine sleeps/wakes overnight, `strabb-api`'s login hangs
  forever (no error, no timeout - `POST /auth/login` just never
  resolves) even though `GET /health` returns fine: Docker Desktop comes
  back from sleep "manually paused", so `strabb-api-db-1` (Postgres) is
  frozen, not just slow. `docker ps` alone is enough to detect and clear
  it - once it prints, Postgres is responsive again (no explicit
  `docker desktop start/resume` needed, that subcommand doesn't exist
  anyway). If login/signing-in spins forever at session start, run
  `docker ps` before suspecting the frontend or the auth code.
- Stale `.next/` after rapid edit bursts (uninstall/install cycles, large
  refactors, many sequential edits to imported modules): the in-memory
  module map desyncs from disk and the page renders unstyled because a
  hashed CSS URL 404s. Stop the dev server, `rm -rf .next`, restart.
  Single edits should never need this.
- NEVER run `npm run build` while the dev server is running: both write
  to the same `.next/`, so the build clobbers the dev server's hashed
  CSS/chunk files out from under it and every page renders unstyled
  (13-07-2026, bit during Phase I.2 verification). Stop the dev server
  first, or build after the session's browser QA is done.

## Working copies (Will's machine)

- Canonical clones live on the USB stick
  `/Volumes/WILLS-STICK/STRABB-REPOS/`. They are SHARED and mutable by
  another actor mid-session: commit + push each layer early (commits
  survive a branch switch); if your edits seem to vanish, check
  `git branch --show-current` + `git status` before assuming a bug, and
  do not switch the repo back (your pushed branch is safe on origin).
  To run your branch without disturbing the checkout, use
  `git worktree add`.
- Stick clones can lag origin - `git fetch` first; read code from
  `origin/main`, not the working tree, when auditing.

## Data / team

- `src/lib/mock-team.ts` is still live - team pages render mock data, not
  API data. Do not build on it as if it were real; the provisioning work
  replaces it.

## Formatting (Windows checkouts)

- On a Windows checkout with `core.autocrlf=true`, `prettier --check .`
  false-positives on nearly every file (line endings, not content) - CI
  runs on Linux and never sees this. If `prettier --check` on the whole
  repo flags hundreds of files, that is the CRLF artifact, not real
  formatting debt; do not use "main already fails this too" as proof a
  flagged file in your diff is clean. To find the real difference, run
  `prettier --write <file>` then `git diff` (git normalizes line endings,
  so only genuine content changes show) - that is what CI's gate actually
  sees. Do this before calling formatting verified, not after CI fails.

## Overlays / dialogs (added 08-07-2026, Phase E)

- Anything portalled to document.body that is opened FROM inside a
  DrillDownPanel must (a) sit above Z.DRAWER=150 (the Dialog primitive
  now uses z-180/z-185, see src/lib/z-index.ts) and (b) be excluded from
  useClickOutside's outside test (dialog-slot portals are). Before those
  two fixes every ConfirmDialog inside a drawer was unclickable or had
  its confirm silently swallowed - and passed jsdom tests, because jsdom
  does no hit-testing. Screenshot-verify any new drawer+overlay combo.
- Browser-testing against QA: mutations that touch email (booking
  create) take ~37s (SendGrid 401 retries in-request) and the /be proxy
  resets at ~30s, so the UI shows failure while the api write lands.
  Poll the api for the landed row instead of waiting on the toast.

## Styling / tailwind-merge (added 13-07-2026, Phase I.3)

- Any custom utility whose name collides with a twMerge class group must
  be registered in `cn()` (src/lib/utils.ts, extendTailwindMerge) before
  a cva primitive relies on it. Stock twMerge classified `text-body` as
  a text COLOUR, so every variant colour class silently stripped the
  font size and Chips/Buttons rendered at the browser's 16px - passing
  tsc, tests, and casual review. The type ladder (text-body/subheading/
  heading/display) is registered now; if you add a new ladder step or a
  custom `font-*`/`shadow-*`-shaped utility, extend the config in the
  same commit and verify with a computed-style measurement, not eyes.

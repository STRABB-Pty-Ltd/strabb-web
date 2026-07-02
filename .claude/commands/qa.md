---
description: Deploy the current branch to iMeg QA and verify it comes up healthy
---

Deploy the current branch to the QA environment (qa.strabb.io) and verify
it, instead of any local Docker loop.

1. Confirm the working tree is committed and the branch is pushed to
   origin (`git status`, `git log origin/<branch>..<branch>` empty). If
   not, stop and say what is unpushed - do not deploy stale code.
2. Run `/Users/willflynn/scripts/strabb/strabb-qa deploy <branch>` (the
   script re-points the QA apps whose repo has that branch; others stay
   on main).
3. Run `/Users/willflynn/scripts/strabb/strabb-qa watch` and wait for it
   to finish. It health-checks api `/health` JSON and web markup with
   false-pass guards - report its actual output, not just the exit code.
4. If a service fails, pull its logs with
   `/Users/willflynn/scripts/strabb/strabb-qa logs api|worker|web` and
   diagnose before retrying.
5. Remind at the end: `strabb-qa reset` returns QA to main when testing
   is done.

If the script is missing (not Will's machine), say so and point at the
Coolify dashboard over Tailscale instead - do not attempt to recreate the
script or fetch the API token.

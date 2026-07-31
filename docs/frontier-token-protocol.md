# Frontier Survival — Reduced Frontier-Token Protocol

Status: active and permanent
Owner: Hermes default profile (orchestrator + sole code judge)

## Purpose

Use local/LAN OpenCode workers for implementation and reserve the frontier model for compact orchestration, independent judgment, recovery, browser validation, and release gates. Do not spend frontier context reproducing work that workers or mechanical checks can do.

## Routing

- `qwen27s`, `qwen35`, and `local35` are implementation workers.
- Keep the documented depth caps: qwen27s <=4, qwen35 <=2, local35 <=1, global <=7.
- Do not create work merely to fill a slot; hot-file ownership and correctness win.
- Frontier is not a bulk implementation worker.

## Frontier judge cadence

- Use the durable 45-minute Kanban judge loop, not a frontier turn per worker.
- Run an immediate extra judge only for a P0/runtime regression, worker crash loop, release plateau, or blocked dependency.
- One judge pass produces one compact decision: `continue`, `redirect`, `recover`, `block`, or `ship`.

## Compact judge envelope

Before a judge pass, provide only:

1. `hermes kanban stats` and running/scheduled/blocked counts.
2. Running card IDs, assignees, lock paths, and latest short summaries.
3. `git status --short`, `git diff --stat`, and `git diff --check`.
4. Exact smoke-test result summary.
5. Browser/live result: boot status, console error count, and only new P0/P1 findings.
6. The last handoff/decision and the next non-overlapping cards.

Do not reread the entire repository, backlog, worker transcripts, or unchanged source during every tick. Read a targeted file or diff only when the compact envelope indicates a decision requires it.

## Mechanical-first verification

- Run `node tests/smoke.mjs` before reasoning about feature correctness.
- Use targeted `git diff`/`git diff --stat`; never trust a worker summary without inspecting the artifact.
- Browser-check only at a release plateau, after UI/runtime changes, or when a regression is suspected.
- Batch independent checks in one tool call.
- Keep worker prompts bounded to one feature/file ownership slice.

## Recovery and release gates

- Reclaim heartbeat-only or no-diff workers only after **≥12 minutes** with no artifact (or crash loop). Be patient; do not thrash reclaim at 1–3m.
- Card bodies must be **small pure/docs/single-file slices** so local workers finish without frontier takeover.
- See `docs/worker-24-7-ops.md` for permanent 24/7 lane fill + watchdog.
- Reassign or block deterministic startup failures after diagnosis.
- At a green plateau, independently verify smoke, diff, browser/live artifact, dual HTML sync, and all module cache-bust versions before commit/push.
- Workers never commit or push unless a card explicitly says so; Hermes publishes only after the gate is green.

## Durable prompt rule

Every unattended judge prompt must repeat this protocol because cron runs in a fresh session. It must specify the authoritative repo, board, worker-only implementation rule, compact envelope, lock/depth rules, exact smoke command, and the fact that the judge must not mint overlapping work.

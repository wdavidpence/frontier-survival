# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.6**
- Published commit/tag: `59b4c80` / `v1.27.6`
- Release: Shared crew White Bay—Local Co-op treats the overnight camp as a crew rendezvous. When both survivors arrive, HUD and survey notify the shared crew.
- Live proof: GitHub Pages v1.27.6 exposes `main.js?v=872` and `game.js?v=848`; Local Co-op fresh start reached `started=true` with a hidden title, split HUD, P2 present, Tidewatch wreck ownership, and zero page-owned errors.

## Verified v1.27.6 evidence

- Full `node tests/smoke.mjs` passed: 472 `PASS` assertions plus 6 TAP subtests, including co-op crew rendezvous contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 175 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8789` and live Pages Local Co-op starts reached `started=true` with P2 present and zero page-owned errors.
- Controlled crew probe: both players at White Bay showed `Shared crew · both at White Bay` and surveyed together.
- Visual proof accepted for release health: ordinary local/live co-op frames had readable split terrain, water, HUD, and no black/gray renderer artifact.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.

## Next bounded product slice

Use a clean worktree from `origin/main` for a long-session streaming/performance confidence pass. Keep every next slice tied to ordinary fresh-world screenshots.

# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.4**
- Published commit/tag: `b264a8a` / `v1.27.4`
- Release: Landing Berth—choosing the Landing plan opens a working skiff return berth. Moor and launch the dinghy at the pier without the beach-push ritual.
- Live proof: GitHub Pages v1.27.4 exposes `main.js?v=870` and `game.js?v=846`; fresh New World reached `started=true` with a hidden title, rendered HUD/world, Tidewatch wreck ownership, and zero page-owned errors.

## Verified v1.27.4 evidence

- Full `node tests/smoke.mjs` passed: 468 `PASS` assertions plus 6 TAP subtests, including landing-berth state and integration contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 172 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8787` and live Pages fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Controlled Landing probe opened a slip, moored the live skiff (`beached=true`), then launched it (`beached=false`); captureState persisted `landingBerth`.
- Visual proof accepted for release health: ordinary local and live frames had readable terrain, water, sky, HUD, and no black/gray renderer artifact.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.

## Next bounded product slice

Use a clean worktree from `origin/main` and add a third named coastal destination (White Bay overnight return), or a long-session streaming/performance confidence pass. Keep every next slice tied to ordinary fresh-world screenshots.

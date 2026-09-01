# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.3**
- Published commit/tag: `d0e5c8a` / `v1.27.3`
- Release: Seaglass Cay—choosing the Lookout plan charts a second named offshore destination. Survey the cay beacon, then claim the chart at the Harbor Signal.
- Live proof: GitHub Pages v1.27.3 exposes `main.js?v=869` and `game.js?v=845`; fresh New World reached `started=true` with a hidden title, rendered HUD/world, Tidewatch wreck ownership, and zero page-owned errors.

## Verified v1.27.3 evidence

- Full `node tests/smoke.mjs` passed: 466 `PASS` assertions plus 6 TAP subtests, including lookout-route state and integration contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 171 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8786` and live Pages fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Controlled Lookout probe charted Seaglass Cay, built cay-beacon/glass/pennant meshes, surveyed, then claimed; captureState persisted `lookoutRoute`.
- Visual proof accepted for release health: ordinary local and live frames had readable terrain, water, sky, HUD, and no black/gray renderer artifact.

## Verified v1.27.2 evidence

- Harbor Choice Lookout/Landing plans remain the gate that charts Seaglass Cay.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.
- Do not mass-dispatch the stale Kanban backlog.

## Next bounded product slice

Use a clean worktree from `origin/main` and make the **Landing plan** unlock a working skiff return berth, rather than only a visual pier. Keep every next slice tied to ordinary fresh-world screenshots.

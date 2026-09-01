# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.5**
- Published commit/tag: `e0ab0c9` / `v1.27.5`
- Release: White Bay overnight return—claiming Tidewatch charts the authored western sand landing. Survey the lean-to camp, then claim the coastal chart at the Harbor Signal.
- Live proof: GitHub Pages v1.27.5 exposes `main.js?v=871` and `game.js?v=847`; fresh New World reached `started=true` with a hidden title, rendered HUD/world, Tidewatch wreck ownership, and zero page-owned errors.

## Verified v1.27.5 evidence

- Full `node tests/smoke.mjs` passed: 470 `PASS` assertions plus 6 TAP subtests, including white-bay route contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 174 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8788` and live Pages fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Controlled White Bay probe charted `(-42, 16, 9)`, built lean-to/bedroll/lantern meshes, surveyed, then claimed; captureState persisted `whiteBayRoute`.
- Visual proof accepted for release health: ordinary local and live frames had readable terrain, water, sky, HUD, and no black/gray renderer artifact.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.

## Next bounded product slice

Use a clean worktree from `origin/main` for a long-session streaming/performance confidence pass, or a finished co-op shared-route proof. Keep every next slice tied to ordinary fresh-world screenshots.

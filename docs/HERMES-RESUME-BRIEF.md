# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.2**
- Published commit/tag: `02d8990` / `v1.27.2`
- Release: Tidewatch Harbor Choice—after claiming the Tidewatch return reward, F / Circle at the Harbor Signal cycles a persistent Lookout or Landing plan that rebuilds the landmark.
- Live proof: GitHub Pages v1.27.2 exposes `main.js?v=868` and `game.js?v=844`; fresh New World reached `started=true` with a hidden title, rendered HUD/world, Tidewatch onboarding, wreck runtime ownership, and zero page-owned errors.

## Verified v1.27.2 evidence

- Full `node tests/smoke.mjs` passed: 464 `PASS` assertions plus 6 TAP subtests, including harbor-choice state and integration contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 169 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8785` and live Pages fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Controlled claimed-reward runtime proof cycled Lookout (spyglass/table) then Landing (pier/mooring), HUD `Harbor Signal`, 2 lanterns, 2 pennants, and persisted `harborChoice` in captureState.
- Visual proof accepted for release health: ordinary local and live frames had readable terrain, water, sky, HUD, and no black/gray renderer artifact. A diagnostic close-up of the rebuilt harbor was not isolated at useful scale and is not claimed as visual acceptance of the pier/spyglass.

## Verified v1.27.1 evidence

- Full `node tests/smoke.mjs` passed: 462 `PASS` assertions plus 6 TAP subtests.
- Harbor Signal reward-to-building integration shipped and remains the claimed-reward gate for v1.27.2.

## Verified v1.27.0 evidence

- Full `node tests/smoke.mjs` passed: 461 `PASS` lines plus 6 TAP subtests.
- Tidewatch Expedition first-voyage slice remains the authored expedition baseline.

## Preserved salvage candidates

- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-animal-detail-20260828` — dirty v1.26.6 animal-detail candidate; smoke/syntax pass, visual encounter proof still needed.
- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-cane-garden-20260828` — source of the accepted Cane Garden Bay delta; preserve as provenance.
- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-next-pass-20260828` — dirty route-HUD candidate; smoke/syntax/browser pass, not yet integrated.
- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-shelter-20260827` — dirty shelter/workbench provenance; its reviewed slice shipped in v1.26.5.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.
- Historical integrated-clean worktrees and their local branches were removed; dirty and divergent worktrees were preserved.
- Do not mass-dispatch the stale Kanban backlog.

## Next bounded product slice

Use a clean worktree from `origin/main` and make the Lookout plan unlock a second named offshore route with a visible destination and return, rather than another landmark-only prop. Keep every next slice tied to ordinary fresh-world screenshots; do not count helper modules or block totals alone as visual acceptance.

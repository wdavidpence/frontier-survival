# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.0**
- Published commit/tag: `d7db5e5` / `v1.27.0`
- Release: Tidewatch Expedition—an authored wreck/lantern/gull landmark connected to a persistent Discovery Log, clear first-voyage cue, shared co-op messaging, original discovery stinger, and the existing expedition reward loop.
- Live proof: GitHub Pages v1.27.0 exposes `main.js?v=864`; fresh New World reached `started=true` with a hidden title, rendered HUD/world, a visible Tidewatch lead, wreck/gull runtime ownership, and zero page-owned errors.

## Verified v1.27.0 evidence

- Full `node tests/smoke.mjs` passed: 461 `PASS` lines plus 6 TAP subtests.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 167 executable relative-import edges audited; zero missing cache-busts.
- Local Solo and Local Co-op fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Mobile 390×844 title panel remained scrollable with primary controls in the viewport.
- Live Pages HTML exposed v1.27.0 / `main.js?v=864`; live fresh start rendered terrain, water, HUD, and the first-voyage Discovery Log without page-owned errors.
- Visual proof accepted: ordinary local/live frames and a controlled Tidewatch frame were readable, with no black/gray occlusion; the co-op controller reminder was corrected to a compact top-center cue instead of blocking P2’s view.

## Preserved salvage candidates

- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-animal-detail-20260828` — dirty v1.26.6 animal-detail candidate; smoke/syntax pass, visual encounter proof still needed.
- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-cane-garden-20260828` — source of the accepted Cane Garden Bay delta; preserve as provenance.
- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-next-pass-20260828` — dirty route-HUD candidate; smoke/syntax/browser pass, not yet integrated.
- `/mnt/c/Users/wdavi/Projects/Frontier-Survival-shelter-20260827` — dirty shelter/workbench provenance; its reviewed slice shipped in v1.26.5.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.
- Historical integrated-clean worktrees and their local branches were removed; dirty and divergent worktrees were preserved.
- Old preview servers were stopped. Do not mass-dispatch the stale Kanban backlog.

## Next bounded product slice

Use a clean worktree from `origin/main` and choose one player-visible goal: deepen the Tidewatch route into a true offshore return expedition, or make the expedition reward unlock a richer harbor-building expression. Keep every next slice tied to ordinary fresh-world screenshots; do not count helper modules or block totals alone as visual acceptance.

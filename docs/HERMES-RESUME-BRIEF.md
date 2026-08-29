# Hermes Resume Brief — Frontier Survival

Updated: 2026-08-29

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.26.7**
- Published commit/tag: `b39e5c5` / `v1.26.7`
- Release: expanded authored Tortola/island bodies while preserving the Cane Garden Bay start, palms, coconuts, vines, channels, and worker parity
- Live proof: fresh New World starts at `Cane Garden Bay · Tortola` on sand with zero page-owned errors; loaded runtime contained palms, coconuts, vines, and bamboo near the start

## Verified v1.26.7 evidence

- Full `node tests/smoke.mjs` passed.
- All JavaScript syntax checks passed.
- Root/public HTML parity passed.
- 156 executable relative-import edges audited; zero missing cache-busts.
- Local and live fresh-start browser probes reached `started=true` with hidden title and rendered HUD/world.
- Local connected-land probe: largest loaded body 173×49 cells / 4,804 surface cells; second body 93×44 / 3,012 cells.
- Live proximity probe within 80 world units: 171 palm blocks, 16 coconuts, 23 vines, 159 bamboo blocks.

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

Use a clean worktree from `origin/main` and choose one player-visible goal: integrate the route-HUD candidate, or isolate and browser-prove the animal-detail candidate. Keep plant/landmass work tied to ordinary fresh-world screenshots; do not count block totals alone as visual acceptance.

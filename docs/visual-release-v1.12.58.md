# Frontier Survival v1.12.58 — Spawn Camp Navigation Checkpoint

## Player-visible slice
- The existing spawn marker now communicates `CAMP · HERE` when the player is at camp, or `CAMP · <distance>m · <compass sector>` while returning to camp.
- The desktop marker is moved outside the left survival card so the cue is visible instead of being occluded by the status panel. Compact/mobile layouts retain the prior edge placement.
- The existing rotated marker icon, biome notifications, HUD, and co-op paths are otherwise unchanged.

## Evidence
- Base: origin/main `7a4f381` / v1.12.57.
- Exact candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-sprint-20260815-r4-luna-navigation`.
- Static candidate gates: `node --check js/game.js`, 390 smoke PASS, `git diff --check`, and root/public parity PASS.
- Ordinary fixed-seed runtime: seed `123456789`, `started=true`, title hidden, zero page errors.
- Candidate visual frame: gold camp marker and `CAMP · HERE` are visibly readable outside the survival card; terrain, sky, HUD, and hotbar remain intact.

## Release gate
This is a checkpoint toward the larger AAA visual goal, not a parity claim. The clean synthesis must pass the complete syntax/smoke/parity/import-cache/local runtime/live Pages verification before publication.

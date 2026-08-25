# Frontier Survival v1.24.0 — Visual Streak 03

## Scope

Visual-only release checkpoint. No new creatures, plants, items, recipes, or gameplay products.

- Used an Antigrav implementation lane for the bounded presentation slice.
- Reduced salvage locker foreground geometry while preserving salvage hit testing, storage, save/load, and recovered contents.
- Lowered the castaway boat hull/seat silhouette while preserving boat physics and mounting.
- Diagnosed the actual remaining obstruction as authored starter-beach driftwood at `(23,14)`.
- Added deterministic `starterCoveSightlinePocket` clearance in synchronous and worker generation paths.
- Preserved driftwood outside the arrival sightline and kept the rest of the cove ecology intact.
- Added focused smoke assertions for the sightline pocket and sync/worker parity.

## Verification

- Antigrav worker syntax and smoke checks passed.
- Final local syntax checks passed for `gen.js`, `world.js`, `chunk-worker.js`, `animals.js`, `biomes.js`, `game.js`, `main.js`, and `tests/smoke.mjs`.
- `node tests/smoke.mjs`: 439 assertions passed.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.
- Executable relative import audit: 137 edges, 0 missing cache-busts.
- Fresh local desktop Start: started, title hidden, zero page errors, `(23,18,14)` cleared.
- Fresh local portrait Start: started, no document overflow, zero page errors.

## Honest remaining gap

The cove still uses stylized voxel terrain and a strong left shoreline wall. The next visual streak can soften that shoreline composition, but this release removes the direct authored foreground obstruction from the fresh route.

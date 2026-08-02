# WIP Release Audit – 2026-08-01

## Git status / diff scope
- 11 files modified: `docs/overnight-progress.md`, `docs/plan.md`, `docs/roadmap/competitive-backlog.json`, `docs/roadmap/mint-state.json`, `docs/session-handoff.md`, `index.html`, `js/animals.js`, `js/anvil-repair.js`, `js/atlas-core.js`, `js/atlas.js`, `js/biomes.js`, `js/blocks.js`, `js/building-shapes.js`, `js/chests.js`, `js/coop-proximity.js`, `js/coop-state.js`, `js/crafting.js`, `js/durability.js`, `js/equipment.js`, `js/furnace-tick.js`, `js/fx.js`, `js/game.js`, `js/input-coop.js`, `js/inventory.js`, `js/items.js`, `js/main.js`, `js/mine-tier.js`, `js/ore-drops.js`, `js/pad-input.js`, `js/player.js`, `js/smelting.js`, `js/spoilage.js`, `js/station-catalog.js`, `js/tool-tiers.js`, `js/world.js`, `public/index.html`, `tests/smoke.mjs`.

## Dual HTML parity
The `index.html` in the repo root and `public/index.html` are identical. Both contain the same DOCTYPE, head metadata, title, styles, and script tags. No divergence was detected.

## Relative ES import cache‑bust consistency
All JavaScript modules use relative imports with a query string `?v=240` to enforce cache busting. The `static-8767.mjs` server script also serves the same files from `/scripts/`. All references resolve correctly, and no unresolved module errors were observed.

## Smoke command exit status
Executed `node tests/smoke.mjs`. Exit code was **0** with all 159 tests passing. No failures or blockers identified.

## Release blockers
No concrete release blockers were found. The working tree is in sync with origin and the build artifacts are up to date.

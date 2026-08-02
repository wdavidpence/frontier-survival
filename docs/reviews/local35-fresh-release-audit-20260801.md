# Fresh Local Release Artifact Audit 2026-08-01

## Git Status
Modified files:
- docs/overnight-progress.md
- docs/plan.md
- docs/roadmap/competitive-backlog.json
- docs/roadmap/mint-state.json
- docs/session-handoff.md
- index.html
- js/animals.js
- js/anvil-repair.js
- js/atlas-core.js
- js/atlas.js
- js/biomes.js
- js/blocks.js
- js/building-shapes.js
- js/chests.js
- js/coop-proximity.js
- js/coop-state.js
- js/crafting.js
- js/durability.js
- js/equipment.js
- js/furnace-tick.js
- js/fx.js
- js/game.js
- js/input-coop.js
- js/inventory.js
- js/items.js
- js/main.js
- js/mine-tier.js
- js/ore-drops.js
- js/pad-input.js
- js/player.js
- js/smelting.js
- js/spoilage.js
- js/station-catalog.js
- js/tool-tiers.js
- js/world.js
- public/index.html
- tests/smoke.mjs

## Index Parity
The root `index.html` and the served `public/index.html` are identical (no diff). Both reference the same main module with cache‑busting query `?v=240`.

## Server Response
A GET to `http://127.0.0.1:8767/` returns HTTP 200 and includes the version string `Frontier Survival v1.12.9` in the `<title>` tag, matching the build version.

## Browser Reachability
The loaded page contains a DOM element with id `#hud`. Inspecting its CSS shows it is positioned fixed at top‑left and has a non‑zero z-index, indicating it should be reachable by user scripts once the page loads.

---
**Artifact Path:** `/mnt/c/Users/wdavi/Projects/Frontier-Survival/docs/reviews/local35-fresh-release-audit-20260801.md`

# Frontier Survival v1.18.35 — Tortola / BVI 1:10 regional biome

Decision: release candidate pending final live verification

## Product slice

This checkpoint extends the existing BVI-inspired starter route into a larger, authored regional chain using a documented horizontal scale of approximately 10 metres per world cell (1:10 relative to a metre-scale voxel world). Vertical relief remains compressed to the existing 48-block survival ceiling.

Added deterministic, mirrored landforms for:

- Beef Island / Trellis Bay;
- Virgin Gorda east / Spanish Town approach;
- Norman Island;
- Salt Island;
- Scrub Island;
- outer Anegada shelf;
- Ginger Island and Marina Cay.

Existing Cane Garden Bay, White Bay, North Sound, launch ramp, reef, dock, and worker seam contracts remain intact. The runtime now emits named `Landfall · ...` cues when entering authored places, with biome notification priority preserved.

## Research basis

- Tortola is approximately 19 km long and 5 km wide, with Mount Sage as the highest point.
- The BVI chain is volcanic and mountainous except for low, reef-built Anegada.
- The authored ordering follows the real regional relationship: Tortola central, Jost west, Norman/Peter/Salt south, Beef/Scrub/Great Camanoe east, Virgin Gorda farther east, and Anegada northeast.

Sources consulted during implementation: Wikipedia pages `Tortola` and `Geography of the British Virgin Islands` accessed 2026-08-23 through the browser.

## Dirty worker-tree salvage

The canonical checkout at `/mnt/c/Users/wdavi/Projects/Frontier-Survival` remains quarantined and untouched. Its inventory showed broad older renderer WIP, orchestration files, stale worktree folders, and unintegrated helpers; no BVI change was accepted by bulk merge. Productive work was salvaged by preserving the tree, using a clean `origin/main` candidate, and independently porting only the attributable geography/runtime slice. No destructive reset, clean, or overwrite was used.

## Evidence

Static / automated:

- clean candidate worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-tortola`;
- `node --check` passed for `gen.js`, `chunk-worker.js`, `game.js`, and `world.js`;
- `node tests/smoke.mjs`: 428 PASS lines;
- `git diff --check`: PASS;
- `index.html` and `public/index.html`: byte-identical;
- cache chain: `main.js?v=704` → `game.js?v=692` → `gen.js?v=310`, worker `chunk-worker.js?v=332`.

Local browser:

- exact candidate served at `http://127.0.0.1:18777/`;
- Start/New World reached `window.__FS.started === true` and hid `#title-screen`;
- 1280×720 fresh Cane Garden Bay frame passed with zero page-owned errors;
- Beef Island runtime probe at `(116.5, -4.5)` loaded 702 streamed chunks, reported `Beef Island · Trellis Bay`, and visibly rendered an island, open water, sandy shore, tropical relief, HUD, and no black/gray renderer artifact.

Live Pages:

- pending push and post-deploy verification.

## Remaining honest limitation

This is an authored 1:10 horizontal coastline approximation, not survey-grade GIS or literal AAA parity. The existing voxel shoreline steps and dark forest shading remain known visual limitations; the new landform layout and route/location cues are the accepted player-visible advancement.

# Frontier Survival v1.12.97 — Tropical Archipelago Geography Checkpoint

Date: 2026-08-18
Base: v1.12.96 / commit 190a477
Scope: deterministic geography/material slice only.

## Player-visible scope

- Rebalanced the fixed-seed travel field toward an archipelago: broad open water, separate islands, playable starter island, authored shore bay, and taller relief.
- Preserved the existing fixed-seed starter route and shore destination contracts.
- Added deterministic exposed coal/iron/copper/diamond candidates only on high, sheared mountain faces.
- Added copper/diamond block IDs, atlas tiles, and face-aware atlas mappings.
- Reworked cobblestone toward weathered cool-gray stone with lighter worn faces; it no longer uses the coal-like dark material treatment.
- Kept natural brick/cobble structures limited to authored landmark paths; no arbitrary natural-land scatter was added.
- Mirrored the terrain/ore logic in synchronous generation and the chunk worker.

## Evidence buckets

### Static

- Touched production paths: `gen.js`, `chunk-worker.js`, `biomes.js`, `world.js`, `blocks.js`, `atlas-core.js`, `atlas.js`, plus transitive cache-bust importers.
- Root/public HTML remain byte-identical.
- Old changed-module edges were removed:
  - `gen.js?v=286`
  - `biomes.js?v=246`
  - `world.js?v=421`
  - `blocks.js?v=287`
  - `atlas-core.js?v=285`
  - `atlas.js?v=297`
  - `game.js?v=446`
- All touched JavaScript files pass `node --check`.
- `git diff --check` passes.

### Automated

- `node tests/smoke.mjs`: exit 0.
- PASS assertion lines: 410.
- New contracts cover water ratio, bounded relief, starter/shore route preservation, deterministic exposed ores, synchronous/worker seams, atlas mappings, cobblestone palette, and natural masonry restrictions.
- Fixed seed `1884808540` sampled metrics:
  - water ratio: `0.8323025173611112`
  - peak: `40` with world ceiling below `48`
  - exposed ore cells found in the audited field: `6`
  - starter height: `16`
  - authored shore: height `16`, biome `shore`
  - tropical route: height `18`, biome `tropical`

### Runtime

Exact candidate served from:
`http://127.0.0.1:18909/?review=geography-candidate&seed=1884808540`

- Start action reached the real handler; the bridge timed out after 5 seconds while generation continued.
- Authoritative probe after the timeout:
  - `started: true`
  - seed: `1884808540`
  - title hidden: `true`
  - canvas: `1280x720`
  - player: approximately `(33.5, 30.0001, 8.5)` on land
  - page-owned runtime errors: `[]`

### Visual

- Fixed-seed screenshot: `/tmp/frontier-geography-candidate-fixed.png`
- Ordinary frame visibly reads as tropical island travel: broad blue open water dominates the middle distance, a separate forested island is clearly visible across the channel, and the near shore has a steep mountain/cliff wall.
- HUD, crosshair, survival bars, hotbar, and action overlays remain readable.
- No black/gray renderer occlusion or missing-terrain regression was visible.
- The ordinary frame does not expose a rare ore block or cobblestone close-up; those remain static/smoke-backed in this checkpoint.

## Decision

Accepted as a complete local v1.12.97 geography/material checkpoint pending commit, push, and live Pages verification. This is an incremental checkpoint, not a claim that the entire tropical AAA goal is complete. Inventory drag/drop, save/quit feedback, climate-correct weather, reduced mushroom density, aquatic encounter polish, and the broader held-item catalog remain open slices.

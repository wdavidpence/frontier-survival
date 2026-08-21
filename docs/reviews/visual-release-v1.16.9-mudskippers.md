# Frontier Survival v1.16.9 — Mangrove mudskippers

Decision: ACCEPTED INCREMENTAL FAUNA-BREADTH CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added two sparse authored mudskippers along the Mangrove channel edge.

- low-poly warm mud/ochre silhouettes with fin and eye accents;
- dusk/night-only visibility using the existing Rootwalk ecology gate;
- short deterministic water-to-mud hops, max height `0.24` blocks;
- hop phase offset between the two skippers;
- one localized pale ripple per active hop;
- 18-block proximity activation;
- no new global particle system, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `8fd350619f42037411d33bba5c591d13a2d4bddb`
- Documentation commit: recorded below
- Tag: `v1.16.9`
- Cache chain: `main.js?v=501` → `game.js?v=490` → `fx.js?v=264`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`;
  - two mudskippers constructed and visible at night;
  - one active hop reached `y=17.252`;
  - one localized hop ripple visible;
  - zero page-owned errors.
- Local primary night frame: bridge, lantern, fireflies, moths, frogs, crabs, dynamic water response, seagrass, reflection/foam, HUD, and renderer remain healthy; mudskippers remain subordinate at the accepted distance.
- Controlled supplemental crop: tan mudskipper silhouettes and one pale hop ripple integrate into the lower-center ecology cluster without route or HUD occlusion.
- Local daytime: mudskippers `0`, hop ripples `0`, `night=false`, zero errors.
- Live Pages:
  - title `Frontier Survival v1.16.9`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - two visible mudskippers;
  - one active hop at `y=17.252`;
  - one hop ripple;
  - zero page-owned errors;
  - clean live primary night frame passed visual review;
  - daytime gate: mudskippers `0`, ripples `0`, crabs `0`, frogs `0`, zero errors.

## Honest limitation

This broadens species variety with one authored mudskipper behavior slice; it is not a complete wetland food web or full wildlife simulation. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

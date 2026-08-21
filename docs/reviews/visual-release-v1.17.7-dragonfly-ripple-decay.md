# Frontier Survival v1.17.7 — dragonfly ripple decay

Decision: ACCEPTED INCREMENTAL AUTHORED-ECOLOGY CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made the dragonfly skim dimple persist as a short authored water-contact pulse instead of disappearing on the next frame, and corrected per-dragonfly ripple material isolation.

- per-ripple pulse state decays at `2.8` per second;
- ripple remains visible above pulse `0.06`;
- hit opacity remains `0.16` at full pulse;
- quiet next tick visibly lingers then fades;
- each dimple receives a cloned material so the second dragonfly cannot reset the first ripple’s opacity;
- ripple geometry, waterline `y=17.14`, night suppression, dragonfly skim, mudskipper feeding, hops, dart, splash audio, and Rootwalk visuals preserved;
- disposal covers cloned materials;
- no generic particle layer, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `b7457cde273c9cc7cc9f5917e2a843b6ad7f7037`
- Documentation commit: recorded below
- Tag: `v1.17.7`
- Cache chain: `main.js?v=509` → `game.js?v=498` → `fx.js?v=272`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - hit: pulse `[0.9999,0]`, visible `1`, opacities `[0.16,0]`;
  - quiet `0.1s` tick: pulse `[0.7199,0]`, visible `1`, opacities `[0.115,0]`;
  - after `0.3s` decay: pulse `[0,0]`, visible `0`, opacities `[0,0]`;
  - zero page-owned errors.
- Local visual: clean daytime primary Rootwalk frame preserves accepted bridge, water, horizon, seagrass, HUD, renderer, and subordinate cyan fauna.

## Honest limitation

This makes one inter-species water cue temporally readable; it is not a complete insect–fish ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

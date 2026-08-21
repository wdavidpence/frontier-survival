# Frontier Survival v1.17.6 — dragonfly skim water dimple

Decision: ACCEPTED INCREMENTAL AUTHORED-ECOLOGY CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Completed the feeding chain with one tiny cyan water dimple under a low dragonfly skim.

- two per-dragonfly reused `RingGeometry(0.06, 0.1, 10)` meshes;
- visible only while `skim > 0.55`;
- ripple waterline fixed at `y=17.14`;
- localized to the live dragonfly flight position;
- bounded scale and opacity (`skim * 0.16`);
- idle hover has no dimple;
- nighttime hides both dragonflies and dimples;
- existing mudskipper feeding, dragonfly dip/skim, hops, dart, splash audio, and Rootwalk visuals preserved;
- no generic particle layer, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `34508200c5d169ca3982196c83bf4c69a4d3be72`
- Documentation commit: recorded below
- Tag: `v1.17.6`
- Cache chain: `main.js?v=508` → `game.js?v=497` → `fx.js?v=271`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`;
  - idle: `skimPulse=0`, flies `2`, ripples `0`, opacity `0`;
  - feeding low pass: `skimPulse=1`, flies `2`, ripples `1`, opacity `0`, localized ripple positions `[[52.966,17.14,58.742],[54.662,17.14,59.009]]`;
  - nighttime feeding: flies `0`, ripples `0`, `skimPulse=0`;
  - zero page-owned errors.
- Local visual: clean daytime primary Rootwalk frame preserves accepted bridge, water, horizon, seagrass, HUD, renderer, and subordinate cyan fauna.

## Honest limitation

This completes one readable mudskipper → dragonfly → water feedback chain, not a complete insect–fish ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

# Frontier Survival v1.17.8 — dragonfly perch behavior

Decision: ACCEPTED INCREMENTAL AUTHORED-WILDLIFE-BEHAVIOR CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added a deterministic authored perch window for the first Mangrove dragonfly.

- perch cycle: `(elapsed + phase) % 11.2`;
- first dragonfly briefly settles during the `5.0–6.8s` window;
- lower body by up to `0.22` blocks;
- adds bounded body tilt up to `0.22` radians and roll up to `0.3` radians;
- folds wing scale by up to `55%`;
- feeding suppresses perch so the skim behavior wins;
- close-player scatter suppresses perch so the animal reacts instead of clipping into a landing pose;
- existing day/dusk visibility, scatter, feeding dip/skim, skim ripple, nighttime suppression, waterline, mudskipper behavior, audio, and Rootwalk visuals preserved;
- no new geometry, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `d4020b0dc75fb900c2d4c6347255fa89e9350d50`
- Documentation commit: recorded below
- Tag: `v1.17.8`
- Cache chain: `main.js?v=510` → `game.js?v=499` → `fx.js?v=273`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - title `Frontier Survival v1.17.8`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - ordinary authored route at elapsed `5.9`: perch `1`, scatter `0`, first dragonfly y `17.181`, rotation x `0.22`, wing scale `0.353`, two visible flies;
  - feeding at same phase: perch `0`, scatter `0`, y `17.321`, rotation x `0.14`, wing scale `0.783`;
  - close player at first authored spot: perch `0`, scatter `1`, y `17.561`, rotation x `0`, wing scale `0.783`;
  - zero page-owned errors.
- Local visual: clean daytime primary Rootwalk frame preserves accepted bridge, water, horizon, seagrass, HUD, renderer, and subordinate cyan fauna.

## Honest limitation

This adds a bounded perch/scatter behavior, not a complete insect ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

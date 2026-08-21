# Frontier Survival v1.17.2 — mudskipper feeding pause

Decision: ACCEPTED INCREMENTAL FAUNA-BEHAVIOR CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added a restrained authored feeding pause at the two existing Mangrove mudskipper wet-mud spots.

- deterministic staggered `0.8s` feeding windows;
- only active inside the existing 18-block Mangrove fauna radius;
- small head-dip/body pause (`0.045` block dip, bounded rotation);
- one tiny pale surface dimple reuses the existing hop ripple mesh;
- no new particle layer, terrain, collision, survival, input, audio, or HUD changes;
- existing hop, waterward dart, splash audio, night gate, and cooldown behavior preserved.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `3e777df687924a173963d06ad22f14bde7a480c2`
- Documentation commit: recorded below
- Tag: `v1.17.2`
- Cache chain: `main.js?v=504` → `game.js?v=493` → `fx.js?v=267`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`;
  - outer-ring active context at `(47.5,40)` produced feeding `0`, alert `0`, ripples `0`;
  - near-channel context at `(53.2,59.4)` produced feeding `1`, alert `0.871`, ripples `1`;
  - zero page-owned errors.
- Local ordinary Rootwalk primary proof: bridge, lantern, fireflies, moths, frogs, crabs, mudskippers, water, seagrass, reflection/foam, HUD, and renderer remain healthy with no visual regression.
- Supplemental close-camera attempt was rejected as evidence because the angle introduced dark cliff occlusion; the ordinary player-facing Rootwalk frame remains the visual acceptance gate.
- Live Pages:
  - title `Frontier Survival v1.17.2`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - outer-ring feeding `0`, alert `0`, ripples `0`;
  - near-channel feeding `1`, alert `0.871`, ripples `1`;
  - clean live primary night frame passed visual review;
  - daytime gate: mudskippers `0`, ripples `0`, feeding `0`, alert `0`, crabs `0`, frogs `0`, zero errors.

## Honest limitation

This is a bounded authored feeding pause, not a full mudskipper navigation, feeding simulation, or wetland food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

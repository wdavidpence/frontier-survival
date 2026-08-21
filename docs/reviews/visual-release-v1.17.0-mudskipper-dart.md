# Frontier Survival v1.17.0 — mudskipper player dart

Decision: ACCEPTED INCREMENTAL FAUNA-BEHAVIOR CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made the two authored Mangrove mudskippers react to close player approach.

- seven-block alert falloff;
- waterward dart toward the authored channel center;
- alert pulse drives a small forward lean;
- close hops gain up to `0.08` additional height;
- deterministic idle drift remains intact;
- existing dusk/night gate, 18-block hop activation, and localized hop ripples preserved;
- no terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `a34caf9452c4af62a45c6cbefe80fa78047d9706`
- Documentation commit: recorded below
- Tag: `v1.17.0`
- Cache chain: `main.js?v=502` → `game.js?v=491` → `fx.js?v=265`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed behavior probe:
  - `started=true`, seed `1884808540`;
  - far approach alert `0`;
  - close approach alert `0.889`;
  - lead skipper moved from `[52.911,17.267,59.5]` to `[53.077,17.34,59.436]`;
  - zero page-owned errors.
- Local primary night frame: bridge, lantern, fireflies, moths, frogs, crabs, mudskippers, water, seagrass, reflection/foam, HUD, and renderer remain healthy.
- Local daytime: mudskippers `0`, ripples `0`, alert `0`, crabs `0`, frogs `0`, zero errors.
- Live Pages:
  - title `Frontier Survival v1.17.0`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - live far approach alert `0`;
  - live close approach alert `0.889`;
  - lead skipper movement matched local;
  - zero page-owned errors;
  - clean live primary scene remains healthy;
  - daytime gate: mudskippers `0`, ripples `0`, alert `0`, crabs `0`, frogs `0`, zero errors.

## Honest limitation

This is a bounded proximity response, not complete mudskipper navigation or wetland ecology. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

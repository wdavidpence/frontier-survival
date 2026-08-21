# Frontier Survival v1.16.8 — dynamic crab ripple source

Decision: ACCEPTED INCREMENTAL ECOLOGICAL-INTERACTION CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made the crab-triggered shallow-channel ripple follow the specific crab that generated the strongest close scuttle pulse.

- `MangroveCrabFX` now exposes `scuttleSourceX/Z` alongside `scuttlePulse`;
- source is updated from the winning crab’s live position plus a small water-side offset;
- `Game._tickMangroveFX()` passes those coordinates into `MangroveWaterFX.setCrabPulse()`;
- existing waterline `y=17.13`, pale-green ring, opacity, night gating, and quiet reset remain unchanged;
- no terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `f00bb81b25c642e03d3897d916f2da0b51de2e5e`
- Documentation commit: recorded below
- Tag: `v1.16.8`
- Cache chain: `main.js?v=500` → `game.js?v=489` → `fx.js?v=263`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed dynamic-source probe:
  - `started=true`, seed `1884808540`;
  - approach one produced pulse `0.823`, source/ripple `[52.15,17.13,59.38]`;
  - approach two produced pulse `0.923`, source/ripple `[53.892,17.13,60.08]`;
  - different crab approaches therefore produce different water response locations;
  - zero page-owned errors.
- Local clean accepted primary night frame: bridge, lantern, fireflies, moths, frogs, crabs, water, seagrass, reflection/foam, and HUD remain healthy with no visual regression.
- Local daytime: ripple hidden/opacity `0`, crabs `0`, flecks `0`, frogs `0`, zero errors.
- Live Pages:
  - title `Frontier Survival v1.16.8`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - dynamic-source probe reproduced `[52.15,17.13,59.38]` and `[53.892,17.13,60.08]`;
  - zero page-owned errors;
  - clean live primary night frame passed visual review;
  - daytime gate: `night=false`, ripple hidden/opacity `0`, crabs `0`, flecks `0`, frogs `0`, zero errors.

## Honest limitation

This is a dynamic single-cue interaction, not a complete shoreline simulation or broad wildlife ecology system. Remaining premium gaps include richer species behavior, navigation/feeding/predator-prey interaction, broader habitat storytelling, and deeper HRTF/occlusion/reverb audio.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

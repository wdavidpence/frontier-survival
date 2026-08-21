# Frontier Survival v1.17.4 — dragonfly feeding cue

Decision: ACCEPTED INCREMENTAL AUTHORED-ECOLOGY CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Connected the authored daytime dragonflies to the authored mudskipper feeding signal.

- dragonflies receive the live mudskipper `feedingPulse`;
- feeding cue lowers both hover bodies by `0.08` blocks;
- adds a small synchronized pitch/dip of `0.14` radians;
- idle dragonfly hover remains unchanged;
- existing day/dusk visibility, six-block scatter, nighttime suppression, hops, feeding dimple, and splash audio remain intact;
- no new particles, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `cb488983086abf7805c78383105f6ae02ac079f`
- Documentation commit: recorded below
- Tag: `v1.17.4`
- Cache chain: `main.js?v=506` → `game.js?v=495` → `fx.js?v=269`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`;
  - idle dragonflies: `feedingCue=0`, y `[17.605,17.649]`, rotation x `[0,0]`;
  - feeding signal: `feedingCue=1`, y `[17.525,17.569]`, rotation x `[0.14,0.14]`;
  - two dragonflies remained visible;
  - zero page-owned errors.
- Local visual: clean daytime primary Rootwalk frame preserves the accepted bridge, water, horizon, seagrass, HUD, and renderer; cyan dragonfly motifs remain sparse and subordinate.
- Live Pages:
  - title `Frontier Survival v1.17.4`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - idle dragonflies: cue `0`, y `[17.605,17.649]`, rotation x `[0,0]`;
  - feeding signal: cue `1`, y `[17.525,17.569]`, rotation x `[0.14,0.14]`;
  - clean live daytime primary frame passed visual review;
  - zero page-owned errors.

## Honest limitation

This is one bounded inter-species cue, not a full insect–fish ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

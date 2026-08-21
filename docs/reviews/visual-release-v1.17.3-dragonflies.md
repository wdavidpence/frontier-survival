# Frontier Survival v1.17.3 — Mangrove dragonflies

Decision: ACCEPTED INCREMENTAL FAUNA-BREADTH CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added two authored low-poly dragonflies hovering over the Mangrove shallow channel.

- cyan translucent wing silhouettes and teal bodies;
- day/dusk-only visibility (`nightMix < 0.65`);
- deterministic hover, wing-flap, and channel drift;
- six-block player-approach scatter pulse;
- two fixed authored channel positions;
- no generic particle layer, terrain, collision, survival, input, audio, or HUD changes;
- existing nocturnal frogs, crabs, mudskippers, moths, fireflies, water response, and splash audio preserved.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `0b8a002e1d64d91409eef771252ef061785f2c20`
- Documentation commit: recorded below
- Tag: `v1.17.3`
- Cache chain: `main.js?v=505` → `game.js?v=494` → `fx.js?v=268`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`;
  - daytime ordinary point: two visible dragonflies, scatter `0`;
  - daytime near-channel point: two visible dragonflies, scatter `0.879`;
  - nighttime near-channel point: zero visible dragonflies;
  - zero page-owned errors.
- Local visual:
  - clean accepted daytime Rootwalk frame preserves bridge, lantern, water, horizon, seagrass, HUD, and renderer;
  - lower-center crop shows two distinct cyan winged motifs over the channel, sparse and subordinate;
  - no route or HUD overlap.
- Live Pages:
  - title `Frontier Survival v1.17.3`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - daytime ordinary point: two visible dragonflies, scatter `0`;
  - daytime near-channel point: two visible dragonflies, scatter `0.879`;
  - nighttime near-channel point: zero visible dragonflies;
  - clean live daytime primary frame passed visual review;
  - zero page-owned errors.

## Honest limitation

This broadens Mangrove species identity with a bounded authored hover/scatter behavior, not a complete insect ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

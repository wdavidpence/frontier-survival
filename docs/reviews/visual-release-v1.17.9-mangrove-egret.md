# Frontier Survival v1.17.9 — Mangrove egret

Decision: ACCEPTED INCREMENTAL SPECIES-BREADTH CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added one sparse authored Mangrove egret perched over the shallow channel.

- white/charcoal low-poly body, neck, head, beak, wings, and legs;
- day/dusk-only visibility (`nightMix < 0.5`);
- 24-block Mangrove activation radius;
- deterministic still perch at the authored channel spot;
- seven-block close-player scatter/takeoff response;
- takeoff raises the body by up to `0.42` blocks, tilts it, and increases wing lift;
- no new audio, terrain, collision, survival, input, HUD, or global particle layer;
- existing dragonfly, mudskipper, crab, frog, water, bridge, lantern, horizon, seagrass, and Rootwalk gates preserved.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `3b6fd90d66c777ec8b316d15faf164f121b9c41c`
- Documentation commit: recorded below
- Tag: `v1.17.9`
- Cache chain: `main.js?v=511` → `game.js?v=500` → `fx.js?v=274`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - title `Frontier Survival v1.17.9`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - far/ordinary route: visible `true`, perch `1`, scatter `0`, y `17.715`;
  - close approach at the authored spot: visible `true`, perch `0`, scatter `1`, y `18.135`, rotation x `-0.18`, wing scale `1.445`;
  - nighttime: visible `false`, perch `0`, scatter `0`;
  - zero page-owned errors.
- Local visual: clean daytime Rootwalk frame passes. Crop review confirms the egret reads as a small white/charcoal bird with neck, beak, wings, and legs over the channel, subordinate to the bridge, water, and HUD.

## Honest limitation

This adds one iconic wetland species and a bounded takeoff response, not a complete bird ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Stopping point

This is the requested clean stopping checkpoint. Do not begin another feature slice until the user starts a new session/resume instruction.

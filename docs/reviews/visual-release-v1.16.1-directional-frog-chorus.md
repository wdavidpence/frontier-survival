# Frontier Survival v1.16.1 — directional Mangrove frog chorus

Decision: ACCEPTED INCREMENTAL SPATIAL-AUDIO CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added directional stereo placement to the authored Mangrove frog chorus.

- `ambientMix` now derives `frogPan` from player lateral offset relative to the Rootwalk channel;
- frog source pan clamps to `[-1, 1]` over a 12-block lateral range;
- chorus notes inherit the source pan with a slightly narrowed second-note spread;
- `AudioBus.beep` now uses `StereoPannerNode` when available and falls back to the existing mono connection;
- distance falloff, night gating, near-water gating, and dead-state silence remain unchanged;
- no terrain, geometry, gameplay, collision, survival, visual, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `aa39b1746bad0e7117da78a26bdf2797fd1bdddb`
- Tag: `v1.16.1`
- Cache chain: `main.js?v=493` → `game.js?v=482` → `audio.js?v=224`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local browser pure-mix probe at night and near water, distance `3`:
  - player lateral `-12`: `frogPan=-1`;
  - centered: `frogPan=0`;
  - player lateral `+12`: `frogPan=+1`;
  - frog strength remains `0.2764` in all three cases.
- Local browser confirms native `StereoPannerNode` support.
- Local clean night frame: bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD remain unchanged and readable without renderer artifacts.

## Honest limitation

This is directional stereo placement, not full HRTF, occlusion, reverb, or true 3D audio propagation. Remaining premium gaps include richer species variety, deeper spatial sound design, and broader authored Mangrove ecology.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial water/fauna audio while preserving accepted Rootwalk gates.

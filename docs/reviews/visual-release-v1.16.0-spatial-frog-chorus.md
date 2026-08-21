# Frontier Survival v1.16.0 — spatial Mangrove frog chorus

Decision: ACCEPTED INCREMENTAL SOUNDSCAPE CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Spatialized the authored Mangrove frog chorus by fading it with Rootwalk distance.

- production game loop now passes `mangroveDistance` into `ambientMix`;
- frog chorus remains night-only and near-water-only;
- strength uses a 22-block linear falloff;
- direct `ambientMix` callers retain full-strength backward-compatible defaults;
- dead state forces frog mix to zero;
- no terrain, geometry, gameplay, collision, survival, input, visual, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `e2be777a3b5a28388ecbe87351a3ffea72b62e2d`
- Tag: `v1.16.0`
- Cache chain: `main.js?v=492` → `game.js?v=481` → `audio.js?v=223`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Live browser `ambientMix` probe at night and near water:
  - near distance `1.58`: frog strength `0.2970`;
  - Mangrove boundary `22`: frog strength `0`;
  - outside distance `38.24`: frog strength `0`;
  - dead state: frog strength `0`;
  - zero page-owned errors.
- Local clean night frame: bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD remain unchanged and readable without renderer artifacts.

## Honest limitation

This is distance-faded synthesized audio, not full stereo spatialization or occlusion-aware sound propagation. Remaining premium gaps include richer species variety, true spatial audio, and broader authored Mangrove ecology.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial water/fauna audio while preserving the accepted Rootwalk gates.

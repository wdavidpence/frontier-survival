# Frontier Survival v1.16.2 — Mangrove crab ecology

Decision: ACCEPTED INCREMENTAL FAUNA-BREADTH CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added three sparse authored Mangrove crabs along the Rootwalk channel edge.

- low-profile shell and six-leg silhouettes;
- warm clay/orange contrast for night readability;
- tiny deterministic sideways drift and body tilt;
- visible only after dusk inside the existing Rootwalk FX radius;
- no world-generation, terrain, gameplay, collision, survival, input, audio, or HUD changes.

## Correction

The first crab materials were lit and visually disappeared into the dark waterline. Runtime projection showed the crabs were on-screen but low-contrast. The final pass uses restrained unlit translucent materials with `depthTest:false`/`depthWrite:false`, preserving small scale while making the silhouettes legible.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `e6eb162000a5792efc0b884b52f77276e8cfecc6`
- Tag: `v1.16.2`
- Cache chain: `main.js?v=494` → `game.js?v=483` → `fx.js?v=257`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night:
  - `started=true`;
  - seed `1884808540`;
  - three crab groups and three visible crabs;
  - crab positions drifted within the authored channel-edge bounds;
  - frogs remained visible;
  - zero page-owned errors.
- Supplemental channel frame: three crab silhouettes are distinguishable at the channel edge without clutter or occlusion.
- Accepted primary frame: crabs remain below the bridge/lantern visual hierarchy, clear of HUD, with existing fireflies, moths, frogs, water, seagrass, and reflection/foam healthy.
- Daytime gate: `night=false`, crabs `0`, frogs `0`, zero errors.

## Honest limitation

This is a sparse authored fauna cue, not a full crab AI, navigation, feeding, or predator/prey system. Remaining premium gaps include richer species variety, deeper wildlife behavior, and true spatial water/fauna audio.

## Next bounded slice

Advance Mangrove toward richer authored ecology, spatial audio, or authored wildlife behavior while preserving accepted Rootwalk gates.

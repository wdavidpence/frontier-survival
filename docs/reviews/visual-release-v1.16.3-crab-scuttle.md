# Frontier Survival v1.16.3 — crab player scuttle

Decision: ACCEPTED INCREMENTAL WILDLIFE-BEHAVIOR CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made the three authored Rootwalk crabs react to close player approach.

- crab/player distance uses a seven-block alert falloff;
- each crab scuttles sideways away from the player within that falloff;
- scuttle is layered over the existing deterministic idle sidestep;
- crab body yaw/tilt shifts into the response;
- dusk/night-only visibility and existing sparse channel-edge placement remain unchanged;
- no world-generation, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `89179bc2fa702ac5cf1790e42f7cdccbb214a766`
- Tag: `v1.16.3`
- Cache chain: `main.js?v=495` → `game.js?v=484` → `fx.js?v=258`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night behavior probe:
  - far center `(47.5,47.5)` crab x positions `[51.757, 53.035, 50.672]`;
  - close center `(51.6,59.1)` positions `[52.023, 53.247, 50.485]`;
  - deltas `[+0.266, +0.212, -0.187]`, showing away-from-player scuttle;
  - close response rotations `[0.65, 0.567, -0.578]`;
  - three crabs visible and zero page-owned errors.
- Clean local primary night frame: crabs remain small and subordinate to bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD.
- Daytime gate: `night=false`, crabs `0`, frogs `0`, zero errors.

## Honest limitation

This is a bounded proximity response, not full navigation, terrain avoidance, feeding, or predator/prey AI. Remaining premium gaps include richer species behavior, broader ecology, and deeper spatial water/fauna audio.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

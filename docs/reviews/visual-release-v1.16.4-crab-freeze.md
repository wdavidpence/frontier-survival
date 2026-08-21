# Frontier Survival v1.16.4 — crab freeze response

Decision: ACCEPTED INCREMENTAL WILDLIFE-BEHAVIOR CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added a brief close-approach freeze response before crab scuttle motion.

- freeze strength uses a five-block alert falloff;
- the freeze phase suppresses scuttle displacement by up to 85%;
- a small body tilt communicates the pause;
- the existing seven-block flee/scuttle response remains active;
- dusk/night-only visibility and sparse channel-edge placement remain unchanged;
- no world-generation, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `463e96d5ac2c8bc925d7099e058fc94c720b0c34`
- Tag: `v1.16.4`
- Cache chain: `main.js?v=496` → `game.js?v=485` → `fx.js?v=259`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night production-tick probe at crab center:
  - freeze phase elapsed `0.49`: first crab `x=51.684`, `rotation.x=0.22`;
  - movement phase elapsed `1.96`: first crab `x=51.901`, `rotation.x=0.149`;
  - all three crabs visible;
  - zero page-owned errors.
- Clean local primary night frame: freeze/scuttle behavior remains visually restrained; bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD remain healthy.
- Daytime gate: `night=false`, crabs `0`, frogs `0`, zero errors.

## Honest limitation

This is a bounded reactive pause, not full navigation, terrain avoidance, feeding, or predator/prey AI. Remaining premium gaps include richer species behavior, broader ecology, and deeper spatial water/fauna audio.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

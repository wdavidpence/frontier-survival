# Frontier Survival v1.15.6 — frog player awareness

Decision: ACCEPTED INCREMENTAL FAUNA-INTERACTION CHECKPOINT — PREMIUM FAUNA INTERACTION STILL OPEN

## Product slice

Added a close-range player-awareness response to the three authored Rootwalk frogs.

- within `14` blocks, each frog turns partially toward the player;
- shared eye glints pulse slightly while alert;
- existing staggered proximity hops remain active within `16` blocks;
- alert behavior remains dusk/night-only;
- outside the alert radius, frogs retain the prior idle behavior;
- no gameplay, collision, terrain, survival, input, audio, bridge, water, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `9fa4173cd39ab3521fd7621dd4010d78e1f631d0`
- Tag: `v1.15.6`
- Cache chain: `main.js?v=488` → `game.js?v=477` → `fx.js?v=255`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local night at accepted land position `(47.5,19.0001,47.5)`: three frogs visible, eye opacity `0.9507`, player-aware rotations `[−0.336, 1.689, 3.071]`, one frog mid-hop at `y=17.494`, frog audio `0.32`, fireflies/moths/water active, zero errors.
- Clean night frame: eye-glint interaction remains a tiny channel cue; bridge, lantern, fireflies, moths, water, seagrass, reflection/foam, and HUD remain readable without artifacts.
- Local daytime: frogs hidden, eye opacity `0`, frog audio `0`, birds `0.55`, zero errors.

## Honest limitation

This is a stylized player-awareness response, not full animal AI or an interactive feeding/taming system. Remaining premium gaps include richer fauna interaction, spatial audio, species variety, and broader authored ecology.

## Next bounded slice

Add one more authored Mangrove fauna interaction cue while preserving Rootwalk day/dusk/night visuals and the frog-audio gate.

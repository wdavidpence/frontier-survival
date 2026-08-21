# Frontier Survival v1.15.5 — proximity frog hops

Decision: ACCEPTED INCREMENTAL FAUNA-BEHAVIOR CHECKPOINT — PREMIUM FAUNA INTERACTION STILL OPEN

## Product slice

Upgraded the three authored Rootwalk frogs from static silhouettes to proximity-driven fauna behavior.

- each frog cycles on a staggered seven-second phase;
- a hop lasts `0.72s` and rises only `0.28` blocks;
- hops occur when the player is within `16` blocks;
- idle bob and slight rotation remain;
- dusk/night visibility gate remains unchanged;
- frog chorus audio and all prior Rootwalk FX remain unchanged.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `e7f95075c06ede194257a5efd0077a09eaf9cf5f`
- Tag: `v1.15.5`
- Cache chain: `main.js?v=487` → `game.js?v=476` → `fx.js?v=254`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night: three frog groups visible, frog audio `0.32`, AudioContext running, zero errors.
- Timed behavior samples: one frog rose from `17.275` to `17.465` during the hop phase while the others cycled, proving actual motion rather than static geometry.
- Local daytime: frogs hidden, frog audio `0`, birds `0.55`, zero errors.
- Night screenshot: eye glints and small frog cluster remain restrained; bridge, lantern, fireflies, moths, water, seagrass, and HUD remain readable with no renderer artifact.

## Honest limitation

The behavior is a deterministic authored idle/proximity hop, not full AI pathfinding or ecological simulation. Remaining premium gaps include richer fauna interaction, feeding/taming, spatial audio, and broader Mangrove species variety.

## Next bounded slice

Add one more cohesive authored Mangrove fauna behavior or interaction cue while preserving Rootwalk day/dusk/night visuals and frog-audio gates.

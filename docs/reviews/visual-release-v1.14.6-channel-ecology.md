# Frontier Survival v1.14.6 — Mangrove shallow-channel ecology

Decision: ACCEPTED INCREMENTAL VISUAL CHECKPOINT — LARGER AAA ECOLOGY PASS STILL OPEN

## Product slice

Added authored shallow-channel ecology around the Lantern Rootwalk.

- four deterministic open-water clusters beside the bridge;
- underwater KELP depth from `SEA_LEVEL - 1` downward;
- SEAGRASS at cluster tips;
- emergent SEAGRASS at `SEA_LEVEL + 1` so the shoreline reads from the land-side approach;
- mirrored synchronous and worker generation;
- no bridge, collision, firefly, or route changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Fixed seed: `1884808540`
- Product commit: `07e901b62b5bf0079ae2b672ffa8543f0df8f15e`
- Tag: `v1.14.6`
- Cache chain: `main.js?v=478` → `game.js?v=467` → `world.js?v=435` → `chunk-worker.js?v=295`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local runtime: `started=true`, fixed seed, `onGround=true` at `(47.5,19.0001,47.5)`, fireflies visible, zero page-owned errors.
- Runtime world scan: 15 channel ecology blocks, including 2 emergent tips at `y=17`.
- Clean local primary frame preserves the bridge, lantern, firefly glints, water/horizon, and readable HUD.
- Supplemental channel frame visibly shows restrained green seagrass tips at the waterline.
- No black/gray renderer artifact, giant foreground occlusion, or HUD overlap.

## Honest limitation

This is an accepted shallow-channel checkpoint, not final AAA parity. Remaining gaps include richer Mangrove fauna, wet-mud material variation, water reflection/foam, soundscape, and a stronger cinematic dusk/night ecology presentation.

## Next bounded slice

Add one wet-mud/shore material variation around the accepted channel, preserving the bridge/firefly/seagrass composition and fixed-seed evidence points.

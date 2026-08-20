# Frontier Survival v1.13.8 — raised Rootwalk lantern checkpoint

Decision: PUBLISHED INCREMENTAL CHECKPOINT — VISUAL FOLLOW-UP REQUIRED

## Product slice

Raised the authored Lantern Rootwalk finial so the Mangrove destination can read above the low shoreline canopy.

- upper mangrove-log finial;
- elevated torch lantern;
- leaf halo around the finial;
- mirrored synchronous and chunk-worker placement;
- accepted v1.13.6 open-water approach composition preserved.

## Provenance

- Product commit: `1d88ee6caae3d1e9920cc6aa4ba68a342abde041`
- Tag: `v1.13.8`
- Base: v1.13.7 / `3044789`
- Cache chain: `main.js?v=470` → `game.js?v=459` → `world.js?v=428` → `chunk-worker.js?v=289`
- Fixed seed: `1884808540`

## Evidence

- Full smoke: PASS.
- Syntax checks: PASS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed Start/runtime: `started=true`, title hidden, `biome=mangrove`, zero page-owned errors.
- v1.13.8 open-water frame remains readable with coherent sky, horizon, water, HUD, and no renderer artifacts.

## Visual status

The wide approach frame remains accepted as a readable baseline, but the elevated Rootwalk lantern is still not clearly identifiable in that wide composition. The close-up path has repeatedly suffered foreground-geometry occlusion or capture instability. This checkpoint is therefore intentionally unverified for the Rootwalk prop itself.

No AAA parity claim is made.

## Next bounded slice

Capture a stable mid-distance frame from the open-water side with the Rootwalk offset one or two cells toward the water if necessary. Require the torch finial, paired posts, roots, water/horizon, and HUD to read together before declaring the destination prop accepted.

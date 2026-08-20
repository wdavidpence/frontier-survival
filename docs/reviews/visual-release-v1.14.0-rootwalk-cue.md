# Frontier Survival v1.14.0 — Mangrove Lantern Rootwalk arrival cue

Decision: ACCEPTED INCREMENTAL VISUAL CHECKPOINT — LARGER VISTA STILL OPEN

## Product slice

Made the authored Mangrove destination legible on ordinary biome entry.

- water-side Rootwalk torch beacon retained;
- synchronized worker/synchronous placement;
- Mangrove biome notification now reads `Entered Mangrove Lantern Rootwalk`;
- notification is tied to the production biome transition path;
- no unrelated gameplay or save changes.

## Provenance

- Product commit: `db8abdfde67b11ae9441149720b760382de03da0`
- Tag: `v1.14.0`
- Base: v1.13.9 / `49bbc4f`
- Cache chain: `main.js?v=472` → `game.js?v=461` → `world.js?v=430` → `chunk-worker.js?v=290`
- Fixed seed: `1884808540`

## Evidence

- Full smoke: PASS.
- Syntax checks: PASS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Running fixed-seed runtime: `started=true`, `biome=mangrove`, title hidden, zero page-owned errors.
- Immediate player-facing capture visibly shows `Entered Mangrove Lantern Rootwalk` over readable sky, water, terrain, and HUD.
- No black/gray renderer artifact in the accepted cue frame.

## Remaining gap

The Rootwalk geometry is implemented and mechanically reachable, but the ordinary mid-distance vista still does not expose the full bridge/lantern silhouette cleanly. This checkpoint deliberately accepts the arrival cue without claiming the final astonishing Wow-level biome presentation or AAA parity.

## Next bounded slice

Create one clean ordinary route frame where the notification leads the player toward the actual Rootwalk silhouette. Prefer correcting placement/camera readability over adding another prop.

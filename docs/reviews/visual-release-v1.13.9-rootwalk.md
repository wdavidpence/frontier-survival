# Frontier Survival v1.13.9 — stepped Rootwalk checkpoint

Decision: PUBLISHED INCREMENTAL CHECKPOINT — VISUAL FOLLOW-UP REQUIRED

## Product slice

Extended the Lantern Rootwalk from the Mangrove bank toward the open-water edge.

- seven-cell stepped plank span;
- low water-side root support;
- raised mangrove posts and lantern finial retained;
- mirrored synchronous and chunk-worker placement;
- no unrelated gameplay changes.

## Provenance

- Product commit: `38cbb360a4d7ad53446b4ce74ec748aeccd346fd`
- Tag: `v1.13.9`
- Base: v1.13.8 / `90e5b7d`
- Cache chain: `main.js?v=471` → `game.js?v=460` → `world.js?v=429` → `chunk-worker.js?v=290`
- Fixed seed: `1884808540`

## Evidence

- Full smoke: PASS.
- Syntax checks: PASS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed Start/runtime: `started=true`, title hidden, `biome=mangrove`, zero page-owned errors.
- Open-water frame retains the accepted readable sky, water, horizon, and HUD composition.

## Visual status

The stepped span improves the intended water-to-mud journey, but the wide fixed-seed frame still does not clearly expose the Rootwalk itself. This checkpoint is intentionally unverified for landmark visibility. Do not call the biome goal complete or claim AAA parity.

## Next bounded slice

Solve visibility through composition, not more structure: move the Rootwalk marker into the camera-readable open-water sightline or add a restrained destination beacon/field-note cue tied to actual approach distance. Require one stable ordinary player-height frame that shows the landmark and accepted water/horizon together.

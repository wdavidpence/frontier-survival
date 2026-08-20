# Frontier Survival — v1.13.6 Mangrove approach checkpoint

Updated: 2026-08-20

## Result

Published v1.13.6, an accepted incremental visual checkpoint that improves the Mangrove Lagoon transition from procedural chance to an authored approach shelf.

- Product commit: `90f80dc0f96ee8a77fedfe434bd37bce7bb7d392`
- Tag: `v1.13.6`
- Live: https://wdavidpence.github.io/frontier-survival/
- Clean candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Canonical checkout remains broad dirty WIP and quarantined.

## Accepted change

- Iron Ravine tropical sightline remains protected around `(42,51)`.
- Low authored Mangrove corridor spans `x=46..68`, `z=52..72` when elevation permits.
- Synchronous and worker classifiers remain mirrored.
- Cache chain: `main.js?v=468` → `game.js?v=457` → `world.js?v=426` → `biomes.js?v=250` / `chunk-worker.js?v=286`.

## Evidence

- Full smoke: PASS.
- Syntax, diff-check, parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Fixed-seed local Start: `started=true`, title hidden, zero page-owned errors.
- Controlled runtime reached `biome=mangrove` on the authored low shelf.
- Accepted local approach frame shows open water/horizon, tropical sky, readable islands, and sparse distinct mangrove silhouettes without black/gray occlusion or HUD overlap.
- Mobile not rerun for this desktop visual slice.

## Next bounded slice

Add one small authored wetland destination prop—such as a root-bridge/lantern marker—plus visible roots/channels in the open approach. Preserve the accepted water/horizon composition and rerun all release gates.

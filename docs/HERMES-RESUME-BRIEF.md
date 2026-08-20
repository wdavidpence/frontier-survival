# Frontier Survival — v1.13.5 Mangrove Lagoon checkpoint

Updated: 2026-08-20

## Result

Published v1.13.5 as an explicitly incremental Mangrove Lagoon checkpoint.

- Product commit: `ca82d080f80a7d30eb6cdfbb97eaac7891645609`
- Tag: `v1.13.5`
- Remote `origin/main`: same product commit
- Live: https://wdavidpence.github.io/frontier-survival/
- Clean candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Canonical checkout remains broad dirty WIP and quarantined; do not use it as a release base.

## Accepted product slice

- Deterministic warm Mangrove Lagoon biome adjacent to tropical coast.
- Mangrove mud, distinct log/leaf atlas tiles, sparse short grove silhouettes, root accents, tidal channels, and kelp details.
- Synchronous and chunk-worker generation mirrored.
- Authored Iron Ravine sightline preserved as tropical.
- Optional barrel-module dependency repaired with `js/utils.js`.
- Version/cache chain: `main.js?v=467` → `game.js?v=456` → `world.js?v=425` / `atlas.js?v=300` / `atlas-core.js?v=287`.

## Evidence

### Static/automated

- Touched-module syntax checks: PASS.
- `node tests/smoke.mjs`: PASS, no reported failures.
- `git diff --check`: PASS.
- Root/public HTML parity: PASS.
- Executable relative-import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.

### Local runtime

- Exact candidate served at `http://127.0.0.1:18765/`.
- Fixed seed `1884808540` Start reached `started=true`, title hidden, 1280×720 canvas, and zero page-owned errors.
- Opening frame retained readable sky, water, terrain, HUD, and Iron Ravine context.
- Runtime scan confirmed Mangrove log, leaf, and mud blocks in streamed target chunks.
- Controlled biome probe reached `Entered mangrove`.

### Live runtime

- Pages exposes v1.13.5 and all changed modules with expected markers.
- Live fixed-seed Start reached `started=true`, title hidden, seed `1884808540`, 1280×720 canvas, and zero page-owned errors.

### Mobile

- Not rerun for this desktop biome checkpoint; do not infer mobile acceptance.

## Visual limitation

The opening frame passes baseline readability, but the Mangrove Lagoon itself is not yet accepted as an astonishing Wow-level traversal. Controlled player-height frames near the deterministic grove repeatedly selected nearby opaque trunk/terrain faces instead of a clean authored wetland vista. The biome is real and shipped as an incremental checkpoint, but its ordinary approach composition still needs work.

No AAA parity claim is made.

## Next bounded slice

Create a deterministic authored Mangrove approach composition that guarantees an ordinary player-height frame with open mud/water foreground, sparse readable mangrove silhouettes in mid-distance, visible roots/tidal channels, and no giant foreground trunks. Preserve the full smoke, cache-bust, Start, live HTML, live runtime, and visual gates.

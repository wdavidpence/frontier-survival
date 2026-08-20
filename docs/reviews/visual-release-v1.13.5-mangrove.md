# Frontier Survival v1.13.5 — Mangrove Lagoon checkpoint

Decision: PUBLISHED INCREMENTAL CHECKPOINT — VISUAL FOLLOW-UP REQUIRED

## Product slice

Added a deterministic Mangrove Lagoon biome adjacent to the tropical starter geography.

- warm tidal-wetland biome classifier;
- mangrove mud surface and subsurface;
- mangrove-specific log and leaf atlas tiles;
- sparse short mangrove silhouettes;
- root accents and shallow tidal channel/kelp details;
- mirrored synchronous and chunk-worker generation;
- authored Iron Ravine sightline remains tropical and unobstructed;
- missing optional barrel helper dependency restored as `js/utils.js`.

## Release provenance

- Public version: `v1.13.5`
- Candidate base: `origin/main` at `587ccc1c732611f8d1825958b34db0c1d14bce24`
- Candidate worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Entry chain: `main.js?v=467` → `game.js?v=456` → `world.js?v=425` / `atlas.js?v=300`
- Fixed seed used: `1884808540`

## Static/automated evidence

- touched-module syntax checks: PASS;
- `node tests/smoke.mjs`: PASS, no reported failures;
- `git diff --check`: PASS;
- root/public HTML parity: PASS;
- executable relative-import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.

## Local runtime evidence

- exact candidate served at `http://127.0.0.1:18765/`;
- fixed-seed Start reached `started=true`;
- title screen hidden;
- seed `1884808540` loaded;
- zero page-owned runtime errors;
- opening frame retained readable sky, water, terrain, HUD, and authored destination context.

## Mangrove reachability evidence

- deterministic probe `biomeAt(55, 58, 1884808540) === BIOME.MANGROVE`;
- route probe `biomeAt(42, 51, 1884808540) === BIOME.TROPICAL`;
- runtime scan found mangrove log, leaf, and mud block IDs in streamed target chunks;
- field-note transition reached `Entered mangrove` in the controlled browser session.

## Visual limitation

The opening frame passes the baseline readability gate, but the Mangrove Lagoon feature itself is not yet visually accepted as a Wow-level traversal. Controlled frames near the deterministic grove repeatedly selected views dominated by nearby opaque trunk/terrain faces. The biome is implemented and materially distinct in source/runtime, but the current approach composition does not reliably present it as an authored wetland vista.

No AAA parity claim is made. This release is an incremental public checkpoint, not the completed biome goal.

## Next release gate

Create a deterministic authored approach/composition for the Mangrove Lagoon that guarantees an ordinary player-height frame with:

- open water/mud foreground;
- sparse, readable mangrove silhouettes in the mid-distance;
- visible roots and tidal channels;
- no giant foreground trunks or terrain occlusion;
- zero runtime errors and the same full release checks.

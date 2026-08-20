# Frontier Survival v1.13.6 — Mangrove approach composition

Decision: ACCEPTED INCREMENTAL VISUAL CHECKPOINT

## Product slice

Improved the Mangrove Lagoon transition from procedural chance to an authored approach shelf.

- preserved Iron Ravine tropical sightline around `(42, 51)`;
- authored Mangrove corridor spans the low tropical shelf around `x=46..68`, `z=52..72` where terrain elevation permits;
- corridor uses sparse grove density and existing mangrove mud/root/channel presentation;
- mirrored biome classifier logic in `biomes.js` and `chunk-worker.js`;
- no unrelated gameplay or save changes.

## Provenance

- Public version: `v1.13.6`
- Base: v1.13.5 / `225f15494920f3586a73c57f31883b05c4ce5a9a`
- Entry chain: `main.js?v=468` → `game.js?v=457` → `world.js?v=426` → `biomes.js?v=250` / `chunk-worker.js?v=286`
- Fixed seed: `1884808540`

## Evidence

- `node tests/smoke.mjs`: PASS;
- syntax checks: PASS;
- `git diff --check`: PASS;
- root/public parity: PASS;
- executable import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries;
- local Start: `started=true`, title hidden, zero page-owned errors;
- controlled runtime reached `biome=mangrove` on the authored low shelf;
- accepted approach frame: open water and horizon, tropical sky, readable island silhouettes, sparse distinct mangrove trunks/canopy at right, no black/gray renderer artifact or HUD/world overlap.

This remains an incremental checkpoint, not a claim of AAA parity. The next visual gap is richer wetland dressing—visible roots, channels, and a small authored destination prop—without losing the open approach composition.

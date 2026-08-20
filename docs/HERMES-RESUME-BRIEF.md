# Frontier Survival — v1.13.9 stepped Rootwalk checkpoint

Updated: 2026-08-20

## Result

Published v1.13.9 as an incremental stepped Rootwalk checkpoint.

- Product commit: `38cbb360a4d7ad53446b4ce74ec748aeccd346fd`
- Tag: `v1.13.9`
- Live: https://wdavidpence.github.io/frontier-survival/
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Canonical checkout remains broad dirty WIP and quarantined.

## Accepted mechanically

- Water-to-mud stepped plank span added to the authored Mangrove destination.
- Root support and raised lantern finial mirrored in sync/worker generation.
- Cache chain: `main.js?v=471` → `game.js?v=460` → `world.js?v=429` → `chunk-worker.js?v=290`.
- Smoke, syntax, diff-check, parity, and import audit pass.
- Local fixed-seed Start reaches `started=true`, title hidden, `biome=mangrove`, and zero page-owned errors.

## Visual limitation

The accepted open-water composition remains intact, but the Rootwalk is still not clearly exposed in the wide frame. The next pass must solve landmark visibility through camera-readable placement or a restrained beacon/approach cue, not more hidden geometry.

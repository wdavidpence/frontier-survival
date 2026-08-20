# Frontier Survival — v1.13.8 raised Rootwalk checkpoint

Updated: 2026-08-20

## Result

Published v1.13.8 as an incremental Rootwalk-lantern checkpoint on top of the accepted v1.13.6 Mangrove approach composition.

- Product commit: `1d88ee6caae3d1e9920cc6aa4ba68a342abde041`
- Tag: `v1.13.8`
- Live: https://wdavidpence.github.io/frontier-survival/
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Canonical checkout remains broad dirty WIP and quarantined.

## Accepted mechanically

- Raised Mangrove Rootwalk log/torch finial and leaf halo.
- Sync/worker placement mirrored.
- Cache chain: `main.js?v=470` → `game.js?v=459` → `world.js?v=428` → `chunk-worker.js?v=289`.
- Smoke, syntax, diff-check, parity, and import audit pass.
- Live v1.13.8 Start reaches `started=true`, title hidden, fixed seed `1884808540`, 1280×720 canvas, and zero page-owned errors.

## Visual limitation

The open-water approach remains readable, but the Rootwalk itself is not yet visually accepted because the wide frame does not clearly expose the finial and close frames have been occluded or unstable.

## Next bounded slice

Move the Rootwalk one or two cells toward the open-water edge if needed, then obtain one stable ordinary player-height mid-distance frame showing the prop and the accepted water/horizon composition together.

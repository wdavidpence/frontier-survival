# Frontier Survival — v1.14.6 channel ecology checkpoint

Updated: 2026-08-21

## Current live candidate

v1.14.6 adds the second cohesive Mangrove ecology pass around the accepted Rootwalk.

- four authored channel clusters beside the bridge;
- KELP depth below the waterline;
- SEAGRASS cluster tips;
- emergent SEAGRASS at the surface-plus-one waterline cell;
- sync/worker parity retained;
- bridge, fireflies, route, and collision unchanged.

## Release state

- Product commit: `07e901b62b5bf0079ae2b672ffa8543f0df8f15e`
- Tag: `v1.14.6`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=478` → `game.js?v=467` → `world.js?v=435` → `chunk-worker.js?v=295`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Visual judgment

The clean primary frame preserves the accepted Rootwalk composition. A supplemental channel angle visibly shows restrained emergent green seagrass at the waterline. The water/horizon, HUD, bridge, lantern, and fireflies remain readable with no renderer regression.

## Next bounded slice

Add one wet-mud/shore material variation around the accepted channel, then repeat the same fixed-seed local/live gates.

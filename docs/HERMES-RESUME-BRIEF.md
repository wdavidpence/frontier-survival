# Frontier Survival — v1.14.7 wet-mud landfall checkpoint

Updated: 2026-08-21

## Current live candidate

v1.14.7 adds a compact authored wet-mud contrast patch at the Mangrove Lantern Rootwalk landfall.

- three deterministic candidate cells;
- replacement only when existing material is Mangrove mud, dirt, or sand;
- sync/worker parity;
- bridge, fireflies, seagrass, route, and collision unchanged.

## Release state

- Product commit: `b3361e60b253292d1c02615708e4c3a95b3de9b9`
- Tag: `v1.14.7`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=479` → `game.js?v=468` → `world.js?v=436` → `chunk-worker.js?v=296`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Visual judgment

Clean fixed-seed local runtime remains readable: Rootwalk bridge, lanterns, firefly glints, emergent seagrass, water/horizon, and HUD all survive. The DAMP_SOIL patch is a safe, subtle dark-wet landing contrast with no black/gray artifact or giant occlusion.

## Next bounded slice

Advance atmosphere with a restrained dusk/night wetland reveal around the existing Rootwalk. Preserve daytime readability and reuse the fixed-seed evidence points.

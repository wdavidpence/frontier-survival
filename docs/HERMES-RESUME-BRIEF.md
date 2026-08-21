# Frontier Survival — v1.16.9 mudskipper-ecology checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.9 adds two authored Mangrove mudskippers at the channel edge.

- warm mud/ochre low-poly silhouettes;
- dusk/night-only, 18-block proximity gate;
- deterministic staggered hops up to `0.24` blocks;
- one localized hop ripple per active jump;
- bridge, lantern, fireflies, moths, frogs, crabs, crab flecks, dynamic crab water response, skitter audio, reflection/foam, and HUD preserved.

## Release state

- Product commit: `8fd350619f42037411d33bba5c591d13a2d4bddb`
- Documentation commit: recorded below
- Tag: `v1.16.9`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=501` → `game.js?v=490` → `fx.js?v=264`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live runtime showed two visible mudskippers, one active hop at `y=17.252`, and one localized hop ripple with zero errors. Controlled supplemental crop showed the new silhouettes integrated into the existing lower-center ecology cluster without route or HUD occlusion. Daytime hid both skippers and ripples.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

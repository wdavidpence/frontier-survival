# Frontier Survival — v1.17.2 mudskipper-feeding checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.2 gives the two authored Mangrove mudskippers a deterministic feeding pause at their wet-mud spots.

- staggered `0.8s` feeding windows;
- active only within 18 blocks;
- small head dip/body pause;
- one tiny reused surface dimple;
- bridge, lantern, fireflies, moths, frogs, crabs, mudskippers, crab water response, flecks, splash audio, reflection/foam, and HUD preserved.

## Release state

- Product commit: `3e777df687924a173963d06ad22f14bde7a480c2`
- Documentation commit: recorded below
- Tag: `v1.17.2`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=504` → `game.js?v=493` → `fx.js?v=267`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live outer-ring context produced feeding `0` and no ripple. Local and live near-channel context produced feeding `1`, alert `0.871`, and one ripple with zero errors. Clean ordinary Rootwalk night frames passed visual review. A close-camera supplemental angle was rejected for dark cliff occlusion and is not release evidence. Daytime hid all mudskipper state.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

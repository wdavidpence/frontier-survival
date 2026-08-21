# Frontier Survival — v1.16.1 directional frog-chorus checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.1 gives the Mangrove frog chorus directional stereo placement.

- lateral player offset maps to `frogPan` in `[-1, +1]`;
- second note narrows the spread;
- native `StereoPannerNode` with mono fallback;
- distance falloff, night/near-water/dead gates preserved;
- bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `aa39b1746bad0e7117da78a26bdf2797fd1bdddb`
- Tag: `v1.16.1`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=493` → `game.js?v=482` → `audio.js?v=224`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local probe confirms `frogPan=-1/0/+1` for left/center/right lateral positions, unchanged chorus strength, native stereo support, and zero errors. Clean local night screenshot has no visual regression.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial water/fauna audio while preserving accepted Rootwalk gates.

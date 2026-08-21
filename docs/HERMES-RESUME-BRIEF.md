# Frontier Survival — v1.16.0 spatial frog-chorus checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.0 spatializes the Mangrove frog chorus by fading it with Rootwalk distance.

- 22-block linear falloff;
- full direct-call default preserved;
- night + near-water gating preserved;
- dead state silences chorus;
- bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `e2be777a3b5a28388ecbe87351a3ffea72b62e2d`
- Tag: `v1.16.0`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=492` → `game.js?v=481` → `audio.js?v=223`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Night near-water mix probe: frog `0.2970` at distance `1.58`, `0` at distance `22`, `0` outside Mangrove, and `0` dead. Zero errors. Clean local night frame shows no visual regression.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial water/fauna audio while preserving accepted Rootwalk gates.

# Frontier Survival — v1.16.3 crab-scuttle checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.3 gives the authored Rootwalk crabs a close-range player response.

- seven-block alert falloff;
- sideways scuttle away from player;
- response yaw/tilt;
- existing idle sidestep preserved;
- dusk/night-only visibility preserved;
- bridge, lantern, fireflies, moths, frogs, frog audio, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `89179bc2fa702ac5cf1790e42f7cdccbb214a766`
- Tag: `v1.16.3`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=495` → `game.js?v=484` → `fx.js?v=258`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Far/near local production-tick comparison showed crab position deltas `[+0.266, +0.212, -0.187]` and close-response rotations. Clean primary night frame remained readable; daytime hid crabs and frogs with zero errors.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

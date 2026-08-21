# Frontier Survival — v1.16.4 crab-freeze checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.4 adds a brief close-approach freeze to the authored Rootwalk crabs.

- five-block freeze falloff;
- scuttle displacement suppression up to 85%;
- small body tilt during pause;
- seven-block flee/scuttle preserved;
- dusk/night-only visibility preserved;
- bridge, lantern, fireflies, moths, frogs, frog audio, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `463e96d5ac2c8bc925d7099e058fc94c720b0c34`
- Tag: `v1.16.4`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=496` → `game.js?v=485` → `fx.js?v=259`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live freeze/movement phases produced first-crab positions `51.684 → 51.901` with response tilt `0.22 → 0.149`. Clean live primary night frame remained readable; live daytime hid crabs and frogs with zero errors.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

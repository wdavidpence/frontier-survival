# Frontier Survival — v1.16.2 crab-ecology checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.2 adds three sparse authored Mangrove crabs along the Rootwalk channel edge.

- small warm clay/orange low-poly silhouettes;
- deterministic sideways drift and tilt;
- dusk/night-only visibility;
- contrast correction with unlit translucent materials;
- bridge, lantern, fireflies, moths, frogs, frog audio, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `e6eb162000a5792efc0b884b52f77276e8cfecc6`
- Tag: `v1.16.2`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=494` → `game.js?v=483` → `fx.js?v=257`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Night fixed-seed runtime: three crabs visible, drift within authored bounds, zero errors. Supplemental frame makes them distinguishable without clutter; primary frame keeps them subordinate to the Rootwalk. Daytime hides crabs and frogs with zero errors.

## Next bounded slice

Advance Mangrove toward richer authored ecology, spatial audio, or authored wildlife behavior while preserving accepted Rootwalk gates.

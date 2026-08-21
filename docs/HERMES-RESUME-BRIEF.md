# Frontier Survival — v1.14.8 dusk firefly checkpoint

Updated: 2026-08-21

## Current live candidate

v1.14.8 adds the first clock-responsive Mangrove night reveal around the Lantern Rootwalk.

- daytime firefly baseline unchanged;
- dusk/night point size and opacity lift;
- bridge, lantern, seagrass, wet mud, route, and collision unchanged.

## Release state

- Product commit: `80cc33942c8a882f60e0568fc5c9c2da3b240558`
- Tag: `v1.14.8`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=480` → `game.js?v=469` → `fx.js?v=248`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Visual judgment

Daytime baseline remains intact. At forced dusk (`dayPhase≈0.555`), the sky shifts blue/pink, the Rootwalk remains readable, and the fireflies strengthen without creating clutter or renderer artifacts. At forced night (`dayPhase≈0.625`), the scene is darker but still playable with moon/stars, lantern, bridge silhouette, water, seagrass, HUD, and the stronger constellation visible.

## Next bounded slice

Add one restrained authored nocturnal wetland cue—small bat/moth pass or lantern reflection/foam—while preserving daytime and dusk evidence.

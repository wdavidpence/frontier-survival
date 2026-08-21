# Frontier Survival — v1.15.5 frog-hop checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.5 upgrades the three Rootwalk frogs with staggered proximity-driven hops.

- seven-second phase;
- `0.72s` hop window;
- `0.28` block peak;
- active within `16` blocks;
- dusk/night visibility only;
- frog chorus, bridge, lantern, fireflies, moths, water response, seagrass, wet mud, and HUD preserved.

## Release state

- Product commit: `e7f95075c06ede194257a5efd0077a09eaf9cf5f`
- Tag: `v1.15.5`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=487` → `game.js?v=476` → `fx.js?v=254`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Timed local samples prove actual hop motion: a frog moved from `17.275` to `17.465` during a proximity hop. Daytime hides all frogs and disables frog audio. Night retains three visible frogs and `frog=0.32` audio mix.

## Next bounded slice

Add one more cohesive authored Mangrove fauna behavior or interaction cue while preserving Rootwalk day/dusk/night visuals and frog-audio gates.

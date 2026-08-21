# Frontier Survival — v1.15.6 frog-awareness checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.6 adds player awareness to the Rootwalk frogs.

- within 14 blocks, frogs partially turn toward the player;
- eye glints pulse while alert;
- existing 16-block staggered hops remain;
- dusk/night-only behavior;
- day hides frogs and disables frog audio;
- bridge, lantern, fireflies, moths, water response, seagrass, wet mud, and HUD preserved.

## Release state

- Product commit: `9fa4173cd39ab3521fd7621dd4010d78e1f631d0`
- Tag: `v1.15.6`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=488` → `game.js?v=477` → `fx.js?v=255`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local night accepted land position: three frogs visible, eye opacity `0.9507`, player-aware rotations recorded, one frog at `y=17.494`, frog audio `0.32`, zero errors.

Local daytime: frogs hidden, eye opacity `0`, frog audio `0`, birds `0.55`, zero errors.

Clean night frame preserves the accepted Rootwalk composition with the player-aware fauna cue remaining small and localized.

## Next bounded slice

Add one more authored Mangrove fauna interaction cue while preserving Rootwalk day/dusk/night visuals and frog-audio gate.

# Frontier Survival — v1.15.4 frog fauna checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.4 adds three tiny authored frog silhouettes beside the Mangrove Rootwalk channel.

- dark green low-poly bodies;
- lighter bellies;
- pale-gold eye glints with dark pupils;
- idle bob and slight rotation;
- dusk/night visibility only inside the existing Rootwalk radius;
- preserves v1.15.3 frog chorus audio behavior.

## Release state

- Product commit: `6aa20acb64e8bb96dd3248cd9ba3de8b41fe1078`
- Tag: `v1.15.4`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=486` → `game.js?v=475` → `fx.js?v=253`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local fixed-seed night evidence: three frog groups visible, frog audio `0.32`, fireflies/moths/water response active, zero errors.

Local fixed-seed day evidence: three groups allocated but hidden, frog audio `0`, birds `0.55`, zero errors.

Clean night screenshot preserves bridge, lantern, water, moths, fireflies, seagrass, and HUD while adding a restrained small frog cluster at the channel.

## Next bounded slice

Add one more cohesive authored Mangrove fauna behavior or interaction cue while preserving Rootwalk day/dusk/night visuals and frog-audio gates.

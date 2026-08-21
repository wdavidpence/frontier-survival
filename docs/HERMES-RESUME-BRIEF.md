# Frontier Survival — v1.15.3 frog chorus checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.3 adds a sparse authored Mangrove frog chorus to the Rootwalk near-water night soundscape.

- low-gain triangle chirps;
- 5–13 second interval;
- existing AudioBus voice cap;
- night + near-water + Rootwalk radius only;
- day disables frogs and restores birds;
- Rootwalk surface probe at `y=16` accounts for the land player standing around `y=18`.

## Release state

- Product commit: `e777ca965bef8db1408011b234ac509ae12a4863`
- Tag: `v1.15.3`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=485` → `game.js?v=474` → `audio.js?v=222`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local fixed-seed landfall verification:

- night: `frog=0.32`, `water=0.18`, AudioContext running, chorus timer active, zero errors;
- day: `frog=0`, `birds=0.55`, `water=0.18`, AudioContext running, zero errors;
- direct timer-zero test produced one active capped oscillator voice.

## Next bounded slice

Advance authored Mangrove fauna behavior or silhouette while preserving Rootwalk day/dusk/night visuals and frog audio gates.

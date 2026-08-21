# Frontier Survival v1.17.7 — dragonfly-ripple checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.7 makes dragonfly skim dimples decay as short water-contact pulses and isolates each ripple material.

- hit opacity `[0.16,0]` for the two independent dimples;
- quiet `0.1s` tick lingers at `[0.115,0]`;
- after `0.3s` decay both are `[0,0]` and hidden;
- existing day/dusk visibility, nighttime suppression, feeding/skimming, mudskipper feeding dimple, hops, dart, splash audio, crab water response, bridge, lantern, water, horizon, seagrass, and HUD preserved.

## Release state

- Product commit: `b7457cde273c9cc7cc9f5917e2a843b6ad7f7037`
- Documentation commit: recorded below
- Tag: `v1.17.7`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=509` → `game.js?v=498` → `fx.js?v=272`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live Pages both passed the authoritative hit/linger/gone probe:

- hit: pulse `[0.9999,0]`, visible `1`, opacities `[0.16,0]`;
- quiet `0.1s` tick: pulse `[0.7199,0]`, visible `1`, opacities `[0.115,0]`;
- after `0.3s` decay: pulse `[0,0]`, visible `0`, opacities `[0,0]`;
- live title `Frontier Survival v1.17.7`;
- live `started=true`, seed `1884808540`, 1280×720 canvas;
- zero page-owned errors;
- clean live daytime primary frame passed visual review with no bridge, water, horizon, seagrass, HUD, or renderer regression.

## Pause point

The Mangrove sprint is intentionally paused here at a clean, published checkpoint. Do not begin another feature slice until the user starts a new session/resume instruction.

## Resume slice

When resumed, advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates. Premium gaps remain deeper AI, navigation/feeding/predator-prey simulation, broader species variety, true HRTF/occlusion/reverb, and richer ecological storytelling density.

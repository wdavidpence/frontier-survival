# Frontier Survival — v1.17.7 dragonfly-ripple checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.7 makes dragonfly skim dimples decay as short water-contact pulses and isolates each ripple material.

- hit opacity `[0.16,0]` for the two independent dimples;
- quiet `0.1s` tick lingers at `[0.115,0]`;
- after `0.3s` decay both are `[0,0]` and hidden;
- existing day/dusk visibility, nighttime suppression, feeding/skimming, mudskipper dimple, hops, dart, splash audio, crab water response, bridge, lantern, water, horizon, seagrass, and HUD preserved.

## Release state

- Product commit: `b7457cde273c9cc7cc9f5917e2a843b6ad7f7037`
- Documentation commit: recorded below
- Tag: `v1.17.7`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=509` → `game.js?v=498` → `fx.js?v=272`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

The shared-material regression was caught and corrected before publication. Local clean primary visual passed; next live gate is Pages propagation plus the same hit/linger/gone runtime probe.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

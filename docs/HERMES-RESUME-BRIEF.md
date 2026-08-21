# Frontier Survival — v1.17.4 dragonfly-feeding checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.4 connects the two authored daytime dragonflies to the mudskipper feeding signal.

- feeding cue `1` lowers both dragonflies by `0.08` blocks;
- synchronized pitch/dip `0.14` radians;
- idle hover remains unchanged;
- day/dusk visibility, six-block scatter, nighttime suppression, mudskipper feeding dimple, hops, dart, and splash audio preserved.

## Release state

- Product commit: `cb488983086abf7805c78383105f6ae02ac079f`
- Documentation commit: recorded below
- Tag: `v1.17.4`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=506` → `game.js?v=495` → `fx.js?v=269`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local idle dragonflies were y `[17.605,17.649]` with zero cue; feeding signal moved them to `[17.525,17.569]` with synchronized rotation x `[0.14,0.14]`. Clean daytime primary visual passed with no regression.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

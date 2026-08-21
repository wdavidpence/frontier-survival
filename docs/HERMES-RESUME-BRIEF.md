# Frontier Survival — v1.17.3 dragonfly checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.3 adds two authored cyan dragonflies over the Mangrove shallow channel.

- day/dusk-only (`nightMix < 0.65`);
- deterministic hover, wing flap, and channel drift;
- six-block player scatter response;
- two fixed authored positions;
- bridge, lantern, water, horizon, seagrass, frogs, crabs, mudskippers, crab water response, splash audio, reflection/foam, and HUD preserved.

## Release state

- Product commit: `0b8a002e1d64d91409eef771252ef061785f2c20`
- Documentation commit: recorded below
- Tag: `v1.17.3`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=505` → `game.js?v=494` → `fx.js?v=268`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live runtime showed two day dragonflies, near-player scatter `0.879`, and complete nighttime suppression. Clean local and live daytime primary visuals passed; lower-center crop showed two small cyan winged motifs over the channel without route or HUD overlap.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

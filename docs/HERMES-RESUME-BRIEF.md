# Frontier Survival — v1.17.8 dragonfly-perch checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.8 adds a deterministic authored perch window for the first Mangrove dragonfly.

- ordinary route perch `1`, scatter `0`;
- feeding suppresses perch to `0`;
- close-player scatter suppresses perch to `0`;
- existing feeding/skim/ripple, mudskipper, audio, water, bridge, lantern, horizon, seagrass, HUD, and night gates preserved.

## Release state

- Product commit: `d4020b0dc75fb900c2d4c6347255fa89e9350d50`
- Documentation commit: recorded below
- Tag: `v1.17.8`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=510` → `game.js?v=499` → `fx.js?v=273`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live ordinary/feeding/close probes passed with zero errors. Clean local and live daytime primary visuals passed with no regression or clutter.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

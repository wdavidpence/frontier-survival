# Frontier Survival — v1.15.9 approach-water checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.9 makes the shallow-channel water response react subtly to player approach.

- approach measured against authored water cell `(54,58)`;
- 12-block falloff;
- near landing, foam gains up to `0.025` opacity;
- night reflection gains up to `0.05` opacity;
- reflection/foam scale expands slightly;
- daytime reflection remains hidden and foam stays low;
- bridge, lantern, fireflies, moths, frogs, frog audio, seagrass, and HUD preserved.

## Release state

- Product commit: `5ea3aaaa91e2b7850f3ac48b4bb1ef96e1eabea2`
- Tag: `v1.15.9`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=491` → `game.js?v=480` → `fx.js?v=258`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Night near/far probe: reflection `0.47 → 0.42`, foam `0.145 → 0.12`, bounded scale increase, zero errors. Daytime: reflection hidden, foam `0.0515`, zero errors.

Clean local night frame remains readable with no over-brightening or clutter.

## Next bounded slice

Add one further authored Mangrove environmental interaction while preserving Rootwalk visual/audio gates.

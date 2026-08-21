# Frontier Survival — v1.14.9 nocturnal moth checkpoint

Updated: 2026-08-21

## Current live candidate

v1.14.9 adds six low-opacity pale moth motes around the Mangrove Lantern Rootwalk.

- daytime hidden;
- dusk/night visible only after `nightMix > 0.18`;
- independent subtle flutter;
- sync/game FX path retained;
- bridge, lanterns, fireflies, seagrass, wet mud, route, and collision unchanged.

## Release state

- Product commit: `6eafca216963ac5556b87569ebcf92199d96aef6`
- Tag: `v1.14.9`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=481` → `game.js?v=470` → `fx.js?v=249`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Visual judgment

Daytime runtime confirms moths hidden. Night runtime confirms moths visible at size `0.12` and opacity `0.44`. The night frame reads as a restrained nocturnal wetland cue without clutter, bridge/lantern loss, HUD overlap, or renderer artifact.

## Next bounded slice

Advance water response with a small Rootwalk lantern reflection/foam cue while preserving daytime, dusk, and night evidence.

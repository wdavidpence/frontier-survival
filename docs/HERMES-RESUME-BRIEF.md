# Frontier Survival — v1.15.1 water response checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.1 adds a Rootwalk lantern reflection/foam response at the center of verified open-water cell `(54,58)`.

- dusk/night amber reflection ring;
- low-opacity pale foam ring;
- additive depth-independent materials;
- subtle pulse;
- day hides reflection while retaining subtle foam;
- bridge, lanterns, fireflies, moths, seagrass, wet mud, route, and collision unchanged.

## Release state

- Product commit: `7e6907197fe2c8b425270f928b555a5a23d4cd31`
- Tag: `v1.15.1`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=483` → `game.js?v=472` → `fx.js?v=251`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Visual judgment

The first half-cell placement was rejected because it visually landed on the shoreline boundary. The final integer cell-center placement plus depth-independent material is accepted: the supplemental night frame visibly shows the cue in blue channel water, while the primary night frame preserves the Rootwalk silhouette, lantern, fireflies, moths, water, seagrass, and HUD.

Daytime state confirms `reflection=false`, subtle foam active, and zero page-owned errors.

## Next bounded slice

Advance authored Mangrove fauna or soundscape while preserving the accepted Rootwalk day/dusk/night evidence.

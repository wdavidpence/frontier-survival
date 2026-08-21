# Frontier Survival — v1.15.7 frog-ripple checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.7 connects frog hops to the shallow-channel water response.

- pale-green ring per frog;
- visible only during the `0.72s` hop window;
- peak opacity approximately `0.075`;
- modest expansion with hop height;
- water-surface placement at local `y=-1.15`, world `y≈16.05`;
- bridge, lantern, fireflies, moths, seagrass, water reflection, frog audio, and HUD preserved.

## Release state

- Product commit: `3b270a0dcce8e3d5cd7886cd8187ef79d4218ba1`
- Tag: `v1.15.7`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=489` → `game.js?v=478` → `fx.js?v=256`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Deterministic local night proof: one ripple visible at opacity `0.0745`, frog at `y=17.455`, projected ripple around screen `(701,566)`, zero errors.

Pixel proof confirms a distinct small pale-green ring in the water, subordinate to the larger lantern reflection and free of HUD/renderer regression.

## Next bounded slice

Advance Mangrove toward richer fauna behavior or water/sound interaction while preserving accepted Rootwalk gates.

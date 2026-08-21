# Frontier Survival — v1.14.3 firefly ecology checkpoint

Updated: 2026-08-21

## Current candidate

v1.14.3 adds the first cohesive ecology/atmosphere pass around the accepted Mangrove Rootwalk.

- 18 deterministic warm additive fireflies;
- Rootwalk-centered activation radius of 22 blocks;
- fixed anchor `(55.5,20.2,58.5)`;
- subtle pulse/drift;
- no gameplay/collision changes.

## Release state

- Product candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Base live release: v1.14.2 / `46a3031`
- Cache chain: `main.js?v=475` → `game.js?v=464` → `fx.js?v=247`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.
- Local fixed-seed Rootwalk frame passes with `started=true`, `onGround=true`, visible firefly FX, and zero page-owned errors.

## Visual judgment

The accepted land-side bridge/lantern/water frame remains readable. Firefly glints add a restrained wetland-nightlife cue without clutter, black/gray artifacts, HUD overlap, or foreground regression.

## Next bounded slice

Add one authored shallow-channel ecology detail pass—reeds/kelp clusters or reflective wet mud—without changing the accepted Rootwalk composition.

# Frontier Survival — v1.14.2 accepted Rootwalk vista / next ecology pass

Updated: 2026-08-21

## Current live release

- Live: `v1.14.2`
- Product commit: `46a3031244846c4aa8258c698a47e829ada346c7`
- Tag: `v1.14.2`
- Live URL: https://wdavidpence.github.io/frontier-survival/
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`

## Accepted Rootwalk vista

The first clean ordinary land-side mid-distance frame is accepted on both local and live Pages:

- fixed seed `1884808540`;
- position `(47.5,19.0001,47.5)`;
- yaw `-2.51`;
- `onGround=true`;
- tropical approach facing the Mangrove Rootwalk;
- full plank staircase/deck, elevated torch, water edge, distant horizon, readable HUD;
- zero page-owned runtime errors.

Runtime scan proved the approach cell had direct center support, 3×3×6 headroom, and zero ray blockage to the destination. This closes the active `rootwalk-vista` slice.

## Release gates

Smoke, syntax, diff-check, root/public parity, 125-edge import audit, local Start/runtime, and live Pages Start/runtime all pass.

## Honest maturity status

The new biome is now an authored, navigable, player-readable destination checkpoint. It is not complete at literal AAA parity or the final astonishing Wow bar. Remaining gaps are richer Mangrove ecology, wetland material variation, and cinematic atmosphere.

## Next bounded slice

Add one cohesive wetland ecology/atmosphere pass around the accepted Rootwalk route. Preserve the land-side composition and reuse the fixed-seed evidence points; do not regress the clean bridge/lantern/water frame.

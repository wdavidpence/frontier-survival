# Frontier Survival — v1.16.5 crab-fleck checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.5 connects close crab scuttle to a tiny shoreline disturbance.

- two small lifted tan flecks per crab;
- close-pulse-only visibility;
- flecks disappear in quiet phase and daytime;
- existing crab freeze/scuttle and dusk/night gates preserved;
- bridge, lantern, fireflies, moths, frogs, frog audio, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `887fa9a61cd08ae9ef44ed21f5a9a71ca070672a`
- Tag: `v1.16.5`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=497` → `game.js?v=486` → `fx.js?v=260`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Night pulse counts were `[2,2,0]` locally and four active flecks live across close groups. Quiet counts were `[0,0,0]`. Corrected supplemental frame makes the flecks readable without clutter; clean primary night and live daytime gates pass with zero errors.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

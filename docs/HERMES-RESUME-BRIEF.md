# Frontier Survival — v1.16.7 crab-water-ripple checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.7 connects close authored crab scuttles to a localized shallow-channel water ripple.

- reuses `MangroveWaterFX`;
- one pale-green additive ring at `(52.3,17.13,59.4)`;
- visible only above scuttle pulse `0.62` and nocturnal Rootwalk gating;
- final ring is at the established visible waterline `y=17.13`;
- quiet/daytime hidden;
- bridge, lantern, fireflies, moths, frogs, crab flecks, skitter audio, water reflection/foam, and HUD preserved.

## Release state

- Product commit: `b2329e6bbff8a4d7962860145d65912b0ffcc33a`
- Tag: `v1.16.7`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=499` → `game.js?v=488` → `fx.js?v=262`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local close pulse `0.8226` produced a visible ring at the authored waterline; quiet pulse `0.5686` hid it and reset opacity to zero. Final frozen proof crop showed the pale-green ring separate from the larger lantern ring without clutter or renderer regression.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

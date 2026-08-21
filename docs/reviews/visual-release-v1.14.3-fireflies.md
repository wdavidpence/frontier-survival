# Frontier Survival v1.14.3 — Mangrove firefly ecology checkpoint

Decision: ACCEPTED INCREMENTAL VISUAL CHECKPOINT — LARGER AAA ECOLOGY PASS STILL OPEN

## Product slice

Added a restrained, deterministic Mangrove firefly constellation around the Lantern Rootwalk.

- 18 warm additive points;
- fixed Rootwalk anchor at `(55.5,20.2,58.5)`;
- subtle vertical/horizontal drift and synchronized pulse;
- active only within 22 blocks of the authored destination;
- no collision, terrain, or bridge geometry changes;
- production import/call path wired through `game.js` and `fx.js`.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Fixed seed: `1884808540`
- Intended product version: `v1.14.3`
- Cache chain: `main.js?v=475` → `game.js?v=464` → `fx.js?v=247`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for `fx.js`, `game.js`, `main.js`.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local runtime: `started=true`, fixed seed, `onGround=true` at `(47.5,19.0001,47.5)`, `fireflyFx.points.visible=true`, count `18`, zero page-owned errors.
- Local frame preserves the accepted Rootwalk bridge/stairs, elevated torch, water/horizon, tropical approach, and readable HUD.
- Warm glints add wetland atmosphere without noisy clutter, black/gray occlusion, or HUD overlap.

## Honest limitation

This is a focused ecology checkpoint, not final AAA parity. Remaining gaps include richer Mangrove fauna, water/mud material variation, soundscape, and a more cinematic day/night wetland presentation.

## Next bounded slice

Add one authored shallow-channel ecology detail pass—reeds/kelp clusters or reflective wet mud—around the accepted route, preserving the current bridge and firefly composition.

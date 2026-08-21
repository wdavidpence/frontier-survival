# Frontier Survival v1.14.8 — Mangrove dusk firefly reveal

Decision: ACCEPTED INCREMENTAL ATMOSPHERE CHECKPOINT — FINAL AAA ATMOSPHERE STILL OPEN

## Product slice

Made the existing Rootwalk firefly constellation respond to the game clock.

- daytime baseline remains `size=0.14`;
- dusk/night scales the points up to `size=0.21`;
- dusk/night adds a restrained opacity lift;
- activation radius, anchor, movement, bridge, seagrass, wet mud, and collision unchanged;
- no renderer-wide lighting rewrite.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `80cc33942c8a882f60e0568fc5c9c2da3b240558`
- Tag: `v1.14.8`
- Cache chain: `main.js?v=480` → `game.js?v=469` → `fx.js?v=248`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local daytime baseline: fixed seed `1884808540`, `started=true`, Rootwalk frame preserved, fireflies at daytime size `0.14`, zero page-owned errors.
- Local forced dusk: `dayPhase≈0.555`, night state active, firefly size `0.172`, opacity `≈0.855`, zero page-owned errors.
- Local forced night: `dayPhase≈0.625`, `night=true`, firefly size `0.21`, opacity `≈0.96`, visible constellation, zero page-owned errors.
- Dusk frame: blue/pink sky transition, readable Rootwalk lantern/bridge silhouette, water/seagrass/HUD retained, no new black/gray artifact or clutter.

## Honest limitation

This is an atmosphere checkpoint, not final AAA parity. The Mangrove still needs richer fauna, water reflection/foam, soundscape, and more authored night-specific wetland detail. The existing moon/night presentation remains stylized and should not be described as cinematic AAA lighting.

## Next bounded slice

Add one restrained authored nocturnal wetland cue—such as a small bat/moth pass or lantern-reflection/foam cue—only after preserving both daytime and dusk evidence.

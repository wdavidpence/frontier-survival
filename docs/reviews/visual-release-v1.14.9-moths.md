# Frontier Survival v1.14.9 — Mangrove nocturnal moth cue

Decision: ACCEPTED INCREMENTAL ATMOSPHERE CHECKPOINT — PREMIUM NIGHT ECOLOGY STILL OPEN

## Product slice

Added six restrained pale moth motes around the Lantern Rootwalk.

- hidden during daytime;
- fade in after dusk when `nightMix > 0.18`;
- low-opacity additive material;
- subtle independent flutter path;
- Rootwalk radius, bridge, lanterns, fireflies, seagrass, wet mud, route, and collision unchanged;
- production import/call path wired through `game.js` and `fx.js`.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `6eafca216963ac5556b87569ebcf92199d96aef6`
- Tag: `v1.14.9`
- Cache chain: `main.js?v=481` → `game.js?v=470` → `fx.js?v=249`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local daytime runtime: `started=true`, fixed seed, moths hidden, fireflies visible after settle, zero page-owned errors.
- Local night runtime: `dayPhase≈0.630`, `night=true`, moths visible, moth size `0.12`, opacity `0.44`, fireflies visible, zero page-owned errors.
- Night frame: moths read as sparse pale motes; Rootwalk bridge/lantern, water/seagrass, HUD, and renderer remain healthy without clutter.

## Honest limitation

This is a restrained nocturnal cue, not cinematic AAA night ecology. Remaining gaps include better lantern/water reflection, richer fauna behavior, soundscape, and higher-fidelity wetland material response.

## Next bounded slice

Advance water response with a small Rootwalk lantern reflection/foam cue, preserving daytime, dusk, and night evidence.

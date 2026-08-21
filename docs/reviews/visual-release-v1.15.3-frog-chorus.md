# Frontier Survival v1.15.3 — Mangrove frog chorus

Decision: ACCEPTED INCREMENTAL SOUNDSCAPE CHECKPOINT — PREMIUM FAUNA/AUDIO STILL OPEN

## Product slice

Added a sparse authored Mangrove frog chorus to the existing Web Audio ambient path.

- low-gain triangle chirps;
- one or two short notes per chorus event;
- 5–13 second randomized interval;
- uses the existing AudioBus voice cap;
- only active at night, near water, and within the Rootwalk radius;
- daytime returns `frog=0` and restores birds;
- no terrain, visuals, collision, survival, or input changes.

## Integration correction

The first runtime probe showed the generic nearby-water test missed the Rootwalk channel because physics places the land player at `y≈18` while the channel surface is `y=16`. The accepted correction adds a Rootwalk-specific surface probe at `y=16`, bounded to the existing 22-block landmark radius. This makes the cue activate from the ordinary land approach rather than requiring the player to enter water.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `e777ca965bef8db1408011b234ac509ae12a4863`
- Tag: `v1.15.3`
- Cache chain: `main.js?v=485` → `game.js?v=474` → `audio.js?v=222`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local night landfall: fixed seed `1884808540`, `started=true`, `night=true`, player at `(52,18.0001,58)`, Rootwalk radius active, channel surface probe finds water, audio context `running`, `water=0.18`, `frog=0.32`, frog timer reset, zero page-owned errors.
- Direct scheduler check: forcing frog timer to zero produced one active capped Web Audio voice.
- Local daytime at the same landfall: `night=false`, `frog=0`, birds `0.55`, water `0.18`, audio context `running`, zero page-owned errors.

## Honest limitation

This is a stylized soundscape cue, not recorded frog audio or a full spatial audio system. Remaining premium gaps include richer fauna behavior, authored animal silhouettes, water acoustics, and broader environmental sound variation.

## Next bounded slice

Advance authored Mangrove fauna behavior or silhouette while preserving the accepted Rootwalk day/dusk/night visuals and frog day/night audio gate.

# Frontier Survival v1.15.1 — Rootwalk lantern water response

Decision: ACCEPTED INCREMENTAL WATER CHECKPOINT — PREMIUM WATER/SOUND DESIGN STILL OPEN

## Product slice

Added a compact Rootwalk channel response using two additive rings centered on verified open-water cell `(54,58)`.

- amber lantern reflection ring appears after dusk;
- pale foam ring remains low-opacity near the channel surface;
- both are depth-independent additive cues lifted above the water surface;
- rings pulse subtly rather than behaving as static billboards;
- bridge, lanterns, fireflies, moths, seagrass, wet mud, route, and collision unchanged.

## Correction history

The initial candidate used half-cell coordinates and was visually swallowed at the shoreline boundary. Runtime projection plus screenshot comparison identified the issue as voxel cell-center placement and water-depth occlusion. The accepted correction:

- final mesh position: `(54, 17.12, 58)`;
- `depthTest: false` for the additive reflection/foam materials;
- modest ring enlargement only;
- verified supplemental frame places the cue visibly in the blue channel at the left waterline.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `7e6907197fe2c8b425270f928b555a5a23d4cd31`
- Tag: `v1.15.1`
- Cache chain: `main.js?v=483` → `game.js?v=472` → `fx.js?v=251`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local night runtime: `started=true`, fixed seed `1884808540`, `night=true`, reflection visible at opacity `0.42`, foam visible at opacity around `0.10`, fireflies/moths visible, zero page-owned errors.
- Clean supplemental night frame: amber/foam cue visibly centered in the blue channel at the left waterline; no HUD overlap or renderer artifact.
- Local daytime runtime after the final correction: `night=false`, reflection hidden, foam remains subtle, zero page-owned errors.
- Clean primary night frame: bridge/lantern/fireflies/moths/water/seagrass/HUD remain readable.

## Honest limitation

This is a stylized water-response checkpoint, not physically accurate lantern reflection or cinematic water foam. Remaining premium gaps include richer reflective water, fauna behavior, soundscape, and broader authored nocturnal composition.

## Next bounded slice

Advance the Mangrove’s authored fauna or soundscape while preserving the accepted Rootwalk day/dusk/night evidence.

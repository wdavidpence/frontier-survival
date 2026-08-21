# Frontier Survival v1.16.7 — crab-to-water ripple

Decision: ACCEPTED INCREMENTAL ECOLOGICAL-INTERACTION CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Connected close authored crab scuttles to one localized shallow-channel ripple.

- reuses `MangroveWaterFX`; no new global particle layer;
- one small pale-green ring at the authored channel-edge anchor `(52.3,17.13,59.4)`;
- pulse appears only when the crab scuttle pulse exceeds `0.62`;
- corrected from the first below-water placement `y=16.06` to the visible waterline `y=17.13`;
- final ring geometry `0.22–0.34`, pale-green additive material, peak opacity about `0.10`;
- enlarged/brightened after the first corrected waterline frame remained too faint against the shore;
- crab tick now precedes water tick so the response is causally same-frame;
- quiet and daytime paths hide/reset the ripple;
- no terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `b2329e6bbff8a4d7962860145d65912b0ffcc33a`
- Documentation commit: recorded below
- Tag: `v1.16.7`
- Cache chain: `main.js?v=499` → `game.js?v=488` → `fx.js?v=262`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed production path:
  - `started=true`, seed `1884808540`;
  - close crab pulse `0.8226`;
  - ripple visible at `[52.3,17.13,59.4]`;
  - initial corrected sample opacity `0.0512`; final readable sample opacity `0.1003`;
  - quiet pulse `0.5686` hides the ripple and resets opacity to `0`;
  - zero page-owned errors.
- Visual correction evidence:
  - first frame placed the ring below the visible waterline and read over shore;
  - second anchor overlapped the lantern reflection;
  - final waterline/anchor/contrast correction produces a small pale-green ring distinct from the larger white/amber lantern ring in the frozen proof crop;
  - bridge, lantern, fireflies, moths, frogs, crabs, flecks, HUD, and renderer remain healthy.
- Live Pages:
  - title `Frontier Survival v1.16.7`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - near-channel production pulse `0.8226` triggered the ripple at the final anchor;
  - quiet pulse hid it;
  - clean primary night frame passed visual review;
  - daytime gate: `night=false`, ripple hidden/opacity `0`, crabs `0`, flecks `0`, frogs `0`, zero errors.

## Honest limitation

This is a single authored crab-to-water response cue, not a complete shoreline simulation or broad wildlife ecology system. Remaining premium gaps include richer species behavior, navigation/feeding/predator-prey interaction, and deeper HRTF/occlusion/reverb audio.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

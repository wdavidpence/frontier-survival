# Frontier Survival v1.16.5 — crab shoreline flecks

Decision: ACCEPTED INCREMENTAL ENVIRONMENTAL-FEEDBACK CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Connected close crab scuttle to a tiny shoreline disturbance.

- two shared-material tetrahedral sand flecks per crab;
- flecks appear only during a close scuttle pulse;
- pulse requires the existing seven-block flee falloff;
- flecks lift briefly and fade by visibility gating rather than persisting;
- enlarged/lifted slightly after the first frame was too subtle to read;
- dusk/night-only visibility and sparse channel-edge placement remain unchanged;
- no world-generation, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `887fa9a61cd08ae9ef44ed21f5a9a71ca070672a`
- Documentation commit: recorded below
- Tag: `v1.16.5`
- Cache chain: `main.js?v=497` → `game.js?v=486` → `fx.js?v=260`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night pulse probe:
  - active close pulse fleck counts `[2, 2, 0]` across the three crab groups;
  - quiet phase counts `[0, 0, 0]`;
  - three crabs visible;
  - zero page-owned errors.
- Corrected supplemental channel frame: flecks are separately readable as a tiny lifted tan cluster near the crab silhouettes, subordinate to the larger lantern reflection.
- Clean primary night frame: flecks are absent in quiet phase; crabs remain unobtrusive and Rootwalk composition is healthy.
- Live Pages:
  - title `Frontier Survival v1.16.5`;
  - `started=true`, seed `1884808540`;
  - 1280×720 canvas;
  - three crabs visible during night pulse;
  - four flecks visible across the close groups during the forced pulse;
  - quiet phase flecks `0`;
  - zero page-owned errors;
  - final daytime gate: `night=false`, crabs `0`, flecks `0`, frogs `0`, zero errors.

## Honest limitation

This is a tiny authored cause-and-effect cue, not a full shoreline simulation. Remaining premium gaps include richer species behavior, broader ecology, and deeper spatial water/fauna audio.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

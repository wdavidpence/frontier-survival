# Frontier Survival v1.17.5 — dragonfly feeding skim

Decision: ACCEPTED INCREMENTAL AUTHORED-ECOLOGY CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made feeding dragonflies perform a short authored skim pass toward the active Mangrove channel spot.

- feeding-only phase driven by `skimPulse = feedingPulse * max(0, sin(elapsed * 4.8 + phase))`;
- small lateral return arc (`0.22`/`0.18` block bounded offsets);
- additional `0.06` block dip and `0.18` pitch accent during the skim;
- idle dragonfly hover remains unchanged;
- existing day/dusk visibility, six-block scatter, nighttime suppression, mudskipper feeding dimple, hops, dart, splash audio, and feeding dip remain intact;
- no new particles, terrain, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `00937373953adba413c6a9ca9ebfc3e900a6c12e`
- Documentation commit: recorded below
- Tag: `v1.17.5`
- Cache chain: `main.js?v=507` → `game.js?v=496` → `fx.js?v=270`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed runtime:
  - `started=true`, seed `1884808540`;
  - idle phase: `skimPulse=0`, positions `[[53.07,17.605,58.507],[54.615,17.649,58.918]]`, rotation x `[0,0]`;
  - feeding phase A: `skimPulse=1`, positions `[[52.966,17.491,58.742],[54.662,17.74,59.009]]`, rotation x `[0.32,0.14]`;
  - feeding phase B: `skimPulse=0.88`, positions `[[53.062,17.545,58.515],[54.715,17.537,59.067]]`, rotation x `[0.14,0.298]`;
  - both dragonflies remained visible;
  - zero page-owned errors.
- Local visual: clean daytime primary Rootwalk frame preserves accepted bridge, water, horizon, seagrass, HUD, renderer, and subordinate cyan dragonfly motifs.

## Honest limitation

This is a bounded authored skim behavior, not a complete insect–fish ecology or food web. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, true HRTF/occlusion/reverb, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

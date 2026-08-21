# Frontier Survival v1.16.6 — spatial crab skitter audio

Decision: ACCEPTED INCREMENTAL SPATIAL-WILDLIFE-AUDIO CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added a tiny authored crab skitter sound tied to the existing close scuttle pulse.

- two short square-wave clicks per accepted scuttle pulse;
- low gain (`0.012` base, second click `0.72x`);
- existing StereoPannerNode path receives the Rootwalk lateral pan;
- 0.65-second crab audio cooldown prevents frame-by-frame chatter;
- AudioContext/autoplay fallback remains handled by the existing AudioBus;
- no terrain, collision, survival, input, visual geometry, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `897e8802cd77973057e73c4053928b6c376ab2ea`
- Documentation commit: recorded below
- Tag: `v1.16.6`
- Cache chain: `main.js?v=498` → `game.js?v=487` → `audio.js?v=225` / `fx.js?v=261`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed production path:
  - `started=true`, seed `1884808540`;
  - first close scuttle pulse `0.8226`;
  - AudioContext `running`;
  - first tick created exactly 2 voices;
  - cooldown set to `0.65`;
  - immediate second tick remained at 2 voices;
  - zero page-owned errors.
- Local clean primary night frame: bridge, lantern, fireflies, moths, frogs, crabs, water, seagrass, reflection/foam, and HUD remain unchanged and healthy.
- Live Pages:
  - title `Frontier Survival v1.16.6`;
  - `started=true`, seed `1884808540`;
  - 1280×720 canvas;
  - first close pulse created exactly 2 voices;
  - AudioContext `running`, pulse `0.8226`, cooldown `0.65`;
  - immediate second tick remained at 2 voices;
  - zero page-owned errors;
  - clean live night frame passed visual review;
  - daytime gate: `night=false`, crabs `0`, flecks `0`, frogs `0`, zero errors.

## Honest limitation

This is a bounded low-gain skitter cue using the existing stereo panner, not full HRTF/occlusion/reverb or an authored multi-species sound system. Remaining premium gaps include deeper spatial audio, richer wildlife behavior, broader ecology, and ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

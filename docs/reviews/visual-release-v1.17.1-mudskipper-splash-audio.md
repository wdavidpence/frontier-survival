# Frontier Survival v1.17.1 — mudskipper splash audio

Decision: ACCEPTED INCREMENTAL SPATIAL-WILDLIFE-AUDIO CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Added a tiny mudskipper splash chirp to close player alerts.

- low-gain triangle/sine two-note splash timbre;
- uses the existing AudioBus and lateral pan path;
- only triggers when mudskipper alert exceeds `0.65`;
- `0.8s` cooldown prevents chatter;
- existing autoplay/context/voice-cap behavior preserved;
- no visual geometry, terrain, collision, survival, input, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `c86893e43350df5961413d0594b490e779ff32da`
- Documentation commit: recorded below
- Tag: `v1.17.1`
- Cache chain: `main.js?v=503` → `game.js?v=492` → `fx.js?v=266` → `audio.js?v=226`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed production audio probe:
  - `started=true`, seed `1884808540`;
  - alert `0.889`;
  - AudioContext `running`;
  - first production tick made exactly one `_mudskipperSplash` call;
  - cooldown set to `0.8`;
  - next `0.1s` tick made no additional call;
  - zero page-owned errors.
- Local primary night frame: bridge, lantern, fireflies, moths, frogs, crabs, mudskippers, water, seagrass, reflection/foam, HUD, and renderer remain healthy with no visual regression.
- Local daytime: mudskippers `0`, ripples `0`, alert `0`, cooldown `0`, crabs `0`, frogs `0`, zero errors.
- Live Pages:
  - title `Frontier Survival v1.17.1`;
  - `started=true`, seed `1884808540`, 1280×720 canvas;
  - clean live primary frame passed visual review;
  - daytime gate passed with zero errors.

## Honest limitation

This is a restrained spatial audio cue, not complete HRTF/occlusion/reverb or a full mudskipper soundscape. Remaining premium gaps include deeper AI, navigation/feeding/predator-prey interaction, more species, and richer ecological storytelling density.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

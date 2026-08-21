# Frontier Survival v1.15.9 — approach-sensitive water response

Decision: ACCEPTED INCREMENTAL ENVIRONMENTAL-INTERACTION CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made the Rootwalk shallow-channel water response react subtly to player approach.

- `MangroveWaterFX.tick` now receives the player center;
- approach strength is measured against the authored water cell `(54,58)` over a 12-block falloff;
- near the landing, foam opacity increases by up to `0.025`;
- night reflection opacity increases by up to `0.05`;
- both reflection and foam scale expand slightly near the landing;
- no new geometry, terrain, gameplay, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `5ea3aaaa91e2b7850f3ac48b4bb1ef96e1eabea2`
- Tag: `v1.15.9`
- Cache chain: `main.js?v=491` → `game.js?v=480` → `fx.js?v=258`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local night near/far probe at `nightMix=1`:
  - near reflection opacity `0.47`, far `0.42`;
  - near foam opacity `0.145`, far `0.12`;
  - near reflection scale `[1.73, 0.88]`, far `[1.65, 0.84]`;
  - near foam scale `[1.21, 0.77]`, far `[1.17, 0.74]`;
  - zero page-owned errors.
- Local night frame: response remains subtle; bridge, lantern, fireflies, moths, frogs, water, seagrass, reflection/foam, and HUD remain readable without over-brightening or clutter.
- Local daytime: reflection hidden, foam opacity `0.0515`, zero errors.

## Honest limitation

This is a bounded proximity response, not a full fluid simulation or physically based water system. Remaining premium gaps include species variety, spatialized water/fauna audio, and broader authored Mangrove ecology.

## Next bounded slice

Add one further authored Mangrove environmental interaction while preserving Rootwalk visual/audio gates.

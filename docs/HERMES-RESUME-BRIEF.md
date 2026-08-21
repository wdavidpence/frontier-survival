# Frontier Survival — v1.17.1 mudskipper-splash checkpoint

Updated: 2026-08-21

## Current live candidate

v1.17.1 adds a tiny spatial mudskipper splash chirp when close player alert begins.

- low-gain triangle/sine two-note cue;
- existing AudioBus and lateral pan path;
- alert threshold `0.65`;
- `0.8s` cooldown;
- bridge, lantern, fireflies, moths, frogs, crabs, mudskippers, crab water response, flecks, reflection/foam, and HUD preserved.

## Release state

- Product commit: `c86893e43350df5961413d0594b490e779ff32da`
- Documentation commit: recorded below
- Tag: `v1.17.1`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=503` → `game.js?v=492` → `fx.js?v=266` → `audio.js?v=226`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local production probe with alert `0.889` made exactly one splash call, set cooldown `0.8`, and suppressed the next `0.1s` call with AudioContext `running`. Clean night visual and daytime gates passed.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

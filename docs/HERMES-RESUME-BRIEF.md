# Frontier Survival — v1.16.6 spatial crab-skitter checkpoint

Updated: 2026-08-21

## Current live candidate

v1.16.6 adds a tiny spatial crab skitter sound to close scuttle pulses.

- two low-gain clicks per accepted pulse;
- Rootwalk lateral stereo panning;
- 0.65-second cooldown;
- existing AudioBus autoplay, voice-cap, and fallback behavior preserved;
- bridge, lantern, fireflies, moths, frogs, frog audio, water, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `897e8802cd77973057e73c4053928b6c376ab2ea`
- Tag: `v1.16.6`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=498` → `game.js?v=487` → `audio.js?v=225` / `fx.js?v=261`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local and live production paths created exactly two voices on the first close pulse, retained two on the immediate cooldown-protected second tick, and reported a running AudioContext with zero errors. Clean live primary night frame showed no visual regression; live daytime hid crabs, flecks, and frogs with zero errors.

## Next bounded slice

Advance Mangrove toward richer authored ecology or deeper spatial wildlife behavior while preserving accepted Rootwalk gates.

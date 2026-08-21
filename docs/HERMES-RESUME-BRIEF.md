# Frontier Survival — v1.15.8 moth-orbit checkpoint

Updated: 2026-08-21

## Current live candidate

v1.15.8 makes the six Mangrove moth motes orbit the Rootwalk lantern at night.

- deterministic base positions;
- slow lantern-centered ellipse;
- restrained vertical flutter;
- stronger tightening with `nightMix`;
- daytime remains hidden;
- bridge, lantern, fireflies, frogs, frog audio, water response, seagrass, reflection/foam, and HUD preserved.

## Release state

- Product commit: `d9ede702a755c672994143858a1285048602a6e9`
- Tag: `v1.15.8`
- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Cache chain: `main.js?v=490` → `game.js?v=479` → `fx.js?v=257`.
- Smoke, syntax, diff-check, parity, and 125-edge import audit pass.

## Runtime judgment

Local fixed-seed night orbit is visible after authoritative tick with opacity `0.44`, zero errors, and first-mote radius changing `1.797 → 1.781` over one second. The local night frame remains readable and uncluttered.

## Next bounded slice

Add one authored Mangrove environmental interaction beyond lantern moth orbit while preserving Rootwalk day/dusk/night gates.

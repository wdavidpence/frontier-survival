# Frontier Survival v1.15.8 — lantern moth orbit

Decision: ACCEPTED INCREMENTAL ENVIRONMENTAL-INTERACTION CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Made the six authored Mangrove moth motes respond to the Rootwalk lantern.

- deterministic base positions are retained;
- night-visible moths tighten into a slow lantern-centered ellipse;
- orbit angle advances at a restrained per-mote rate;
- small vertical flutter remains layered over the orbit;
- attraction increases with `nightMix` while daytime remains hidden;
- no terrain, gameplay, collision, survival, input, audio, or HUD changes.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `d9ede702a755c672994143858a1285048602a6e9`
- Tag: `v1.15.8`
- Cache chain: `main.js?v=490` → `game.js?v=479` → `fx.js?v=257`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night: `started=true`, seed `1884808540`, night phase `0.625`, moth orbit visible after authoritative tick, opacity `0.44`, zero page-owned errors.
- Local orbit sample: first mote radius changed from `1.797` to `1.781` over one second at full night pull, confirming bounded lantern attraction rather than uncontrolled drift.
- Local night frame: moths remain sparse around the Rootwalk lantern corridor; bridge, lantern, fireflies, frogs, water, seagrass, reflection/foam, and HUD remain readable without new occlusion or clutter.
- Daytime gate: existing moth visibility gate remains unchanged; the orbit path is dormant while hidden.

## Honest limitation

This is a stylized environmental attractor, not a full insect simulation or physically coupled lighting system. Remaining premium gaps include richer species variety, spatialized fauna/water audio, and broader authored Mangrove ecology.

## Next bounded slice

Add one authored Mangrove environmental interaction beyond the lantern moth orbit while preserving Rootwalk day/dusk/night gates.

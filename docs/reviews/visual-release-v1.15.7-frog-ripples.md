# Frontier Survival v1.15.7 — frog hop water ripples

Decision: ACCEPTED INCREMENTAL WATER/FAUNA CHECKPOINT — PREMIUM ECOLOGY STILL OPEN

## Product slice

Connected the authored frog behavior to the shallow-channel water response.

- each frog owns a small pale-green ring;
- ring appears only during the frog's `0.72s` hop window;
- ring opacity peaks at approximately `0.075`, below the lantern reflection;
- ring expands modestly with hop height;
- ring is anchored to the actual channel water surface at local `y=-1.15` from the frog group (`world y≈16.05`);
- no terrain, gameplay, collision, survival, or audio changes.

## Correction

The first ring placement was beneath the frog body in air and did not read visually. Runtime projection showed the channel surface at `y=16` while frog groups sit near `y=17.2`. The final placement is water-surface anchored and visually distinct from the larger lantern reflection.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `3b270a0dcce8e3d5cd7886cd8187ef79d4218ba1`
- Tag: `v1.15.7`
- Cache chain: `main.js?v=489` → `game.js?v=478` → `fx.js?v=256`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night: production frog tick forced to deterministic hop phase; one ripple visible, ripple opacity `0.0745`, one frog at `y=17.455`, zero page-owned errors.
- Projection: ripple landed at screen approximately `(701,566)` and world `y≈16.05`.
- Pixel proof: distinct pale-green ring visible in the water beneath the frog eye cluster, separate from the larger white/amber lantern reflection, without clutter or HUD overlap.
- Existing bridge, lantern, fireflies, moths, seagrass, water, reflection, and HUD remain readable.

## Honest limitation

This is a stylized fauna-water response, not a full fluid simulation or spatially coupled animal system. Remaining premium gaps include richer species variety, spatialized audio, and broader authored Mangrove ecology.

## Next bounded slice

Advance Mangrove toward richer fauna behavior or water/sound interaction while preserving the accepted Rootwalk gates.

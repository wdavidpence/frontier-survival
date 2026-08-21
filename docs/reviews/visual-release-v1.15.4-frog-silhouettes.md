# Frontier Survival v1.15.4 — Mangrove frog silhouettes

Decision: ACCEPTED INCREMENTAL FAUNA CHECKPOINT — PREMIUM FAUNA BREADTH STILL OPEN

## Product slice

Added three tiny authored low-poly frog silhouettes beside the Rootwalk channel.

- dark green body and lighter belly;
- six pale-gold eye glints with dark pupils;
- idle bob and slight rotational motion;
- visible only after dusk (`nightMix > 0.18`), inside the existing 22-block Rootwalk gate;
- no gameplay, collision, terrain, or survival changes;
- frog chorus audio remains active under the v1.15.3 day/night gate.

## Provenance

- Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-biome-sprint-20260820`
- Product commit: `6aa20acb64e8bb96dd3248cd9ba3de8b41fe1078`
- Tag: `v1.15.4`
- Cache chain: `main.js?v=486` → `game.js?v=475` → `fx.js?v=253`.

## Evidence

- Smoke: PASS.
- Syntax: PASS for touched JS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Local fixed-seed night: three frog groups, all three visible, eye glints readable near the channel, frog audio `0.32`, AudioContext running, zero page-owned errors.
- Local fixed-seed day: three groups remain allocated but `visible=0`, frog audio `0`, birds `0.55`, zero page-owned errors.
- Night screenshot: small channel frog cluster adds fauna identity without obscuring bridge, lantern, water, moths, fireflies, or HUD; no black/gray artifact.

## Honest limitation

The frogs are authored visual silhouettes with procedural idle motion, not a full interactive animal species with pathfinding, feeding, reproduction, or emergent behavior. Remaining premium gaps include richer fauna behavior, audio spatialization, and broader biome ecology.

## Next bounded slice

Add one more cohesive authored Mangrove fauna behavior or interaction cue, preserving the Rootwalk day/dusk/night visual and frog-audio gates.

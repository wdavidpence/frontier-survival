# Frontier Survival v1.14.2 — Rootwalk sightline checkpoint

Decision: ACCEPTED INCREMENTAL VISUAL CHECKPOINT — FINAL AAA VISTA STILL OPEN

## Product slice

Opened a narrow authored Mangrove sightline envelope around the Lantern Rootwalk and verified the actual supported approach step.

- Mangrove tree placement suppressed only in the destination envelope `x=48..61`, `z=53..65`;
- sync and worker generation mirrored;
- Rootwalk plank deck, water-side beacon, elevated lantern, roots, and Mangrove arrival cue retained;
- prepared cache chain: `main.js?v=474` → `game.js?v=463` → `world.js?v=432` → `chunk-worker.js?v=292`.

## Provenance

- Product commit: `46a3031244846c4aa8258c698a47e829ada346c7`
- Tag: `v1.14.2`
- Base: v1.14.0 / `0bfa126`
- Live: https://wdavidpence.github.io/frontier-survival/
- Fixed seed: `1884808540`

## Evidence

- Full smoke: PASS.
- Syntax checks: PASS.
- `git diff --check`: PASS.
- Root/public parity: PASS.
- Import audit: 125 edges, 0 missing targets, 0 missing cache-bust queries.
- Supported approach runtime: player remained `onGround=true` at `(52.5,19,58.5)` on the actual Rootwalk step, `biome=ocean` at the water-side entry, zero page-owned errors.
- Accepted frame shows plank deck, elevated torch, open water, distant island silhouettes, readable HUD, and no black/gray renderer artifact.

## Honest limitation

This is an accepted close approach checkpoint, not the final astonishing Wow-level or AAA-parity vista. The next visual gap is a clean mid-distance reveal from a land-side Mangrove route that shows the full bridge/lantern silhouette without the close foreground wall.

The prior rejected hypothesis remains preserved at `docs/reviews/visual-release-v1.14.2-sightline-rejected.md`.

## Next bounded slice

Author a land-side approach cell connected to the Rootwalk’s supported steps, with the same 3×3×6 clearance contract and a clear view toward the bridge. Capture that ordinary mid-distance frame before adding more content.

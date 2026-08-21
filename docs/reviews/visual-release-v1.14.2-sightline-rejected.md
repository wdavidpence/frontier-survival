# Frontier Survival v1.14.2 — Mangrove sightline-pocket candidate

Decision: NOT PUBLISHED — VISUAL GATE FAILED

## Candidate slice

Widened the authored Mangrove sightline pocket around the Rootwalk approach:

- sync and worker pocket: `x=48..61`, `z=53..65`;
- procedural Mangrove trees are suppressed only inside that destination envelope;
- existing Rootwalk bridge, beacon, lantern, roots, and field-note cue are preserved;
- cache chain prepared for v1.14.2: `main.js?v=474` → `game.js?v=463` → `world.js?v=432` → `chunk-worker.js?v=292`.

## Mechanical evidence

- smoke: PASS;
- syntax: PASS;
- diff-check: PASS;
- root/public parity: PASS;
- import audit: 125 edges, 0 missing targets, 0 stale cache-bust edges.

## Visual result

Rejected for publication. The authoritative player-yaw frame still shows the player camera pressed against a dark terrain/cliff volume; the Rootwalk torch is intermittently visible, but the bridge silhouette is not readable. The widened tree pocket did not solve the dominant problem, so this is likely approach-cell clearance/camera placement rather than missing vegetation suppression.

Do not call v1.14.2 published or live. Preserve the diff for the next correction.

## Next bounded slice

Inspect the exact collision/spawn clearance around candidate approach cells and choose a verified land cell with at least 6 blocks of vertical clearance and an unobstructed ray to the Rootwalk. Fix the authored approach cell or camera-facing route, then capture a fresh ordinary player frame before versioning.

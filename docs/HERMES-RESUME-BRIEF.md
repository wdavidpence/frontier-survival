# Frontier Survival — v1.12.71 release checkpoint

Updated: 2026-08-16

## Result

Published v1.12.71: high-contrast tropical ruin landmark on top of v1.12.70.

- Product commit: `747169bd078c066d85c741f35e94e7988d1e739f`
- Tag: `v1.12.71`
- Product commit pushed to `origin/main`; this handoff update is a follow-up documentation commit.
- Live: https://wdavidpence.github.io/frontier-survival/
- Clean release worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-aaa-release-v1271-ruin-20260816`
- Canonical checkout remains broad dirty WIP and quarantined.

## Accepted slice

- `js/world.js` and `js/chunk-worker.js` mirror a sparse tropical ruin predicate at normalized world coordinates `x % 32 === 22`, `z % 32 === 26`.
- The ruin is a bounded 3x3 footprint with two COBBLE side pillars, BRICKS bands, a raised lintel, and an open center doorway.
- Normal tree rolls, v1.12.70 fan understory, collision, and drops remain otherwise unchanged.
- Version/cache surfaces: v1.12.71, `main.js?v=433`, `game.js` → `world.js?v=416`, `world.js` → `chunk-worker.js?v=281`.

## Evidence

### Static/automated

- `node --check js/game.js`, `js/world.js`, `js/main.js`, `js/chunk-worker.js`: passed.
- `node tests/smoke.mjs`: exit 0, 391 PASS lines.
- Smoke contract verifies the ruin predicate/material/helper in both generators.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.

### Local runtime/visual

- Exact candidate served from the release worktree.
- Fixed seed: `1884808540`.
- Start reached `started=true`, title hidden, 1280x720 canvas, zero page-owned errors.
- Opening frame shows distinct gray/red ruin silhouettes in the midground without new darkness, terrain occlusion, sky loss, or HUD overlap.
- Controlled face-to-target probe confirmed actual COBBLE/BRICKS blocks at the deterministic starter-route coordinate and zero runtime errors.

### Live runtime/visual

- Pages propagated v1.12.71 with `main.js?v=433`.
- Live Start reached `started=true`, title hidden, 1280x720 canvas, zero page-owned errors at the same seed.
- Live screenshot retained the ruin silhouettes and matched the local candidate without HUD, sky, terrain, or occlusion regression.

### Mobile

- Mobile/portrait evidence remains pending; no mobile claim is made.

## Worker outcomes

- Antigrav v1.12.70 understory candidate: accepted in the prior release.
- Palm landmark candidates from Antigrav/Grok45: rejected; one had no artifact and the real diff was visually indistinguishable from ordinary forest.
- Antigrav ruin worker: no artifact; frontier judge implemented the bounded ruin fallback after worker escalation.
- MOA_OQ remains paused per user direction.

## Next bounded slice

The next highest-value gap is forest readability and authored exploration composition beyond the single ruin: a controlled near/mid/far route with clearer clearings, vegetation contrast, and one additional biome-readable landmark. Keep sync/worker parity, fixed-seed screenshots, and mobile evidence as release gates. Do not claim AAA parity.

This is an incremental verified checkpoint, not a claim of Minecraft/AAA parity.

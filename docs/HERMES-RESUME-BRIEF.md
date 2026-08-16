# Frontier Survival — v1.12.70 release checkpoint

Updated: 2026-08-16

## Result

Published v1.12.70: tropical understory readability plus harvest-camera correction.

- Commit: `ab059a92ea588f2aebf4f64a7548d21f1fd071d1`
- Tag: `v1.12.70`
- Product commit was pushed to `origin/main`; a follow-up handoff-only commit records this checkpoint.
- Live: https://wdavidpence.github.io/frontier-survival/
- Clean synthesis worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-aaa-release-synthesis-20260816`
- Canonical checkout remains broad dirty WIP and quarantined; do not use it as a release base.

## Accepted slice

- `js/world.js`: tropical bush instances now use a deterministic broad fan silhouette in tropical biomes while preserving shoreline reeds and ordinary tufts. Geometry remains clamped inside its host voxel, collision/drop behavior is unchanged, and the existing plant budget remains intact.
- `js/game.js`: player-driven Three.js camera pitch now negates the Minecraft-style player pitch so the rendered view and harvest ray agree. P1 startup/update/death/end-frame syncs and the P2 body camera were corrected; free-camera pitch remains unchanged.
- `tests/interaction-contract.mjs`: regression contract locks camera/interaction pitch alignment.
- Version/cache surfaces: v1.12.70, `main.js?v=432`, `game.js` imports `world.js?v=415`.

## Evidence

### Static/automated

- `node --check js/game.js`, `js/world.js`, `js/main.js`: passed.
- `node --test tests/interaction-contract.mjs`: 5 passed.
- `node tests/smoke.mjs`: exit 0, 390 PASS lines.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.

### Local runtime/visual

- Exact candidate served from the synthesis worktree.
- Fixed seed: `1884808540`.
- Start reached `window.__FS.started === true`, title hidden, 1280x720 canvas, and zero page-owned errors.
- Before/after screenshots showed a modest but attributable increase in tropical understory silhouette variety without added darkness, occlusion, horizon loss, or HUD overlap.
- Harvest camera probe matched rendered-camera and interaction-ray Y at pitches `+0.45` and `-0.45`, maximum delta `0`.

### Live runtime/visual

- Pages propagated v1.12.70 with `main.js?v=432`.
- Live Start reached `started=true`, title hidden, 1280x720 canvas, and zero page-owned errors at the same seed.
- Live screenshot matched the accepted local candidate with no visual regression.
- Live harvest camera probe also matched at both pitch directions with maximum delta `0`.

### Mobile

- Mobile/portrait evidence remains pending; no mobile claim is made.

## Worker outcomes

- Antigrav: produced the accepted `js/world.js` understory candidate. The worker PID crashed after leaving the complete artifact; the candidate passed independent static, smoke, local browser, and live browser gates.
- Grok45: produced a taller palm candidate in `js/world.js`, but it was rejected because `js/chunk-worker.js` still uses the old palm generator. The candidate remains preserved for a future parity-corrected slice.
- MOA_OQ remains paused per user direction.

## Next bounded slice

Target one deterministic navigational landmark/horizon composition improvement with synchronous and chunk-worker parity. Do not stack more palette, sky, or water micro-tweaks until a fixed-seed ordinary traversal frame clearly exposes the landmark. Require near/mid/far screenshots, local/live Start proof, smoke, import cache audit, and mobile status before accepting the next checkpoint.

This is an incremental verified checkpoint, not a claim of Minecraft/AAA parity.

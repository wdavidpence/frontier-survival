# Visual Release Handoff — v1.12.41

## Scope

Incremental lighting/readability checkpoint following v1.12.40. This release synthesizes only the Luna shader-authority correction from the second visual wave. Claude's plant-variety follow-up and Antigrav's atlas follow-up were rejected after fixed-seed ordinary-frame review as visually indistinguishable or too repetitive/noisy.

## Accepted player-visible change

`js/game.js` now balances the authoritative greedy terrain shader for daytime: the daytime material ambient floor is lifted to reveal shadowed forest/canopy detail, while daytime sun intensity is reduced so the shoreline sand is less blown out. Night values, water contrast, shadows, spawn, and gameplay APIs remain unchanged.

## Evidence buckets

### Static / automated

- Exact release workspace: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-aaa-release-20260811`
- Base: published `a0cdef124e4d79c89d2314eeb8b5264cd05e6a66` (v1.12.40)
- Only accepted product change: `js/game.js`; release surfaces also update `main.js?v=406`, `game.js?v=402`, v1.12.41 markers, and the smoke expectation.
- Required checks: `node --check js/game.js`, `node --check js/main.js`, `git diff --check`, full smoke, root/public parity, and executable import cache-bust audit.

### Runtime / visual

- Fixed seed: `424242`, fresh-world Start, 1440x900 Chromium.
- Candidate reached `window.__FS.started === true`, hid `#title-screen`, rendered canvas/HUD/hotbar, and had no page exception.
- Luna candidate frame: `/tmp/fs-luna-final-wave2.png`.
- The ordinary frame visibly lifts forest/canopy detail and reduces some sand blowout without flattening the scene or regressing HUD/water/terrain composition.

## Remaining visual gap

Still an incremental checkpoint, not Minecraft/AAA parity. The scene retains blocky cloud banks, highly saturated voxel sand, limited water/shore response, and a stylized rather than cinematic forest/ecology layer. Next work should be a single fixed-seed water/shore or sky/atmosphere slice with stronger visible proof; do not merge the rejected atlas/plant-variety experiments without a new attributable frame.

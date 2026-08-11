# Visual Release Handoff — v1.12.42

## Scope

Incremental material checkpoint following v1.12.41. This release keeps the accepted procedural understory and lighting balance, then adds the accepted Antigrav atlas pass from the third visual wave.

## Accepted player-visible change

`js/atlas.js` now gives water a more readable layered blue surface with broad and fine crest foam, while slightly reducing repetitive grass/sand microtexture and keeping their palette coherent. The nearest-pixel voxel atlas, tile wrapping, opaque base fills, exports, and initialization-time performance contract remain intact. `game.js` advances the atlas importer to `?v=295`.

## Rejected experiments

- Luna cloud-bank redesign: rejected for clipped top/side masses and clutter in the ordinary frame.
- Claude animal-detail pass: not accepted because the ordinary fixed-seed frame did not expose wildlife; no unsupported visual claim is made.

## Evidence

- Base: published `3e0864d05a58dd04672fbe0aa2c68105da2ce46b` (v1.12.41).
- Exact Antigrav candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-aaa-v1241-antigrav-20260811`.
- Fixed seed `424242`, fresh Start, 1440x900 Chromium; `started=true`, title hidden, HUD/hotbar/canvas present.
- Candidate screenshot: `/tmp/fs-antigrav-v1241-wave3.png`.
- The ordinary frame shows more coherent grass/sand texture and a visible layered blue/foam response in the water strip without neon, holes, or HUD regression.
- Full smoke, syntax, diff-check, root/public parity, and executable cache-bust audit are required before commit/push.

## Remaining visual gap

Still not Minecraft/AAA parity: the opening shore composition remains highly saturated and blocky, cloud geometry is stylized, the forest lacks cinematic depth, and the water strip is narrow. The next slice should expose and polish a shoreline/coast frame through supported movement, then compare fixed-seed before/after screenshots.

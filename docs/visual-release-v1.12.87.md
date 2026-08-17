# Frontier Survival v1.12.87 — visible deterministic wildlife response

Base: v1.12.86 / `2d50a5997791b6492fd8d038022fe9d85546222c`

## Accepted slice

Fresh starter wildlife remains visible at ordinary distance, and deterministic attention state now reaches the production renderer explicitly. `game.js` passes the animal attention band into `animalLimbPose`; browse produces a readable grazing body/head/ear silhouette, while idle settles the body/head. Existing flee/chase movement, species layouts, saves, co-op behavior, starter placement, and cache-bust chain remain intact.

## Evidence

- Static: three production files changed (`js/animals.js`, `js/animal-visuals.js`, `js/game.js`); HTML/test version and cache surfaces synchronized.
- Automated: syntax checks for all three changed JS files; `git diff --check`; root/public parity; 400 smoke PASS lines.
- Runtime: fresh seed-2 start reached `window.__FS.started === true`, zero runtime errors; nearest hare approximately 16m; live attention label `browse` produced body `rx=0.28/rz=0.18`, head `rx=-0.38`, ears ±0.12 in the mesh.
- Visual: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-sprint-20260817/frontier-v1288-final-immediate.png` shows the hare visibly readable in the forward forest lane at ordinary distance with a deliberate grazing tilt. Shore/water, Iron Ravine cue, HUD, hotbar, and camp marker remain intact; no black/gray renderer artifacts.
- Mobile/co-op: not collected for this checkpoint.

## Decision

Accepted for the next incremental release. This is an ecology/presentation slice, not an AAA parity claim.

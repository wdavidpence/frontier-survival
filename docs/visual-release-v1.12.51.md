# Frontier Survival v1.12.51 — Forest-Floor Readability Checkpoint

## Sprint direction

This checkpoint is the first bounded slice of the next major visual sprint selected from the long-term plan:

- readable Minecraft/SurvivalCraft-style atmosphere and first-frame composition;
- richer procedural plantlife using the successful mushroom geometry as the future plant standard;
- readable tropical water/shore identity;
- stronger local co-op/TV presentation;
- deeper survival body systems.

## Shipped slice

The live v1.12.50 frame had repeated near-black rectangular forest-floor patches. The root cause was the DAMP_SOIL forest-floor detail: its atlas palette and vertex tint were dark enough to collapse into black under the active terrain lighting.

v1.12.51 lifts only the DAMP_SOIL atlas base/fleck palette and vertex/top tint. It preserves the existing deterministic forest-floor generation, geometry, gameplay behavior, and the already-live layered sky/water pass.

## Evidence

- Baseline remote/live: v1.12.50, `fd56aaf`.
- Baseline browser Start: `started=true`, title hidden, world/player present, zero page-owned errors.
- Baseline visual: layered sky, readable water glimpse and HUD, but repeated near-black floor rectangles.
- Candidate browser Start: `started=true`, title hidden, world/player present, zero page-owned errors.
- Candidate visual: DAMP_SOIL reads as brown/olive patches instead of black rectangles; sky, water, mushrooms, forest, and HUD remain intact.
- Automated: `node tests/smoke.mjs` passes; all touched JS passes `node --check`; `git diff --check` passes; root/public HTML parity passes.

## Not shipped in this checkpoint

- `js/plant-parts/procedural-plant.js` was produced by a supervised worker as a deterministic 135-line foundation, but it is intentionally not included: it is not production-wired and has no player-visible effect yet.
- Broad sky/cloud experiments were rejected because one candidate produced a darker/muddier ordinary forest frame. The current live layered atmosphere is preserved.
- Co-op presentation and survival-body depth remain major future lanes.

## Next bounded sprint slices

1. Wire the procedural plant foundation into one existing production plant path and verify a screen-visible improvement.
2. Make water/shore composition reliably visible in ordinary fresh starts without sacrificing land readability.
3. Validate split-screen TV-safe HUD and controller navigation as a separate product slice.

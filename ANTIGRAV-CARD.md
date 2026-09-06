# Antigrav Card FS-2609-01: Canopy Readability & First-Expedition Placement Proofs

You are `antigrav`, a bounded visual-integration worker for Frontier Survival (browser Three.js voxel game, single-page ES modules).

Workspace: /mnt/c/Users/wdavi/Projects/Frontier-Survival-antigrav-canopy-20260906 (branch antigrav/canopy-occlusion-20260906, based on origin/main). Do ALL work here. Commit on this branch when done. Do NOT push, merge, deploy, or publish. Do NOT touch any other worktree or the canonical checkout.

## Context
Known visual debt: fresh-world ordinary frames show a "dark green canopy/foreground occlusion" — a near-camera dark green mass that dims part of the frame while sky, water, sand, and HUD stay readable. Prior passes (wow-18/19/20) already fixed Mangrove Mud tile 58 and kelp/root tiles; the dark-green canopy/foreground remains. Suspects: `js/tropical-ecology.js`, `js/canopy-ambient-motion.js`, `js/animal-visuals.js`, palm crown geometry in `js/palm-trunk-geometry.js` / world plants, `js/atmosphere-sky.js`, `js/fx.js`, `js/quality-policy.js`.

## Task A — canopy occlusion (primary)
1. Read `tests/smoke.mjs` conventions first. Add a smoke test block named `canopy readability pass dims foreground occlusion` asserting the final contracts you introduce.
2. Locate what draws dark green near the camera in fresh worlds (search for canopy, leaf, crown, frond, dark greens, ambient occlusion, foreground plant meshes).
3. Implement a **scoped, data-driven** fix so foreground canopy/foliage reads as saturated warm green rather than near-black occlusion: e.g. per-material color/roughness floor, foliage-tint constants, or a gentle distance-based brightness lift for canopy meshes. Tile/material-scoped only — no global exposure, fog, or shadow changes.
4. Respect `js/quality-policy.js` Balanced-mode budgets; do not add draw calls beyond existing budgets.

## Task B — first-expedition placement proofs
`js/first-expedition.js` has a stage system whose roofed-shelter, skiff-launch, and marine-sighting stages lack player-path proofs. Add **orchestrator-callable** evidence hooks (pure exported async helper(s) like `runPlacementProofs(game)` that perform the same real input sequences the browser harness uses, mirroring existing proof patterns in `js/game.js` / `tests/smoke.mjs`), plus smoke assertions that the exports exist. Keep it honest: hooks must run real game APIs, no stubs that fake success.

## Hard rules
- Keep `index.html` and `public/index.html` byte-identical if you touch either.
- Bump `?v=N` on EVERY changed relative ES import, transitively (entry alone is not enough).
- Run `node tests/smoke.mjs` and get exit 0 (all PASS, no FAIL).
- Run `node --check` on every changed .js file.
- Commit on branch `antigrav/canopy-occlusion-20260906` with message starting `feat(visual): canopy readability + expedition proof hooks`.
- Do not push/deploy. Do not edit files outside the 6 suspects + first-expedition + smoke + index/public HTML + cache-bust touched imports.

## Report format (final message)
1. ROOT CAUSE of canopy occlusion (file:line).
2. FIX diff summary (files + what changed + cache-bust versions).
3. SMOKE output tail (counts, exit code).
4. Any deviations or open items.

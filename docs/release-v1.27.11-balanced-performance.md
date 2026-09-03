# Frontier Survival v1.27.11 — Balanced Performance

`v1.27.11` carries the latest `v1.27.10` public release forward with a bounded Balanced-mode performance pass.

## Player-visible result

- Balanced mode caps device pixel ratio at 1.0, keeps 512 shadow maps, reduces cloud/particle budgets, and uses a 64-block / 5-chunk stream envelope.
- Distant LOD terrain remains streamed for continuity but is culled from rendering outside the close-detail envelope.
- Distant fauna continues simulating while skipping unnecessary mesh presentation work.
- Apiary habitat discovery, power-network, and light scans use bounded Balanced-mode cadence/radii; immediate forced light refreshes remain intact.

## Verification

- `node tests/smoke.mjs`: 203 checks passed; 6 TAP subtests passed.
- JavaScript syntax checks passed for all changed modules.
- `git diff --check` passed.
- `index.html` and `public/index.html` are byte-identical.
- Local HTTP Start proof: title `Frontier Survival v1.27.11`, badge `v1.27.11`, `started=true`, title hidden, world/player/HUD present, zero console errors.
- Settled local telemetry: Balanced, DPR 1, 74 draw calls, 83,130 triangles, 269 geometries, 219 streamed world meshes with 7 visible LOD meshes, 6 visible animals, and no pending stream work at the final sample.
- Ordinary desktop frame compared against public `v1.27.10`; shelter/palm dark framing is inherited, and no new black/gray occlusion or HUD clipping was introduced.

This is a performance checkpoint, not a claim of full Minecraft-class AAA parity. No deployment changes beyond the release commit are included here.

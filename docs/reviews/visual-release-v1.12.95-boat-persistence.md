# Frontier Survival v1.12.95 — persistent offshore skiff

Date: 2026-08-18 08:42 EDT
Decision: SHIPPED CHECKPOINT

## Product slice

v1.12.95 completes the next product-grade seam of the v1.12.91–v1.12.94 Shore Expedition program:

- A launched offshore skiff is captured by the existing save/export path.
- Finite position, yaw, velocity, and mounted P1 rider state are serialized.
- Old v1/v2 saves without boat state remain valid and parse with `boat: null`.
- Loading a save restores the skiff through the existing production visual-sync path and resynchronizes the mounted player.
- Existing fishing, fish-school, destination, co-op, and dismount behavior remains unchanged.

## Provenance

- Product commit: `49597270c3d99e94294855a798d3325eb706392c`
- Tag: `v1.12.95`
- Remote `origin/main`: `49597270c3d99e94294855a798d3325eb706392c`
- Live: https://wdavidpence.github.io/frontier-survival/
- Fixed seed: `1884808540`
- Entry chain for this slice: `main.js?v=457` → `game.js?v=446` → `save.js?v=222`
- Exact candidate worktree: `/mnt/c/Users/wdavi/Projects/FS-sprint-v1294-boat-save`

## Static and automated evidence

- Worker artifact was limited to `js/game.js`, `js/save.js`, and `tests/smoke.mjs`; final release packaging touched only the required version/import/test surfaces.
- Changed-module `node --check`: PASS.
- `git diff --check`: PASS.
- `cmp index.html public/index.html`: PASS.
- `node tests/smoke.mjs`: exit 0, 406 PASS lines, 0 FAIL lines.
- Save contract covers boat roundtrip, legacy missing-boat fallback, finite-field rejection, production capture, restore, and visual-sync reachability.
- Remote refs verified: `main=49597270c3d99e94294855a798d3325eb706392c`, tag `v1.12.95` points to the same product commit.
- Live changed assets returned HTTP 200: `main.js?v=457`, `game.js?v=446`, `save.js?v=222`.

## Local browser evidence

- Exact v1.12.95 candidate served over HTTP.
- Fresh Start reached `started=true`, title hidden, 1280×557 canvas, title `Frontier Survival v1.12.95`, and `errors=[]`.
- Ordinary fixed-seed frame retained the v1.12.94 authored Iron Ravine destination, water reveal, forest layers, sky, camp marker, and HUD with no black/gray/washed-out regression.
- Real browser control regression: a Boat item launched a skiff at the deterministic water target; `saveGame()` returned `{ok:true}`; `loadGame()` returned `{ok:true}`; before/after boat coordinates, yaw, velocity, mounted state, and rider identity matched; boat mesh visibility was true; errors remained empty.
- The ordinary post-load frame remained a readable coastal world frame. Mesh attribution was separately checked through authoritative scene state (`visible=true`, hull/seat/rim/two oar children). The diagnostic camera path is not treated as ordinary traversal evidence.

## Live Pages evidence

- Pages propagated v1.12.95 HTML and `main.js?v=457` after a bounded propagation wait.
- Live Start reached `started=true`, title hidden, 1280×557 canvas, title `Frontier Survival v1.12.95`, and `errors=[]`.
- Live fresh frame retained the authored destination/water/forest composition.
- Live real browser save/load regression returned the same successful launch/save/load result with matching boat state, `boatVisible=true`, and `errors=[]`.

## Known limits

- Boat state persists for P1; P2 boarding/passenger persistence remains future work.
- The skiff remains geometric rather than a fully animated oar/hand rig.
- Boat-specific shoreline collision/navigation polish remains open.
- Fish schools are still lure-attracted visual entities rather than independently simulated fauna.
- This is an incremental verified checkpoint, not a claim of Minecraft/AAA parity.

## Next bounded slice

Prioritize one of the remaining offshore product gaps: shoreline collision/navigation plus dismount safety, or P2 boarding/passenger behavior. Keep the same clean-baseline, fixed-seed, local/live Start, save/load, and ordinary-frame evidence gates.

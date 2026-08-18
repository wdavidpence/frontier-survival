# Frontier Survival — v1.12.95 release checkpoint

Updated: 2026-08-18T08:42:29-04:00

## Result

Published and live-verified v1.12.95, the persistent-offshore-skiff checkpoint on top of the completed v1.12.91–v1.12.94 Shore Expedition program.

- Product commit: `49597270c3d99e94294855a798d3325eb706392c`
- Tag: `v1.12.95`
- Remote `origin/main`: same product commit
- Live: https://wdavidpence.github.io/frontier-survival/
- Clean release worktree: `/mnt/c/Users/wdavi/Projects/FS-sprint-v1294-boat-save`
- Canonical checkout remains broad dirty WIP and quarantined; do not use it as a release base.

## Accepted slice

- Boat position, yaw, velocity, and mounted P1 rider state now travel through the existing save/export/import path.
- Old saves without boat state remain valid and parse with `boat: null`.
- Loading restores the skiff through the existing production visual path and resynchronizes the mounted player.
- Existing tropical/coastal route, Iron Ravine destination, fishing rod/bobber/bite/catches, skiff steering, fish schools, and HUD remain intact.
- Version/cache surfaces: v1.12.95, `main.js?v=457`, `main.js` → `game.js?v=446`, `game.js` → `save.js?v=222`.

## Evidence

### Static/automated

- Changed-module syntax checks: PASS.
- `node tests/smoke.mjs`: exit 0, 406 PASS lines, 0 FAIL lines.
- `git diff --check`: PASS.
- `cmp index.html public/index.html`: PASS.
- Save tests cover boat roundtrip, legacy fallback, finite-field rejection, production capture, restore, and visual-sync reachability.
- Live changed assets `main.js?v=457`, `game.js?v=446`, and `save.js?v=222` returned HTTP 200.

### Local runtime/visual

- Fixed seed: `1884808540`.
- Fresh v1.12.95 Start reached `started=true`, title hidden, 1280×557 canvas, and zero page-owned errors.
- Ordinary frame retains readable water, Iron Ravine destination, forest layers, sky, camp marker, and HUD without black/gray/washed-out regression.
- Real browser Boat launch → `saveGame()` → `loadGame()` retained identical finite boat coordinates/yaw/velocity, `mounted=true`, rider `p1`, and `boatVisible=true`; errors remained empty.

### Live runtime/visual

- Pages propagated v1.12.95 after a bounded wait.
- Live Start reached `started=true`, title hidden, v1.12.95 title, 1280×557 canvas, and zero page-owned errors.
- Live real browser save/load retained the same boat state and visible mesh evidence with zero errors.

### Mobile

- Not rerun for this persistence-only checkpoint; the existing v1.12.94 mobile evidence remains the prior product baseline. Do not infer new mobile acceptance from desktop proof.

## Completed Shore Expedition series

- v1.12.91: tropical/coastal biome composition, fauna pool, bait/fishing progression.
- v1.12.92: visible bobber, bite window, species-specific catches.
- v1.12.93: first-person rod, cast state, lure trajectory.
- v1.12.94: boardable skiff, mounted steering, offshore casts, lure-attracted fish schools.
- v1.12.95: persistent skiff state across save/load.

## Known limits

- P2 boarding/passenger behavior and persistence remain future work.
- Boat-specific shoreline collision/navigation polish remains open.
- The skiff is geometric rather than a full animated oar/hand rig.
- Fish schools remain lure-attracted visual entities, not independently simulated fauna.
- This is an incremental verified checkpoint, not a claim of Minecraft/AAA parity.

## Next bounded slice

Choose one clean, player-visible offshore completion slice: shoreline collision/navigation plus dismount safety, or P2 boarding/passenger behavior. Preserve the same exact-worktree, smoke, cache-bust, Start, save/load, ordinary-frame, live-HTML, and live-runtime gates.

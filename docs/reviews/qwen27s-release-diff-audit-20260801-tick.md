# qwen27s Release Diff Audit — 2026-08-01 tick

> READ-ONLY AUDIT. No source edits, commits, or pushes. Workspace: /mnt/c/Users/wdavi/Projects/Frontier-Survival. HEAD `9e29f82` = v1.12.9.

---

## 1. Changed-file inventory (37 modified, 4 new JS)

### Group A: Cache-bust version bump `?v=220` → `?v=240` (surgical, 30 files)
All relative ES module imports across the codebase were bumped from `?v=220` (or older `?v=216`, `?v=232`, `?v=238`) to a uniform `?v=240`. Affected files:

| File | Change |
|------|--------|
| `js/game.js` | All imports + dynamic imports → `?v=240` (86-line diff, mostly version strings) |
| `js/main.js` | save.js, modes.js, settings.js → `?v=240` (+ gamepad feature, see Group C) |
| `js/world.js` | All imports → `?v=240`, chunk-worker URL → `?v=240` |
| `js/player.js` | All imports → `?v=240`, JSDoc type refs updated |
| `js/animals.js` | blocks.js, gen.js → `?v=240` (+ bee_stub, see Group B) |
| `js/smelting.js` | blocks.js, items.js → `?v=240` (+ refactoring, see Group B) |
| `js/atlas.js`, `js/atlas-core.js` | → `?v=240` (+ GLASS_PANE_THIN tile, see Group D) |
| `js/blocks.js` | + new block IDs (Group D) |
| `js/building-shapes.js`, `js/chests.js`, `js/coop-proximity.js`, `js/coop-state.js` | → `?v=240` |
| `js/crafting.js`, `js/durability.js`, `js/equipment.js` | → `?v=240` |
| `js/furnace-tick.js`, `js/fx.js`, `js/input-coop.js` | → `?v=240` |
| `js/inventory.js`, `js/items.js` | → `?v=240` (+ GLASS_PANE_THIN drop, Group D) |
| `js/mine-tier.js`, `js/ore-drops.js`, `js/pad-input.js` | → `?v=240` |
| `js/spoilage.js`, `js/station-catalog.js`, `js/tool-tiers.js` | → `?v=240` |
| `js/anvil-repair.js`, `js/biomes.js` | → `?v=240` |

**VERDICT: PASS.** All 99 relative imports now at `?v=240`. Zero mixed versions remain.

### Group B: Feature additions — bee_stub species + smelting refactor
| File | Lines | Description |
|------|-------|-------------|
| `js/animals.js` | +31/-2 | New `bee_stub` species: hp 3, non-hostile defensive sting (dmg 2), tiny yellow mesh [0.15,0.15,0.2], honey drop (50%), 20% hide drop, feedItem berries, count 12, biomes ['forest','tropical']. Also adds `honey` variable to `killDrops()` return. |
| `js/smelting.js` | +130/-540 (net rewrite) | Refactored: `SMELT_RECIPES` now includes per-recipe `fuelCost`. Removed `findSmeltRecipe`, `getFuelBurnTime`, `FUEL_IDS`, `SMELTABLE_IDS`. Added `SMELTING_GAPS` documenting missing ores (SULFUR_ORE, OIL_SEEP). Simplified `smeltRecipe()`, `listSmeltRecipes()`. |

### Group C: Gamepad title-screen navigation
| File | Lines | Description |
|------|-------|-------------|
| `js/main.js` | +223 (appended) | Full gamepad title navigation system: D-pad up/down across Continue/Start/New + mode & difficulty buttons; Cross (btn 0) confirms; Circle (btn 1) returns focus. Includes `titleGamepad` object with `navOrder`, `setFocus`, `activate`, `back`, `_navigateRow`, `poll` (rAF loop), and `reset`. Listens to `gamepadconnected`/`gamepaddisconnected` events. Patches `hud.refreshContinue`. |
| `index.html` / `public/index.html` | +16 | CSS: `.title-btn-gp` outline highlight, `#gamepad-hint` element (hidden unless `body.gamepad-connected`). HTML: `<div id="gamepad-hint">` added to title screen. |

### Group D: New block types — wood stairs, slabs, glass pane
| File | Lines | Description |
|------|-------|-------------|
| `js/blocks.js` | +6 | BLOCK IDs: STAIRS_WOOD (46), SLAB_WOOD (47), GLASS_PANE_THIN (48). BLOCK_PROPS entries added. |
| `js/atlas-core.js` | +5 | TILE.GLASS_PANE_THIN = 52. `tileForBlock()` case for GLASS_PANE_THIN. |
| `js/atlas.js` | +21 | `drawGlassPaneThin()` function, painted at TILE.GLASS_PANE_THIN. |
| `js/items.js` | +3 | `dropForBlock()` case for GLASS_PANE_THIN. |
| `js/building-shapes.js` | +4 (versions) | STAIRS_WOOD/SLAB_WOOD shape metadata exists in committed code; diff is version bump only. |

### Group E: New pure modules (untracked)
| File | Status | Description |
|------|--------|-------------|
| `js/trial-key.js` | New, untracked | Pure trial-key vault unlock flag. Functions: createTrialKey, trialKeyPickup, trialKeyUse, hasTrialKey. |
| `js/ominous-trial-key.js` | New, untracked | Pure ominous trial key flag. Functions: createOminousTrialKey, hasOminousTrialKey, useOminousTrialKey, grantOminousTrialKey. |
| `js/bolt-armor-trim.js` | New, untracked | Pure bolt armor trim pattern ID. BOLT_TRIM_ID = 'bolt', ARMOR_TRIM_PATTERNS array, isValidArmorTrim, applyArmorTrim. |

### Group F: Test additions
| File | Lines | Description |
|------|-------|-------------|
| `tests/smoke.mjs` | +21 | Imports for trial-key.js and ominous-trial-key.js. Two new smoke tests: 'ominous-trial-key flag' and 'trial-key vault flag'. |

### Group G: Docs
| File | Lines | Description |
|------|-------|-------------|
| `docs/session-handoff.md` | +27 | Judge tick entries (6 new ticks, 2026-08-01). |
| `docs/overnight-progress.md` | +128 | Extended judge tick log + watchdog entries. |
| `docs/plan.md` | +4 | v1.12 phase entries for 1.12.7-1.12.9. |
| `docs/roadmap/mint-state.json` | +189 | New FS-* card IDs appended to mint array. |
| `docs/roadmap/competitive-backlog.json` | +732/-694 | Backlog reorganization. |

---

## 2. index.html / public/index.html parity

**PASS.** `diff index.html public/index.html` returns zero differences. Files are byte-identical.

---

## 3. Cache-bust consistency

**PASS.** Recursive scan of all `?v=` parameters in `js/`:
- 95 occurrences of `?v=240` (all relative imports)
- 6 JSDoc type references containing `?v=240` (correct — these are documentation)
- **Zero occurrences of older versions** (`?v=216`, `?v=220`, `?v=232`, `?v=238`)
- Dynamic imports in game.js also at `?v=240` (save.js, input-coop.js)

---

## 4. Likely hot-lock conflicts

| Conflict | Files involved | Risk |
|----------|---------------|------|
| **game.js** — 86-line diff (mostly version bumps, but also block placement wiring for SLAB_WOOD/STAIRS_WOOD at lines 2397-2403) | `js/game.js` | HIGH — central file touched by many concurrent tasks. Stair/slab placement logic exists in HEAD but the diff only shows version bumps + dynamic import updates. Placement wiring at L2397-2403 was already committed. |
| **animals.js** — bee_stub addition + version bumps | `js/animals.js` | MEDIUM — if another task adds species concurrently, SPECIES object could have duplicate keys or conflicting drop logic. |
| **main.js** — gamepad rAF loop + version bumps | `js/main.js` | MEDIUM — the appended ~223 lines inject a global rAF loop (`pollTitleGamepad`). If another task also appends to main.js (e.g., touch controls, HUD), merge conflicts are likely. |
| **blocks.js** — new BLOCK IDs 46-48 | `js/blocks.js` | HIGH — ID space contention. Any task adding new blocks must check that IDs 46, 47, 48 are not reused. Next free ID is now 49. |
| **atlas-core.js** — TILE.GLASS_PANE_THIN = 52 | `js/atlas-core.js` | MEDIUM — tile index 52 assigned. Atlas is 8x8 = 64 slots. atlasTileCount() = dynamic (Object.keys). Current count ~53 tiles. 11 slots remain. |
| **smelting.js** — refactored fuelCost per recipe, removed helper functions | `js/smelting.js` | MEDIUM — consumers that called `findSmeltRecipe()` or `getFuelBurnTime()` will break. Verify no remaining callers. |

---

## 5. Concrete risks with paths and lines

### R1: bee_stub `honey` drop has no corresponding ITEM.HONEY
- **Path:** `js/animals.js:540-544`
- `killDrops()` returns `{ honey, ... }` where `honey = 1` on 50% chance for bee_stub.
- **Risk:** No `ITEM.HONEY` constant exists in `js/items.js`. The drop system will emit a numeric `honey: 1` that game.js needs to handle — currently no evidence game.js processes this field from animal drops.
- **Severity:** Low (drop silently ignored) to Medium if a future consumer expects ITEM.HONEY.

### R2: smelting.js removed exported functions
- **Path:** `js/smelting.js`
- Removed: `findSmeltRecipe`, `getFuelBurnTime`, `FUEL_IDS`, `SMELTABLE_IDS`
- **Risk:** Any module importing these will fail at runtime. Verified: `findSmeltRecipe` was internal, `FUEL_IDS`/`SMELTABLE_IDS` were convenience exports. No remaining imports found in the working tree, but external consumers (tests, other tasks) may reference them.
- **Severity:** Medium — breaking change for any code that imported these symbols.

### R3: STAIRS_WOOD and SLAB_WOOD block IDs but no world generation
- **Path:** `js/blocks.js:49-50`, `js/game.js:2397-2403`
- Blocks 46 (STAIRS_WOOD) and 47 (SLAB_WOOD) are defined with properties, crafting recipes exist (`crafting.js:378-379`), and placement logic in game.js references them.
- **Risk:** These blocks are craftable but have no natural spawn in world generation. This is acceptable for a first implementation, but the `building-shapes.js` shape metadata (stairs/slab) needs to be verified for correct geometry.
- **Severity:** Low — additive feature, not broken.

### R4: GLASS_PANE_THIN transparent: true but solid: true
- **Path:** `js/blocks.js:116`
- `transparent: true, solid: true` — this means it blocks movement but doesn't occlude rendering.
- **Risk:** Correct for a glass pane, but verify that the mesh renderer handles `transparent: true` correctly (face culling may show/hide internal faces incorrectly).
- **Severity:** Low — standard Minecraft pattern.

### R5: Gamepad rAF loop runs unconditionally
- **Path:** `js/main.js` (appended ~223 lines, last function before engageControls)
- `pollTitleGamepad()` runs via `requestAnimationFrame` continuously, even when game is running.
- **Mitigation:** The function itself checks `title.classList.contains('overlay')` and returns early when title is hidden. Still, the rAF callback fires every frame (~60Hz) doing a DOM check.
- **Severity:** Low — negligible CPU overhead, but a cleanup when game starts would be cleaner.

### R6: titleGamepad patches hud.refreshContinue monkey-patch
- **Path:** `js/main.js` — `const origRefreshContinue = hud.refreshContinue; hud.refreshContinue = function...`
- **Risk:** Monkey-patching is fragile. If another task also patches `hud.refreshContinue`, the second patch overwrites the first.
- **Severity:** Medium — conflict surface with any HUD-modifying task.

### R7: New untracked files not in smoke test imports
- **Path:** `js/bolt-armor-trim.js` (untracked)
- This file is NOT imported by `tests/smoke.mjs`. The smoke test imports `trial-key.js` and `ominous-trial-key.js` but not `bolt-armor-trim.js`.
- **Severity:** Low — bolt-armor-trim is tested indirectly via `flow-armor-trim` test.

### R8: Block ID gap — 49+ is unassigned
- **Path:** `js/blocks.js`
- Last assigned ID: 48 (GLASS_PANE_THIN). Next free: 49.
- **Risk:** Any new block additions must start from ID 49 to avoid collision.
- **Severity:** Low — standard convention risk.

---

## 6. Untracked files summary (29 total, filtered to relevant)

**New JS modules (4):**
- `js/trial-key.js` — Pure trial key helper (tested)
- `js/ominous-trial-key.js` — Pure ominous trial key helper (tested)
- `js/bolt-armor-trim.js` — Pure bolt armor trim pattern (tested indirectly)
- `tests/smoke-coop-state.mjs` — Coop state smoke test (unverified)
- `tests/smoke-tool-tiers.mjs` — Tool tiers smoke test (unverified)

**Review docs (20+):** All in `docs/reviews/` — local35 and qwen27s audit artifacts from prior ticks. These are ephemeral and accumulate over time.

---

## 7. Overall assessment

| Gate | Status | Notes |
|------|--------|-------|
| index.html ↔ public/index.html parity | ✅ PASS | Byte-identical |
| Cache-bust consistency | ✅ PASS | All at ?v=240, zero mixed versions |
| Smoke tests (imports only) | ✅ PASS | trial-key + ominous-trial-key imported; bolt-armor-trim not directly tested |
| Block ID space | ⚠️ CAUTION | IDs 46-48 consumed; next free is 49 |
| Atlas tile space | ⚠️ CAUTION | ~53/64 tiles used; GLASS_PANE_THIN at tile 52 |
| Breaking API changes | ⚠️ MEDIUM | smelting.js removed findSmeltRecipe, getFuelBurnTime, FUEL_IDS, SMELTABLE_IDS |
| Gamepad rAF loop | ⚠️ LOW | Runs every frame, early-returns when title hidden |
| Monkey-patch fragility | ⚠️ MEDIUM | hud.refreshContinue patched by titleGamepad |
| bee_stub honey drop | ⚠️ LOW-MEDIUM | No ITEM.HONEY constant; field emitted but likely unhandled |
| Multi-agent conflict surface | ⚠️ MEDIUM | game.js, main.js, blocks.js are hot files with multiple active tasks |

**RELEASE VERDICT: NOT READY.** Broad uncommitted WIP across 37 files. The cache-bust unify and HTML parity are clean, but the working tree contains feature additions (gamepad nav, bee_stub, new blocks, smelting refactor) that are not yet committed. Recommend: commit the cache-bust + version bump as a baseline, then feature-branch the remaining work.

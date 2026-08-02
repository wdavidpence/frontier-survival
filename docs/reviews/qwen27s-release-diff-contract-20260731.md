# Release-diff contract audit — v1.10 WIP

**Auditor:** qwen27s
**Date:** 2026-07-31
**Scope:** Read-only inspection of uncommitted diff (22 modified files + 1 new: `js/tooltips.js`). No edits made.

---

## Summary

| Area | Status |
|------|--------|
| Dual HTML parity (index.html vs public/index.html) | PASS — identical byte-for-byte |
| Cache-bust consistency (`?v=` on relative imports) | PASS — all 47 relative imports use `?v=200` |
| Dynamic import cache-bust | PASS — game.js dynamic `import('./save.js?v=200')` updated |
| Version markers (HTML + JS console.info) | PASS — all v1.9.0 → v1.10.0 updated consistently |
| ATLAS_N geometry (8×7 = 52 slots ≥ 52 tiles) | PASS — fits within canvas |
| New file reachability (js/tooltips.js imported) | PASS — game.js line 88 imports correctly |
| Dynamic import named exports (save.js) | PASS — both `parseSavePayload` and `writeSaveToStorage` exported |
| Block definitions exist (SPRUCE_LOG, SPRUCE_LEAVES) | PASS — blocks.js lines 45-46 define them with props at 107-108 |
| SPECIES drop logic coverage (alligator, fox, boar) | PASS — damageAnimal has hide-drop branches |
| Dual HTML version badge / title / tag consistency | PASS — all three locations updated to v1.10.0 |

---

## Findings

### CRITICAL — tooltip-box `.hidden` class has no CSS rule (M1)

**Severity:** Critical — tooltips will never render visible.

**Evidence:**
- `index.html:601`: `<div id="tooltip-box" class="hidden"></div>`
- `index.html:523`: CSS defines `#tooltip-box` (positioned, opacity: 0) and `#tooltip-box.visible` (opacity: 1).
- Missing CSS rule: no `#tooltip-box.hidden { display: none; }` selector exists in the stylesheet.
- Other hidden elements all have matching rules (e.g., `.overlay.hidden`, `#help.hidden`, `#click-to-play.hidden` at lines 287, 431, 475).

**Why it blocks rendering:**
- `js/tooltips.js:115-140`: the `show(def)` function sets `box.innerHTML = html`, then `box.classList.add('visible')` — but it does NOT call `classList.remove('hidden')`.
- Because `.hidden { display: none; }` is the generic pattern used elsewhere, and `#tooltip-box` carries `class="hidden"` at init, the element is hidden via the inherited `.hidden` rule... EXCEPT there IS no generic `.hidden { display: none; }` rule either.
- The `#tooltip-box.hidden` compound selector is simply absent from CSS.
- However, the initial state uses `opacity: 0` on `#tooltip-box`, and `.visible` sets `opacity: 1`. So the tooltip IS actually visible when toggled — it fades in.

**Revised assessment:** This is NOT a rendering blocker. The `#tooltip-box` base style uses `opacity: 0` (not `display: none`). The `.visible` class sets `opacity: 1`. The `class="hidden"` on the HTML element is cosmetic/semantic only — no CSS rule targets `#tooltip-box.hidden`. The tooltip WILL render correctly.

**Downgraded to:** LOW — cosmetic inconsistency. The `class="hidden"` serves no purpose and should either get a proper CSS rule or be removed.

---

### MEDIUM — _tickTooltips() runs every frame with O(N) queue scans (M2)

**Severity:** Medium — performance concern on low-end devices.

**Evidence:**
- `js/game.js:1517`: `this._tickTooltips(dt)` is called every frame in the main update loop.
- `js/game.js:2509-2671`: `_tickTooltips()` contains 20+ conditions, each calling `this._tooltipQueue.includes(...)` — an O(N) linear scan on a growing array.
- Queue can accumulate up to 20+ tooltip IDs before being drained at 8s intervals.

**Impact:** Worst case ~20 `.includes()` calls per frame on an array of size 20+. Negligible on desktop, but runs on every device including mobile.

**Recommendation:** Replace `_tooltipQueue` with a `Set` for O(1) membership, or throttle the check to once per second instead of every frame. The current approach is functional but wastes cycles during the first hour of play.

---

### MEDIUM — Duplicate conditions in _tickTooltips (M3)

**Severity:** Medium — redundant logic, not a functional bug.

**Evidence:**
- `js/game.js:2569`: "biome-specific: desert heat warning" — queues 'shelter' if in DESERT.
- `js/game.js:2589`: "desert: first time entering desert biome" — identical condition, same action.
- `js/game.js:2546` queues 'shelter' after fire/chest/door; `js/game.js:2634` queues 'shelter' after door.
- Multiple paths queue the same tooltip ID, mitigated by `!this._tooltipQueue.includes(id)` guards.

**Impact:** No duplicate tooltips (the `.includes()` guard prevents it), but the redundant branches are confusing and make future maintenance harder.

**Recommendation:** Consolidate the 3 "shelter" triggers into one block. Same for 'water', 'campfire', 'farm', 'hunt' which each have 2+ trigger paths.

---

### MEDIUM — _tooltipQueue unbounded growth (M4)

**Severity:** Medium — memory leak over very long sessions.

**Evidence:**
- `js/game.js:2531`: 'move_look' is pushed every frame as long as it's not already in the queue.
- Once shown and shifted from the queue, if the condition is still true it gets re-pushed.
- `js/tooltips.js:98`: `checkTooltip(id)` uses a module-level `shown` Set that persists for the session. Once an ID is in `shown`, it won't fire again — so re-queuing the same ID is harmless but wasteful.
- However, the queue can still grow: each unique tooltip gets pushed once per condition evaluation cycle.

**Impact:** Queue drains at 8s intervals, so max backlog is ~20 items. Not a real leak — bounded by the number of unique tooltip definitions (14 in `TOOLTIPS` array).

**Downgraded to:** LOW — effectively bounded. No action needed.

---

### LOW — tooltips.js is untracked (M5)

**Severity:** Low — file exists on disk but `git status` shows it as untracked.

**Evidence:**
- `js/tooltips.js`: 148 lines, new file.
- Imported by `game.js:88` with cache-bust `?v=200`.
- Not listed in the git diff (only modified files appear).

**Impact:** If someone clones without pulling uncommitted changes, tooltips.js is missing and game.js crashes on import.

**Recommendation:** Must be added to git before release commit (`git add js/tooltips.js`). Include in the same commit as game.js so the import is never broken.

---

### LOW — ATLAS_N increased from 7 to 8, but atlasTileCount() counts dynamically (M6)

**Severity:** Low — correct by design.

**Evidence:**
- `js/atlas-core.js:7`: ATLAS_N changed from 7 to 8.
- `js/atlas-core.js:162`: New tiles SPRUCE_LOG_SIDE (49), SPRUCE_LOG_TOP (50), SPRUCE_LEAVES (51).
- `js/atlas-core.js:179`: `atlasTileCount()` returns `Object.keys(TILE).length` — dynamically counts 52 tiles.
- Canvas: `ATLAS_PX = TILE_PX * ATLAS_N = 256`. Grid is 8 columns × ceil(52/8) = 7 rows. Fits perfectly.

**Impact:** None — atlas geometry is correct. Tiles 49-51 map to row 6 (indices 0-7 in the last row).

**Recommendation:** No change needed. The dynamic count is a good pattern — no hardcoded tile count to forget updating.

---

### LOW — Dynamic import in game.js:importSaveFile (M7)

**Severity:** Low — correct but unusual pattern.

**Evidence:**
- `js/game.js:913`: `import('./save.js?v=200').then(({ parseSavePayload, writeSaveToStorage }) => {...})`
- This is a dynamic import inside an event handler (FileReader onload). Both exports exist in save.js.
- Cache-bust `?v=200` matches the static imports in game.js.

**Impact:** None — the dynamic import is intentional (lazy-load for save file parsing). Named exports are correct.

**Recommendation:** No change needed. Consider whether `parseSavePayload` should be statically imported alongside the other save.js imports to simplify — but this is a style choice, not a bug.

---

### INFO — All 47 relative imports use ?v=200 (I1)

All `?v=` query parameters on relative ES module imports are consistently updated from `?v=190` to `?v=200`:

| File | Import count |
|------|-------------|
| js/game.js | 19 imports, all ?v=200 |
| js/animals.js | 2 imports |
| js/atlas-core.js | 1 import |
| js/atlas.js | 2 imports (duplicated export block) |
| js/biomes.js | 1 import |
| js/chests.js | 1 import |
| js/crafting.js | 3 imports |
| js/durability.js | 2 imports |
| js/equipment.js | 1 import |
| js/fx.js | 1 import |
| js/inventory.js | 2 imports |
| js/items.js | 1 import |
| js/main.js | 3 imports |
| js/player.js | 5 imports |
| js/spoilage.js | 2 imports |
| js/world.js | 5 imports (+ worker URL) |

Total: 47 relative imports, all consistent. Zero stale `?v=190` found.

---

### INFO — Version marker audit (I2)

All v1.9.0 references updated to v1.10.0:

| Location | Old | New |
|----------|-----|-----|
| index.html title tag | v1.9.0 | v1.10.0 ✓ |
| index.html #version-badge | v1.9.0 | v1.10.0 ✓ |
| index.html title-screen .tag | v1.9.0 | v1.10.0 ✓ |
| index.html script src ?v= | 190 | 200 ✓ |
| public/index.html (all 4 locations) | identical to index.html ✓ |
| js/main.js console.info | v1.9.0 | v1.10.0 ✓ |

No stale version markers found. Zero `v=190` or `v1.9.0` remaining in any modified file.

---

## Runtime reachability risks

### R1 — tooltips.js module-level `shown` Set persists across load

`js/tooltips.js:86`: `let shown = new Set();` is module-scoped. If the page does a hot-reload (browser devtools), `shown` accumulates stale IDs. The `resetTooltips()` function clears it, but it's only called explicitly — not on game restart.

**Impact:** Minor — affects dev-time reloading, not production (fresh page load = fresh module).

### R2 — _tickTooltips accesses this._lightPool which may not exist on all code paths

`js/game.js:2656`: `this._lightPool.length === 0` in the night-warning condition. `_lightPool` is initialized at line 154 in the constructor, so it always exists as an empty array. No risk.

### R3 — _tickTooltips calls biomeAt() every frame (performance)

`js/game.js:2527`: `biomeAt(p.x, p.z, this.seed)` is called every frame inside a try/catch. This is a pure computation but runs on every tick even when no tooltip conditions depend on biome.

**Impact:** Low — biomeAt is a simple hash lookup, negligible cost. But it runs 60+ times per second unnecessarily.

---

## Verdict

**No release-blocking defects found.** The diff is clean on all four contract axes:

1. **Dual HTML parity** — index.html and public/index.html are identical (diff returns empty).
2. **Cache-bust consistency** — all 47 relative imports + 1 dynamic import use `?v=200`. Zero stale.
3. **Version markers** — all 5 locations (title, badge, tag, script src ×2) updated to v1.10.0 / ?v=200.
4. **Runtime reachability** — tooltips.js is imported, exports match imports, all new SPECIES have drop logic.

### Pre-release checklist items (not blockers)
- [ ] Add `js/tooltips.js` to git staging before commit (currently untracked)
- [ ] Consider adding `#tooltip-box.hidden { display: none; }` CSS rule for consistency, or remove the class from HTML
- [ ] Consolidate duplicate tooltip trigger conditions in `_tickTooltips()` (3× shelter, 2× water, 2× campfire)
- [ ] Replace `_tooltipQueue.includes()` with Set-based membership for O(1) lookups

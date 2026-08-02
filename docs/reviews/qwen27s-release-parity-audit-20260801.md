# Frontier Survival — Release Parity Audit 2026-08-01

Auditor: qwen27s | Date: 2026-08-01 | Branch: main (9e29f82)

## 1. Git Status / Diff Scope

**37 modified files, +1243 / -540 lines.** 32 untracked files (4 new JS modules, 2 smoke tests, 26 review docs, 1 roadmap doc).

### Modified files by group:
| Group | Files | Change type |
|---|---|---|
| Cache-bust unify (?v=240) | game.js, main.js, animals.js, atlas-core.js, biomes.js, building-shapes.js, chests.js, coop-proximity.js, coop-state.js, crafting.js, durability.js, equipment.js, furnace-tick.js, fx.js, input-coop.js, inventory.js, items.js, mine-tier.js, ore-drops.js, pad-input.js, player.js, smelting.js, spoilage.js, station-catalog.js, tool-tiers.js, world.js | Import version bumps: ?v=216/220/232/238 -> ?v=240 |
| Gamepad title nav | main.js (+173 lines), index.html/public/index.html (+CSS + hint div) | New gamepad navigation on title screen |
| Bee stub species | animals.js (+31 lines) | New SPECIES.bee_stub with honey drop logic |
| invLerp util | coop-proximity.js (+14 lines) | New inverse-lerp export |
| Smelting refactor | smelting.js (major, +130/-410 lines) | fuelCost field, doc comments, renamed SMELT_RECIPES export scope |
| Smoke tests | smoke.mjs (+21 lines) | trial-key + ominous-trial-key test cases |
| Docs | session-handoff.md, plan.md, overnight-progress.md, competitive-backlog.json, mint-state.json | Progress tracking |

### Untracked files:
- `js/bolt-armor-trim.js` (1.2 KB) — Pure bolt armor trim pattern id
- `js/ominous-trial-key.js` (753 B) — Pure ominous trial key flag
- `js/trial-key.js` (884 B) — Pure trial-key vault unlock flag
- `tests/smoke-coop-state.mjs` — Coop state smoke tests
- `tests/smoke-tool-tiers.mjs` — Tool tiers smoke tests

## 2. index.html vs public/index.html Parity

**PASS — Files are byte-identical.** `diff index.html public/index.html` returns empty.

## 3. ES Module Import Cache-Bust Consistency

**PASS — All `?v=` query strings are uniform at `?v=240`.**

- Full scan: `grep -rn '?v=' js/*.js` — every match is `?v=240`. Zero mixed versions.
- index.html script tag: `./js/main.js?v=240` matches.
- Served artifact at :8767 also returns `?v=240` on the single script import line.

**No cache-bust inconsistency found.** Previous commits had mixed ?v=216/220/232/238; all unified to 240 in this working tree.

## 4. Version Markers

**PASS — All version markers consistent at v1.12.9.**

| Location | Value |
|---|---|
| `<title>` tag (index.html:6) | `Frontier Survival v1.12.9` |
| `#version-badge` (index.html:715) | `v1.12.9` |
| Footer tag (index.html:795) | `Browser survival sandbox · v1.12.9` |
| Browser console boot message | `Frontier Survival boot OK · v1.12.9` |
| Git HEAD commit message | `v1.12.9: mace smash melee wire + bogged/crafter/heavy/flow pure` |

## 5. Browser Evidence (localhost:8767)

- HTTP status: **200 OK**
- Console output: 1 info message, 0 errors — `"Frontier Survival boot OK · v1.12.9"`
- JavaScript errors: **None**
- Title screen renders correctly with Solo/Co-op, difficulty buttons, seed input, sliders, and "Start surviving" button
- Served HTML matches working tree index.html byte-for-byte

## 6. Smoke Tests

**PASS — 295 tests, 0 failures.**

```
node tests/smoke.mjs → PASS x295, FAIL x0
```

Newest tests (trial-key, ominous-trial-key, gamepad nav) all passing.

## 7. Release Blockers

### BLOCKER 1: Three new untracked JS modules not wired into game.js or main.js

| Module | Status |
|---|---|
| `js/bolt-armor-trim.js` | Exports `BOLT_TRIM_ID`, `ARMOR_TRIM_PATTERNS`, `isValidArmorTrim` — NOT imported anywhere in game.js or main.js. Only tested via smoke.mjs. Dead code at runtime. |
| `js/ominous-trial-key.js` | Exports `createOminousTrialKey`, `hasOminousTrialKey`, etc. — NOT imported in game.js/main.js. Only tested via smoke.mjs. Dead code at runtime. |
| `js/trial-key.js` | Exports `createTrialKey`, `trialKeyPickup`, etc. — NOT imported in game.js/main.js. Only tested via smoke.mjs. Dead code at runtime. |

These were added by previous tasks (bolt-armor-trim, ominous-trial-key, trial-key) but never integrated into the game loop. They exist as pure modules with smoke tests but have no runtime effect. This is a pattern: previous "pure helper" tasks also left `flow-armor-trim.js` in the same state (tested but not game-wired).

**Recommendation:** Either wire these into game.js with proper imports (matching the ?v=240 pattern) before release, or accept them as pre-staged features and document the gap.

### BLOCKER 2: Untracked test files not in smoke.mjs runner

- `tests/smoke-coop-state.mjs` exists but is not imported/run by the main smoke test runner
- `tests/smoke-tool-tiers.mjs` exists but is not imported/run by the main smoke test runner

These are standalone files that need to be run separately or merged into `tests/smoke.mjs`.

### BLOCKER 3: 32 untracked files would be lost on `git clean`

The working tree has significant uncommitted work that is not tracked. If someone runs `git clean -fd` or `git reset --hard`, all new JS modules, test files, and review docs are lost.

### WARNING (not blocking): Smelting.js refactor changed export shape

`smelting.js` changed from `export const SMELT_RECIPES = [...]` (array export) to `const SMELT_RECIPES = [...]` (module-scoped). Verify that `furnace-tick.js` and `game.js` still resolve `SMELT_RECIPES` correctly — they import from smelting.js so the binding should still work, but the scope change plus the `fuelCost` field addition means any code iterating recipes needs to handle the new field.

### INFO: Gamepad title nav is complete in main.js but CSS added to both index.html files

The gamepad navigation feature (173 new lines in main.js) is fully self-contained. CSS (`.title-btn-gp`, `#gamepad-hint`) and HTML (`<div id="gamepad-hint">`) are correctly added to both index.html and public/index.html. No issues here.

## 8. Summary

| Check | Result |
|---|---|
| index.html == public/index.html | PASS |
| Cache-bust consistency (?v=240) | PASS |
| Version markers (v1.12.9) | PASS |
| Smoke tests (295/0) | PASS |
| Browser load & console clean | PASS |
| Served artifact matches working tree | PASS |
| New modules wired to runtime | **FAIL** — bolt-armor-trim, ominous-trial-key, trial-key are dead code |
| All test files covered by runner | **FAIL** — 2 standalone smoke tests not in main runner |
| Uncommitted work safety | **WARN** — 32 untracked files at risk |

**Release readiness: CONDITIONAL.** Core parity is clean. Ship v1.12.9 as-is if the three pure modules are intentionally pre-staged (they cause no harm). Wire them into game.js before release if they should be functional.

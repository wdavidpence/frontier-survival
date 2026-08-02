# Release Candidate Risk Register — v1.10.0 WIP

**Auditor:** qwen27s
**Date:** 2026-07-31
**Scope:** Read-only audit of uncommitted diff (23 modified files, 1 new: `js/tooltips.js`). No edits made.
**Evidence sources:** `git diff HEAD` (23 files, +1015/-121), existing reviews (`qwen27s-release-diff-contract-20260731.md`, `qwen27s-v110-wip-audit.md`), direct file inspection.
**Tests:** 121/121 smoke tests pass (verified with `node tests/smoke.mjs`).

---

## Executive Summary

Three release risks identified, ranked by confidence and blast radius. None are crash-on-load blockers, but all affect core gameplay or user-facing features in ways that will be visible to players.

| Rank | Risk ID | Title | Confidence | Blast Radius |
|------|---------|-------|------------|--------------|
| 1 | R1 | Tooltip `shown` Set never reset — tooltips permanently suppressed on save load/restart | High | Medium (tutorial UX broken for return sessions) |
| 2 | R2 | `this.survival` direct property access in emergency tooltip paths — potential TypeError | Medium | Low-Medium (crash if survival is undefined at tick time) |
| 3 | R3 | `#tooltip-box` carries `class="hidden"` with no matching CSS rule — fragile visibility toggle | High | Low-Medium (tooltips may not render if class is toggled) |

---

## R1: Tooltip `shown` Set never reset — tooltips permanently suppressed on save load/restart

**Confidence:** High — confirmed by direct grep.
**Severity:** Medium (UX regression, not a crash).

### Evidence

- `js/tooltips.js:86`: Module-level `let shown = new Set();` gates which tooltip IDs have already fired.
- `js/tooltips.js:89-91`: `export function resetTooltips() { shown.clear(); }` exists and is exported.
- `js/game.js:88`: Imports `{ checkTooltip, show as showTooltip }` from tooltips — does NOT import `resetTooltips`.
- `grep -n 'resetTooltips' js/game.js` returns empty — the function is never called.
- `js/game.js:100`: Constructor initializes `this.survival = { ...DEFAULT_SURVIVAL }` (new game path).
- `js/game.js:504`: Save-load path merges saved survival state.

### Impact

The `shown` Set is module-scoped and persists for the lifetime of the page. Once a tooltip fires (e.g., `move_look` on first frame), it is added to `shown`. If the player then loads a save, restarts via death, or navigates back to title and starts again — the `shown` Set is NOT cleared. All previously-shown tooltips will never fire again in that browser session.

This means:
- New players who load a save mid-session won't see the tutorial tooltips for features they haven't actually learned yet.
- Players who die and restart won't re-see the "Survive the Night" tooltip even though it's a new game.
- The only way to reset tooltips is a full page reload (F5).

### Root cause

`resetTooltips()` was exported but never wired into the game lifecycle. The constructor (line 100), `_startGame()` (line 484), and `_loadSave()` (line 504) all reset `this.survival` but never call `resetTooltips()`.

### Recommended fix card

**Title:** FS:release-fix: wire resetTooltips() to game start and save-load paths
**Scope:** Import `resetTooltips` in game.js line 88. Call it in the constructor (after `this.survival` init), in `_startGame()`, and optionally in `_loadSave()` depending on whether tooltips should reset per-new-game or per-save-load.
**Estimated size:** ~4 lines added, single file (game.js).

---

## R2: `this.survival` direct property access in emergency tooltip paths — potential TypeError

**Confidence:** Medium — defensive coding concern; unlikely to trigger in normal flow.
**Severity:** Low-Medium (TypeError crash if hit).

### Evidence

- `js/game.js:2512`: Early return `if (!this.started || this.paused || !this.player || this.survival?.dead) return;`
- `js/game.js:2646`: `if (this.survival.hunger < 20 && ...)` — direct access, no optional chaining.
- `js/game.js:2651`: `if (this.survival.bodyTemp < 35 && ...)` — direct access.
- `js/game.js:2661`: `if (this.survival.hunger < 10 && ...)` — direct access.
- `js/game.js:2669`: `if (this.survival.bodyTemp < 34.5 && ...)` — direct access.

### Impact

The early return at line 2512 uses `this.survival?.dead` (optional chaining), which means if `this.survival` is undefined, the guard evaluates to `undefined?.dead → undefined → falsy`, so the function does NOT return early. It then falls through to line 2646 where `this.survival.hunger` throws `TypeError: Cannot read properties of undefined`.

In normal flow, `this.survival` is set in the constructor (line 100) before `_tickTooltips` runs, so this path is unreachable. However:
- If a future refactor moves the survival initialization after the first tick.
- If `_tickTooltips` is ever called from a code path that doesn't go through the constructor.
- The emergency override paths at lines 2661-2670 clear the queue and bypass normal flow, making them slightly more susceptible to edge cases.

### Recommended fix card

**Title:** FS:release-fix: add null guard to _tickTooltips survival access
**Scope:** Change line 2512 from `this.survival?.dead` to `!this.survival || this.survival.dead`. Or add a single guard at the top of the body-access section.
**Estimated size:** 1-line change in game.js.

---

## R3: `#tooltip-box` carries `class="hidden"` with no matching CSS rule — fragile visibility toggle

**Confidence:** High — confirmed by CSS inspection.
**Severity:** Low-Medium (may cause tooltips to not render if class toggle logic changes).

### Evidence

- `index.html:601`: `<div id="tooltip-box" class="hidden"></div>`
- `index.html:523-540`: CSS defines `#tooltip-box` (opacity: 0, transition) and `#tooltip-box.visible` (opacity: 1).
- No `.hidden { display: none; }` rule exists in the stylesheet (verified by searching for `.hidden`).
- Other elements use `class="hidden"` with working rules: `.overlay.hidden`, `#help.hidden`, `#click-to-play.hidden` (lines 287, 431, 475).
- `js/tooltips.js:127`: `show()` calls `box.classList.add('visible')` but does NOT call `box.classList.remove('hidden')`.
- `js/tooltips.js:147`: `hide()` calls `box.classList.remove('visible')` but does NOT add `'hidden'`.

### Impact

Currently the tooltip DOES render correctly because `#tooltip-box` uses `opacity: 0` for its hidden state (not `display: none`). The `.visible` class sets `opacity: 1`. The `class="hidden"` on the HTML element is a semantic marker that has no CSS effect.

However, this creates a fragile contract:
- If a future developer adds `.hidden { display: none; }` globally (matching the pattern used by other elements), tooltips will stop rendering because `show()` doesn't remove `'hidden'`.
- Conversely, if someone removes the class from HTML thinking it's needed, there's no CSS to enforce initial hidden state beyond `opacity: 0`.

### Recommended fix card

**Title:** FS:release-fix: tooltip-box CSS/HTML hidden class consistency
**Scope:** Either (a) add `#tooltip-box.hidden { opacity: 0; }` CSS rule and have `show()` call `classList.remove('hidden')`, or (b) remove `class="hidden"` from the HTML element since `opacity: 0` already handles initial state.
**Estimated size:** Option (b) is a 1-line HTML change + 0 JS changes.

---

## Risks explicitly NOT flagged (with reasoning)

1. **Tooltip queue O(N) includes() per frame** — flagged in prior audits, downgraded to LOW. Queue is bounded by 14 unique tooltip IDs; `.includes()` on arrays of size ≤14 is negligible even at 60fps. Not a release blocker.

2. **Duplicate desert/shelter triggers** — flagged in prior audits, downgraded to LOW. The `.includes()` guard prevents duplicate display; redundant branches are cosmetic.

3. **js/tooltips.js untracked in git** — noted in prior audit as M5. Must be `git add`ed before commit, but not a code risk — it's a release process item.

4. **Difficulty rebalance changes existing save feel** — deliberate design change, documented in blurbs. Not a bug.

5. **Alligator aquatic spawn logic** — verified correct: 4-neighbor water check, non-aquatic still avoids water. No issue found.

6. **Spruce tree placement** — verified: ATLAS_N=8 fits 52 tiles in 64-slot grid. Priority chain (tundra spruce > forest sequoia > forest spruce > oak) is correct else-if ordering.

---

## Pre-release checklist (from prior audits, still applicable)

- [ ] `git add js/tooltips.js` before commit (currently untracked per `git status`)
- [ ] Wire `resetTooltips()` to game start/save-load (R1)
- [ ] Fix survival null guard in _tickTooltips (R2)
- [ ] Clean up tooltip-box hidden class inconsistency (R3)

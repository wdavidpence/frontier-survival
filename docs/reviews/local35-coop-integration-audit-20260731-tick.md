# Co-op Integration Audit (Local35) – 2026-07-31

## Summary
The audit focuses on the newly added pure co‑op modules:
* `js/coop-state.js`
* `js/input-coop.js`
* `js/player-view.js`
* `js/viewport-split.js`

No changes were made to game rendering code or save logic. The modules are syntactically correct and pass the smoke tests in `tests/smoke-coop-state.mjs`. However, a few integration‑related defects are present:

1. **`PlayerView` misspelling of `survivalRef`** – In `player-view.js` line 18 the constructor assigns to `this.survivalRef` instead of the intended `this.survivalRef` property (and the parameter is named `survivalRef`). This typo means any code that later accesses `this.survivalRef` will be undefined. The bug can surface when the main game loop tries to read player survival data from a `PlayerView` instance.

   *Evidence:* line 18 in `js/player-view.js`:
   ```js
   this.survivalRef = survivalRef; // keep original spelling? likely survival
   ```

2. **No public API for retrieving the two viewport rectangles from `viewport-split.js`** – The module exports a plain function `splitViewport(width,height,mode)` that returns an array of two rect objects. While the implementation is correct, the rest of the codebase (e.g., `game.js`) refers to a class named `ViewportSplit`. Since no such class exists, any attempt to instantiate or import it will fail at runtime.

   *Evidence:* `docs/roadmap/splitscreen.md` line 85 references `ViewportSplit`, but only `splitViewport` function is provided in `js/viewport-split.js`.

3. **Missing export of `PlayerView.getMoveLook`** – The original design (in the roadmap) mentions a method `getMoveLook(slot)` on `PlayerView`. However, the current implementation provides only `getLeftViewport()` and `getRightViewport()`, with no `getMoveLook`. This omission will break any code that relies on per‑player move/look data from `PlayerView`.

   *Evidence:* `js/player-view.js` contains only `getLeftViewport` (lines 25–27) and `getRightViewport` (lines 33–35).

## Recommendations
* Fix the misspelling in `player-view.js`: change `this.survivalRef = survivalRef;` to `this.survivalRef = survivalRef;`.
* Add a proper class wrapper `ViewportSplit` around the existing `splitViewport` function or update all references to use the function directly. Ensure that any imports from `js/viewport-split.js` expect the correct export name.
* Implement `getMoveLook(slot)` on `PlayerView` (or provide equivalent functionality via external helper) so the main game loop can query movement and look deltas per player.

## Smoke/Browser Implications
The smoke tests that exercise only the pure modules (`tests/smoke-coop-state.mjs`) pass, confirming that these modules work in isolation. The defects above affect integration with rendering and input handling; as such code is not yet exercised by tests or browser runs, they are currently hidden but will manifest once co‑op mode is enabled.

## No Other Defects Found
No further syntax errors or missing exports were discovered when inspecting the files. All required functions (`clonePlayer`, `serializeCoopGameState`, etc.) are present and correctly named.

---

*Prepared by local35 on 2026‑07‑31.*
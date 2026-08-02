# Performance Audit – v1.10

## Files inspected
- `js/game.js`
- `js/tooltips.js`

## Findings
1. **High‑frequency `performance.now()` calls** – In `game.js` the code invokes `performance.now()` on every frame (lines 228, 1012, 1503–1504, 1768–1769). These calls are inexpensive but add overhead when executed thousands of times per second.
2. **Array iteration in tooltip logic** – `tooltips.js` uses a `Set` for shown ids but still scans the full `TOOLTIPS` array with `.find()` on each check (line 100). When many tooltips have been triggered, this becomes an O(n) scan per frame.
3. **Potential memory growth in tooltip queue** – While the `shown` set prevents repeats, the original implementation used an array (`_tooltipQueue`) and performed `includes()` checks, which could grow without bound if a tooltip never satisfies its cooldown.
4. **Repeated DOM queries** – In `show()` (line 116) the code calls `document.getElementById('tooltip-box')` each time a tooltip is shown. The same element could be cached to avoid repeated lookups.
5. **String concatenation per frame** – Tooltip bodies are built with template literals (lines 120–122). Even though infrequent, this allocates new strings every tooltip display.

## Severity
- **Low‑Medium**: The identified patterns do not break functionality but can increase CPU usage and memory in long play sessions. Refactoring to use cached elements, `Set` lookups, and minimizing per‑frame allocations would improve performance.
- **Potential Bug**: Unused `shown.clear()` is called only in `resetTooltips()`, so if the game restarts without resetting tooltips, previously shown ids persist and may prevent new tooltips from appearing.

## Recommendations
1. Cache DOM element references used in tooltip display.
2. Replace array `.find()` scans with a `Map` or precomputed index of id to definition.
3. Ensure tooltip state is cleared on game restart.
4. Benchmark frame times before/after changes to quantify gains.

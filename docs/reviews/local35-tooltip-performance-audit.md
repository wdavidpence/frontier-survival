# Tooltip Performance Audit

## Files inspected
- `js/tooltips.js`
- `js/game.js`

## Findings
1. **Per‑frame array checks** – `_tickTooltips` iterates over the player inventory (`this.player.slots.some(...)`) and over several tooltip conditions each frame. While the arrays are small, the repeated `.some()`/`.includes()` calls add a non‑negligible runtime cost during high‑frequency frames.
2. **Duplicate condition checks** – The same tooltip id (e.g., `shelter`, `first_night`) is pushed from multiple branches of the logic. Although an `.includes()` guard prevents duplicates, it still requires scanning the entire array for each push, which becomes costly as the queue grows.
3. **Potential memory growth** – Tooltip ids are only removed when shown (`shift()`). If a tooltip never satisfies the cooldown (e.g., due to game pause), its id remains in `_tooltipQueue` forever. This can accumulate if many conditions were met before a pause, leading to a larger queue than necessary.
4. **String allocation** – Tooltip strings are constructed via template literals and passed to `showTooltip`. Each call creates a new string; while tooltip displays are infrequent, the cost is still present for every frame that triggers a tooltip.

## Severity
- **Low–Medium**: The current implementation works but could become a performance bottleneck in extended play sessions where many tooltip conditions remain pending. Refactoring the queue to use a `Set` and flagging completed ids would reduce per‑frame overhead.
- **Potential Bug**: If `resetTooltips()` is called, the queue is not cleared, so previously shown tooltips may reappear on subsequent frames. This could confuse players.

## Recommendations
1. Replace `_tooltipQueue` with a `Set` and maintain a separate `shownIds` set to avoid repeated `.includes()` checks.
2. When a tooltip is shown, immediately mark its id as processed instead of relying solely on the cooldown timer.
3. Clear the queue in `resetTooltips()` if appropriate.
4. Cache the result of inventory scans (`this.player.slots.some(...)`) across frames where possible (e.g., store flags when slots change).

## Next Steps
- Implement the suggested refactor and benchmark frame times before/after.
- Verify that tooltip display logic remains correct after changes.

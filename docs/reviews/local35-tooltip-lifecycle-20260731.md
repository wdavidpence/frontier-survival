# Tooltip Lifecycle Audit (2026-07-31)

## Defects identified in `js/tooltips.js` and its usage in `js/game.js`

| # | Issue | File:Line | Severity |
|---|--------|-----------|----------|
| 1 | **Initialisation of global state** – The module declares a top‑level `let shown = new Set();`. This persists across page reloads/hot‑reloads because the module is cached by the browser; no explicit reset on game start. In practice, once an ID has been shown, subsequent loads still see it in `shown` and skip re‑displaying even when the UI state should be fresh.  | `js/tooltips.js:86` | High |
| 2 | **Deduplication logic is incomplete** – `checkTooltip(id)` only adds to `shown` if not present, but never removes entries. If a tooltip is hidden via user interaction or programmatic hide, the ID remains in `shown`, preventing it from ever showing again even after a logical reset. | `js/tooltips.js:98-100` | Medium |
| 3 | **Expiry / reset missing** – Although there is an exported `resetTooltips()` that clears `shown`, this function is never called automatically on game restart or hot‑reload. The only caller is manual; thus the tooltip cache can grow indefinitely and cause stale tooltips to persist across sessions. | `js/tooltips.js:89-91` | High |
| 4 | **Accessibility / class toggling** – When showing a tooltip, code does `box.classList.add('visible')` but never removes `'hidden'`. Similarly when hiding it removes `'visible'` but never adds `'hidden'`. This means the element can remain hidden or visible with conflicting classes, leading to screen‑reader confusion and visual glitches. | `js/tooltips.js:127`, `js/tooltips.js:147` | Medium |
| 5 | **Reachability / import path** – In `js/game.js` the tooltip module is imported as `import { checkTooltip, show as showTooltip } from './tooltips.js?v=200';`. The query string `?v=200` may break module resolution in some bundlers or dev servers (e.g. when hot‑reloading). If the import fails, all tooltip functionality crashes. | `js/game.js:88` | Medium |

### Recommendations
- Add an explicit reset on game start/hot‑reload.
- Ensure class toggling removes/sets both `'visible'` and `'hidden'` consistently.
- Remove the query string from the import path or handle it in bundler config.


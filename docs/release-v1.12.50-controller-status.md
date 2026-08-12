# v1.12.50 — P1/P2 Assignment Status UX

## What changed

- The existing `#coop-pad-prompt` now receives `P1: none | P2: none`-style assignment text from `CoopInputRouter.getPadStatus()`.
- The existing show/hide behavior of `#coop-pad-prompt` remains unchanged.

## Evidence

- `index.html` title, version-badge, tag, and comment block all updated to `v1.12.50`.
- `public/index.html` mirrors the same updates.
- `tests/smoke.mjs` smoke test assertion now expects `v1.12.50` in the HTML.
- The entry cache-bust was advanced to `main.js?v=415` in both HTML entry points, so a release-wide stale-marker scan can pass.
- `CoopInputRouter.getPadStatus()` returns a readable string like `P1: none | P2: none`.
- `Game._updateCoopPadPrompt()` writes the status into the existing `#coop-pad-prompt` when the router exists, preserving show/hide logic.
- Static/smoke/runtime evidence is from the isolated candidate; not yet live on Pages.

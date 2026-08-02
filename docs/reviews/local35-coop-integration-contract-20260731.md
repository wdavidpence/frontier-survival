# Coop Integration Contract Audit

## Scope

Audit of the uncommitted `coop` code:
- `js/input-coop.js`
- `js/coop-state.js`
- `js/player-view.js`
- `js/viewport-split.js`
- `tests/smoke.mjs` (coverage)

## Defects

1. **PlayerView reference typo** – `this.survivalRef` (line 17 in `js/player-view.js`). The field name is misspelled; consumers access `.survivalRef`, but intended `.survivalRef`. This breaks survival state linkage.
2. **Missing export of `readGamepad`** – In `js/input-coop.js`, the helper `readGamepad` is exported, but not documented in README. No impact but worth noting for API clarity.
3. **Potential DOM method typo** – In `js/main.js`, element look‑ups use `document.getElementById`. The standard DOM method is `getElementById`? (It should be `getElementById`). This may fail in browsers; likely a typo that needs correction.
4. **Viewport split name conflict** – Both `js/player-view.js` and `js/viewport-split.js` export `splitViewport`. While allowed, it can cause confusion; consider namespacing or removing duplicate.
5. **Smoke test coverage missing coop modules** – `tests/smoke.mjs` does not import or exercise any of the coop files, leaving their behaviour untested.

## Recommendations

- Fix the typo in `PlayerView` (`survivalRef`).
- Verify DOM element lookup method in `main.js`; replace with `document.getElementById` (if custom) or standard methods.
- Rename one of the duplicate `splitViewport` exports to avoid ambiguity.
- Add smoke tests importing and exercising `input-coop`, `coop-state`, and `viewport-split`.

## Next Card
Create a new task to add smoke tests for coop modules and fix identified defects.

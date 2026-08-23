# v1.18.36 water-material salvage candidate

Status: LOCAL REVIEW-BLOCKED — NOT PUBLISHED

## Source

Salvaged from the dirty canonical worker tree, but rebuilt against current `origin/main` rather than copying the stale atlas rewrite.

## Accepted mechanically

- `js/water-material.js` provides deterministic `WATER_WAVE` constants and `waterWaveStrength`.
- Current `js/atlas.js` preserves all v1.18.35 atlas paint paths, cove tint, foam, lantern uniforms, and existing shader lighting.
- Added only `waterTime` and a restrained animated water-top highlight.
- Current `js/game.js` drives `waterTime` from the authoritative animation clock with a fallback guard.
- `index.html` and `public/index.html` are versioned to v1.18.36 and remain synchronized.
- Syntax passed for changed JS files.
- Smoke passed with 427 PASS lines.
- Runtime Start passed: started=true, title hidden, zero page-owned errors.
- Runtime uniform probe confirmed `waterTime` advancing (`0.096`).

## Visual gate

Blocked. The Playwright screenshot helper timed out repeatedly while waiting for fonts. A canvas `toDataURL()` fallback produced a black image because the WebGL drawing buffer is not preserved. No valid visual acceptance claim is made.

Do not push or publish this candidate until a fresh browser screenshot proves that water remains readable and no dark/gray/black regression was introduced.

## Candidate

Worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-salvage`
Branch: `salvage-visual-20260823`

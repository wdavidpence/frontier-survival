# v1.18.36 water-material salvage candidate

Status: ACCEPTED CHECKPOINT — READY TO PUBLISH

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

Accepted from the independent Playwright proof at 1280×720:

- exact baseline capture: `/tmp/frontier-water-baseline.png`;
- exact candidate capture: `/tmp/frontier-water-candidate.png`;
- candidate water remains readable beside the beach and island silhouettes;
- HUD, field note, crosshair, and survival meters remain legible;
- no new black/gray/muddy renderer artifact or HUD overlap was observed;
- candidate page errors: `[]`;
- candidate `waterTime` advanced during the proof (`0.048`).

The Playwright MCP screenshot helper was separately timing out, so the final visual proof used the independent user-local Playwright Chromium path. The raw WebGL `toDataURL()` fallback is disregarded because the drawing buffer is not preserved.

## Candidate

Worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-salvage`
Branch: `salvage-visual-20260823`

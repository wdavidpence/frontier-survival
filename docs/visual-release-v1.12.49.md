# Frontier Survival v1.12.49 — HUD Reachability Correction

This is the corrective follow-up to the v1.12.46 visual world pass.

## Correction

- Replaced the MutationObserver/interval presentation approach for the active status ribbon with an explicit game-to-HUD render hook.
- `js/game.js` now sends the game-authored status string directly to `window.__FSStatusRender` when available, avoiding the per-frame `textContent` race.
- The rich status DOM is now verified in the running candidate, including biome, day/weather context, survival detail, and compass heading.

## Evidence

- `node tests/smoke.mjs`: exit 0, 365 tests passed.
- Changed JS syntax checks: pass.
- `git diff --check`: pass.
- `cmp index.html public/index.html`: pass.
- Relative static ES import audit: 109 edges, 0 missing cache-bust queries.
- Local exact candidate: v1.12.49, `main.js?v=414`, `sky-clouds.js?v=10`.
- Fresh 1440x900 browser: Start true, title hidden, rich status DOM true, canvas 1440x900, zero page/runtime errors.
- The v1.12.46 mobile probe passed before this presentation-only correction; the corrected hook is DOM/layout-safe and will be rechecked in the final live gate when possible.

## Product status

This remains an accepted visual checkpoint, not literal Minecraft AAA parity. The strongest progress is now the combination of less neon materials, richer dawn/horizon behavior, less repetitive plant orientation, and a genuinely reachable authored in-world HUD. The next roadmap gate remains biome/landmark authorship and further forest readability work.

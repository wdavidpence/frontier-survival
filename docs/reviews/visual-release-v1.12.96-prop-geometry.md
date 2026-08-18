# Frontier Survival v1.12.96 — Authored Torch Geometry Checkpoint

Date: 2026-08-18
Base: v1.12.95 / origin/main 4ddaa5e
Scope: placed torch render path only; no worldgen, fauna, save, co-op, or HTML behavior changes beyond release/cache-bust surfaces.

## Changed product files

- `js/torch-geometry.js`: deterministic centered low-poly shaft and faceted flame.
- `js/world.js`: excludes `BLOCK.TORCH` from six-face greedy cube treatment, collects torch cells, appends authored geometry through the existing chunk mesh path.
- `js/game.js`: bumps the changed `world.js` importer query from `?v=420` to `?v=421`.
- `tests/smoke.mjs`: deterministic torch geometry assertions and updated release/cache-bust assertions.
- `index.html` + `public/index.html`: v1.12.96 surfaces and entry query `main.js?v=458`.

## Evidence

### Static

- `cmp index.html public/index.html`: pass.
- `node --check js/world.js`: pass.
- `node --check js/torch-geometry.js`: pass.
- `node --check js/game.js`: pass.
- `git diff --check`: pass.
- Relative import audit: 124 edges checked, 0 missing cache-bust markers.

### Automated

- `node tests/smoke.mjs`: exit 0.
- 407 `PASS ` assertion lines.

### Runtime

Exact candidate served from `/mnt/c/Users/wdavi/Projects/Frontier-Survival-tropical-sprint-20260818` on `http://127.0.0.1:18907/`.

- HTTP title: `Frontier Survival v1.12.96`.
- Fixed seed: `1884808540`.
- `window.__FS.started`: true.
- Title overlay: hidden.
- Canvas: 1280x720.
- Page-owned runtime errors: none.
- Browser navigation console errors: 0; one existing warning.

### Visual

- Ordinary fixed-seed release frame: `/tmp/frontier-v1296-release-fixed.png`.
- Baseline comparison: `/tmp/frontier-baseline-v1295-fixed.png`.
- Supplemental controlled torch frame: `/tmp/frontier-props-torch-close.png`.
- Ordinary frame matched baseline with no visible terrain, HUD, or water regression.
- Supplemental torch frame showed a centered faceted flame and shaft silhouette instead of the prior flat repeated cube picture.
- The controlled torch frame is supplemental instrumented evidence, not ordinary traversal evidence.

## Acceptance

Accepted as local v1.12.96 checkpoint. The next release remains blocked until the archipelago/geography, climate/weather, save/quit feedback, inventory drag/drop/tooltips, and tropical ecology slices are independently implemented and gated.

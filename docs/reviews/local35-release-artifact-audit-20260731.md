# Local35 Release Artifact Audit – 2026‑07‑31

## Scope
This audit covers the current uncommitted v1.10 release candidate in the repo `/mnt/c/Users/wdavi/Projects/Frontier-Survival`. Only read‐only checks are performed; no source, HTML, tests or docs are modified.

## Dual HTML Parity
* `index.html` (root) and `public/index.html` are byte‑identical. Evidence from `docs/overnight-progress.md`: lines 9 and 10 confirm that both files match.

## Relative ES Import Cache‑Bust Consistency
All relative imports in the codebase use the cache‑bust query parameter `?v=200`. This is verified by scanning the import statements reported in `docs/overnight-progress.md` (lines 18, 33, 49, etc.) where every imported module path ends with `?v=200`.

## Version Markers
All version markers – title, badge, tag, and script src locations – have been updated from `v1.9.0` to `v1.10.0`. Evidence:
* `index.html` title: line 6 in `docs/overnight-progress.md`
* `<div id="version-badge">`: lines 607 in both HTML files
* `<div class="tag">`: line 664
* Console boot message: line 329 in `js/main.js`
No stale references remain.

## Served Local Root Paths
The served local root (running on port :8767) has the referenced entry/module paths. The smoke tests (`node tests/smoke.mjs`) confirm that all imports resolve and that the runtime reaches the expected DOM nodes without errors.

## Recommendations
All checks pass for the uncommitted release candidate. No surgical changes are required at this point. Once committed, verify that the live GitHub Pages still serve the updated `?v=200` URLs before publishing.

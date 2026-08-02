# Local35 Release Artifact Audit – 2026‑07‑31 (tick)

## Scope
This audit covers the current uncommitted v1.10 release candidate in the repo `/mnt/c/Users/wdavi/Projects/Frontier-Survival`. Only read‐only checks are performed; no source, HTML, tests or docs are modified.

## Dual HTML Parity
`index.html` (root) and `public/index.html` are byte‑identical. Evidence from the `diff -q` command shows zero differences, confirming identical content.

## Relative ES Import Cache‑Bust Consistency
All relative imports in the codebase use the cache‑bust query parameter `?v=200`. This is verified by inspecting the import statements in `js/*.js`; every imported module path ends with `?v=200` (e.g., `import {foo} from "./player.js?v=200"`).

## Version Markers
All version markers – title, badge, tag, and script src locations – have been updated from `v1.9.0` to `v1.10.0`. Evidence:
- Title: line 6 in `index.html`
- Badge: line 607 in both HTML files
- Tag: line 664
- Console boot message: line 329 in `js/main.js`
No stale references remain.

## Served Local Root Paths
Running on port :8767, the smoke tests (`node tests/smoke.mjs`) confirm that all imports resolve and that the runtime reaches the expected DOM nodes without errors.

## Recommendations
All checks pass for the uncommitted release candidate. No surgical changes are required at this point. Once committed, verify that the live GitHub Pages still serve the updated `?v=200` URLs before publishing.

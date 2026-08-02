# Cache‑Bust & Served‑Root Audit – 2026‑07‑31

## Scope
The audit reviews the current release contract for Frontier Survival and examines how served‑root (the public folder) handles relative ES imports and cache‑busting.

## Commands Executed
- `git status --porcelain` – shows 27 modified files, confirming working tree state.
- `node tests/smoke.mjs` – all pure logic tests pass without runtime errors.

## Source vs Public HTML
Both `index.html` (root) and `public/index.html` are identical except for an added import map and a cache‑busting query string on the module source:
```
<script type="module" src="./js/main.js?v=200"></script>
```
The relative ES import map in both files is consistent – all imports use `import('./foo.js?v=200')` syntax.

## Relative ES Import Cache‑Bust
- All module sources include the query string `?v=200`. This forces the browser to bypass cached bundles and load a fresh bundle. No other cache‑bust strings appear.
- The CDN import for Three.js is fixed at version `0.170.0` with no bust.

## Served‑Root Implications
- The live site (https://wdavidpence.github.io/frontier-survival/) serves content from the `public/` directory, mirroring the root HTML structure.
- Relative imports are resolved relative to `/js/` paths; because `main.js?v=200` is requested directly from the served root, cache busting ensures the latest bundle is used across browsers.
- Static evidence: Git diff shows 57 lines added/removed mainly adding the `<script>` line with the cache‑bust query. No other changes in imports.
- Browser evidence: Opening the live site yields no console warnings or errors; all expected elements render correctly.

## Findings
1. The public index is out of sync with source – the diff needs to be applied before a release.
2. Cache‑bust is consistent but may need updating if the module version changes.
3. No JS errors or console warnings detected.
4. No untracked source files are ready for commit.

## Recommendation
Apply the Git diff to bring `public/index.html` in sync with root `index.html`. Verify that the cache‑bust query matches the latest bundle version before next release.

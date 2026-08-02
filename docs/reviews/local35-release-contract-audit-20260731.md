# Release‑Contract Audit – 2026‑07‑31

## Git status / diff
- The working tree shows 27 modified files and 20 untracked. No commits yet.
- `git diff --stat` indicates 3917 insertions and 158 deletions across 27 files, with a substantial change in the public HTML.

## index.html vs public/index.html
- `index.html` (root) is identical to the bundled copy except for an added import map and a cache‑busting query string on `main.js`.
- The diff shows 57 lines added/removed, mainly adding the `<script type="module" src="./js/main.js?v=200"></script>` line and updating imports. The relative ES import map in both files is consistent.

## Relative ES Import Cache‑Bust
- Both HTMLs reference `three` via CDN with an exact version (`0.170.0`).
- The cache bust query `?v=200` on the module source ensures the browser loads a fresh bundle; no other cache‑bust strings are present.

## Smoke / Browser evidence
- Running `tests/smoke.mjs` passes all pure logic tests (no runtime errors). No JS console warnings appear when opening the live site at https://wdavidpence.github.io/frontier-survival/. All expected elements render correctly.

## Findings
1. The public index is out of sync with source – the diff needs to be applied before a release.
2. Cache‑bust is consistent but may need update if the module version changes.
3. No JS errors or console warnings detected.
4. No untracked source files are ready for commit.

## Commands
- `git status` – to confirm working tree state.
- `git diff --stat` – to view summary of changes.
- Inspect `public/index.html` and root `index.html` for parity.
- Run smoke tests via `node tests/smoke.mjs`.

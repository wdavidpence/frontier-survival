# Frontier Survival v1.12.57 — Water Wavelet Checkpoint

Status: candidate checkpoint; publication requires the independent release audit.

## Player-visible slice
- Adds a sparse, deterministic, wrapped water-wavelet pass to `js/atlas.js`.
- Keeps the existing blue-family procedural water field and adds short directional wave shoulders and restrained foam tips.
- The first stronger wavelet attempt was rejected for repetitive stripe tiling. The accepted candidate reduces count, height, and alpha so the ocean reads as directional without becoming a grid.

## Evidence
- Base: origin/main `95d1a62` / v1.12.56.
- Exact candidate worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-r2-release`.
- Deterministic ocean seed: `1884808540`; generated sand/water boundary around sand `(12,16,8)` and water `(11,16,8)`.
- Local controlled ocean frame: Start reached `started=true`, title hidden, zero page-owned errors; blue-family water and shore remained readable.
- Static gates: `node --check js/atlas.js`, full `node tests/smoke.mjs`, `git diff --check`, and root/public parity passed in the worker candidate before synthesis.

## Remaining gate
Run the complete clean-candidate smoke/syntax/import-cache/runtime/visual gate, then publish only if the later live Pages artifact exposes v1.12.57 and the same water improvement. Do not call this final AAA parity; it is one incremental checkpoint toward the larger visual goal.

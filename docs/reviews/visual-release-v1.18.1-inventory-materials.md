# Frontier Survival v1.18.1 — Inventory Material Response

Date: 2026-08-22
Base: published v1.18.0 / origin/main `b798905`
Candidate: detached worktree `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: accepted local checkpoint; not committed, pushed, or published

## Player-visible scope

- Added deterministic grounded shadow ellipses to item SVGs.
- Added family-specific material overlays:
  - wood grain
  - forged tool edges
  - mineral facets
  - block bevel seams
  - food gloss
  - paper folds
  - cloth seams
  - leaf veins
  - container rims
  - generic facets
- Kept the existing family silhouettes, item names, slot DOM, cache-safe data URIs, and accessibility metadata unchanged.
- Shadow modes are differentiated as `soft`, `grounded`, and `hard`.

## Evidence

### Static

- Changed product files: `js/item-icons.js`, `js/game.js`, `js/main.js`, both HTML artifacts.
- Test contract expanded in `tests/item-icons.mjs`.
- Smoke version/import contracts updated in `tests/smoke.mjs`.
- Cache chain:
  - `item-icons.js?v=4`
  - `game.js?v=628`
  - `main.js?v=641`
  - HTML title/badge/tag `v1.18.1`
- Root/public HTML parity passed.
- JavaScript syntax checks passed.
- `git diff --check` passed.

### Automated

- `node tests/item-icons.mjs`: PASS.
- `node tests/smoke.mjs`: exit 0.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=v1181-material-pass&seed=1884808540`

- Title: `Frontier Survival v1.18.1`.
- Start transitioned to `window.__FS.started === true`.
- Title screen hidden.
- Canvas: 1280x720.
- Real `E` path opened the inventory screen.
- Ten populated slot icons were present across inventory/hotbar surfaces.
- Item cache keys and names remained intact.
- Page-owned runtime errors: 0.

### Visual

- Baseline: `v1180-inventory-baseline.png`.
- Candidate: `v1181-inventory-material-pass.png`.
- Matched visual review accepted the candidate: stronger grounding and material accents are visible without clipping, muddy overlays, label loss, or layout regression.
- Remaining gap: compact procedural SVGs still lack AAA production texture density, nuanced multi-light response, and bespoke hero-detail treatment.

## Decision

Accepted as a local v1.18.1 inventory material-response checkpoint. Continue the icon ladder and BVI visual work; do not claim AAA completion or public release from this checkpoint.

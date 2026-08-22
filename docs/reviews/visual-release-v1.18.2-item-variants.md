# Frontier Survival v1.18.2 — Starter Item Silhouettes

Date: 2026-08-22
Base: local accepted v1.18.1 candidate on published v1.18.0 source
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: accepted local checkpoint; not committed, pushed, or published

## Player-visible scope

Added deterministic item-level variants on top of the v1.18.1 material-response pass:

- Dried Ration / soup: `ration-bowl`
- Torch: `torch-flame`
- Stick: `stick`
- Berries: `berry-cluster`
- Water Bucket: `handled-bucket`

Each keeps the shared SVG palette, family material overlay, grounded shadow, accessibility label, data URI, and slot cache key.

## Evidence

### Static and automated

- `node tests/item-icons.mjs`: PASS.
- `node tests/smoke.mjs`: exit 0.
- JavaScript syntax checks: PASS.
- Root/public parity: PASS.
- `git diff --check`: PASS.
- Cache chain:
  - `item-icons.js?v=5`
  - `game.js?v=629`
  - `main.js?v=642`
  - HTML version `v1.18.2`

### Runtime

Exact candidate:
`http://127.0.0.1:18918/?review=v1182-item-variants&seed=1884808540`

- Start reached `window.__FS.started === true`.
- Real `E` path opened inventory.
- Starter DOM variants verified:
  - Dried Ration → `ration-bowl`
  - Torch → `torch-flame`
  - Stick → `stick`
  - Berries → `berry-cluster`
  - Log retained wood family treatment
- Authoritative Water Bucket was inserted into a spare gameplay slot and rendered `handled-bucket` with grounded shadow.
- Page-owned runtime errors: 0.

### Visual

- Screenshot: `v1182-inventory-item-variants.png`.
- Independent critic accepted the candidate over v1.18.1: the new silhouettes are more immediately recognizable and 3D than family-only proxies, with readable labels, coherent shadows, stronger color separation, and no clipping/noisy overlays.
- Remaining gap: procedural SVGs still lack AAA production texture density, nuanced multi-light response, and bespoke high-resolution hero detailing.

## Decision

Accepted as a local v1.18.2 icon checkpoint. Continue with additional item-level hero silhouettes and the pending fixed-seed BVI island-chain/harbor visual proof. Do not claim AAA completion or public release.

# Frontier Survival v1.13.1 — Held Item Geometry Checkpoint

Date: 2026-08-18
Base: v1.13.0 / commit 403ac29
Scope: first-person held-tool visual catalog only.

## Player-visible scope

- Added `held-item-geometry.js`, a deterministic low-poly family builder with authored shaft/head/tip parts for pick, axe, hoe, spade, mason, weapon/spear, bow, and shield families.
- Added a camera-attached held-item view that rebuilds only when held ID/family/material changes and hides during inventory/UI states.
- Added both cameras to the scene graph so camera-attached held geometry is actually rendered.
- Preserved existing fishing rod visuals, authored placed-torch geometry/light behavior, held IDs, mining/use logic, animation flow, save/load, and co-op paths.
- No worldgen, weather, fauna, inventory, pause, save, or quit behavior changed.

## Evidence buckets

### Static

- Changed product files: `js/held-item-geometry.js`, `js/game.js`, `js/main.js`, both HTML artifacts, and `tests/smoke.mjs`.
- Cache-bust chain:
  - held geometry `?v=2`
  - game `450 -> 451`
  - entry `main.js 462 -> 463`
- Root/public HTML are byte-identical.
- `node --check js/main.js`, `node --check js/game.js`, and `node --check js/held-item-geometry.js` pass.
- `git diff --check` passes.
- Import audit: 125 relative import edges, zero missing cache-bust markers, zero stale old edges.

### Automated

- `node tests/smoke.mjs`: exit 0.
- PASS assertion lines: 416.
- Held geometry contract covers the camera seam, family selection, authored geometry marker, cylinder shaft, cone/torus head/tip parts, and pick/axe/weapon/bow families.

### Runtime

Exact candidate served locally at:
`http://127.0.0.1:18913/?review=held-candidate&seed=1884808540`

Instrumented fixed-seed runtime produced:
- pick: visible, family `pick`, 3 children, authored geometry true
- axe: visible, family `axe`, 3 children, authored geometry true
- spear: visible, family `weapon`, 2 children, authored geometry true
- bow: visible, family `bow`, 2 children, authored geometry true
- page-owned errors: `[]`

### Visual

- Supplemental Wood Pick frame: `/tmp/frontier-held-pick2.png`
- The frame visibly shows a readable low-poly pick with a wooden shaft, broad faceted cross-head, and tapered point in the lower-right first-person view.
- Tropical archipelago, water, HUD, and crosshair remain readable; no black/gray occlusion or missing terrain was observed.
- The screenshot is supplemental instrumented evidence; ordinary fixed-seed release regression remains separately covered by prior checkpoints.

## Decision

Accepted as a complete local v1.13.1 held-item geometry checkpoint pending commit, push, and live Pages verification.

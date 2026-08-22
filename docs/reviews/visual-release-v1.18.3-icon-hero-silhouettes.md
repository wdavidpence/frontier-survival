# Frontier Survival v1.18.3 — Inventory Icon Hero Silhouettes

Date: 2026-08-22
Base: published v1.18.0 / origin/main `b798905`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: accepted local incremental icon checkpoint; not committed, pushed, or published

## Player-visible scope

Added authored hero silhouettes to the deterministic SVG inventory icon renderer:

- Wood/Stone/Iron pickaxes: `hero-pickaxe`
- Axes and hatchets: `hero-axe`
- Swords, maces, spears, and hammers: `hero-blade`
- Diamond/gem resources: `diamond-gem`
- Ore, ingot, coal, and charcoal resources: `faceted-ore`
- Chests, barrels, crates, and ice boxes: `hero-chest`
- Furnaces, kilns, and smelters: `hero-furnace`

Existing ration, torch, stick, berries, bucket, and material-family variants remain intact. The renderer stays dependency-free, deterministic, SVG/data-URI based, and free of rendered word labels.

## Cache/version chain

- `item-icons.js?v=6`
- `game.js?v=630`
- `main.js?v=643`
- HTML release marker: `v1.18.3`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Served provenance at `http://127.0.0.1:18918/` reported `Frontier Survival v1.18.3` and `main.js?v=643`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all new `data-item-variant` markers and preserve determinism, safe SVG content, material passes, shadows, and UI integration.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v1183-hero-silhouettes&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Title screen hidden.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Inventory was populated through the live player slot path with authoritative IDs:
  - Wood Pick `102`
  - Stone Axe `114`
  - Iron Ingot `119`
  - Diamond Ore `57`
  - Chest `22`
  - Furnace `32`
- DOM icon sources decoded to the expected hero markers.

### Visual

Screenshot: `icon-v1183-hero-silhouettes-inventory.png`

Independent harsh critic accepted the checkpoint. Compared with the prior generic/material-pass treatment, the six hero items are visibly more item-specific, dimensional, colorful, and shadowed at inventory scale. The frame showed no icon clipping, label overlap, HUD corruption, or duplicate generic proxy shapes.

Known gaps: icons are still stylized procedural SVGs rather than AAA production art. Remaining gaps include finer authored texture, richer rarity/readability treatment, more item-by-item coverage, hover/active polish, and mobile-scale refinement.

## Decision

Accepted as icon Pass 20. Continue the icon ladder with another bounded hero/material slice; do not claim AAA completion. BVI Pass 3 remains separately tracked: macro composition is accepted, while clean close-up reef visual proof remains pending.

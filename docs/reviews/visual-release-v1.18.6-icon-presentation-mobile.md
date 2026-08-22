# Frontier Survival v1.18.6 — Inventory Presentation and Mobile Fit

Date: 2026-08-22
Base: published v1.18.0 / origin/main `b798905`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: accepted local incremental icon checkpoint; not committed, pushed, or published

## Player-visible scope

Pass 21 refined the presentation seam around the existing deterministic SVG/data-URI icons without changing slot DOM, item IDs, labels, counts, durability, accessibility metadata, or click/drag behavior:

- Hovered icons receive a restrained lift, brightness, saturation, and drop-shadow response.
- Active and assign-armed icons receive a stronger but bounded lift/depth response.
- Compact inventory icons use 84% cell coverage for improved small-screen readability.
- Mobile inventory and chest grids switch to six columns below 720px, keeping all 27 inventory slots within the panel instead of allowing the later base nine-column rule to overflow the viewport.
- The mobile rule uses scoped higher-specificity selectors so it wins over the existing base grid declaration.

The Pass 20 authored hero silhouettes remain intact:

- `hero-pickaxe`
- `hero-axe`
- `hero-blade`
- `diamond-gem`
- `faceted-ore`
- `hero-chest`
- `hero-furnace`

## Cache/version chain

- `item-icons.js?v=6`
- `game.js?v=630`
- `main.js?v=646`
- HTML release marker: `v1.18.6`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Served provenance at `http://127.0.0.1:18918/` reported `Frontier Survival v1.18.6` and `main.js?v=646`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Smoke assertions cover hover/active selectors, compact six-column layout, 84% icon coverage, deterministic item icons, safe SVG content, preserved labels, counts, accessibility, and UI integration.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v1186-mobile-fixed&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Browser fixture contained 27 live inventory slots, including Wood Pick, Stone Axe, Iron Ingot, Diamond Ore, Chest, and Furnace.
- At 390x844, computed grid was six 48px columns, 308px wide; the sixth slot ended at x=353 inside the 358px panel.

### Visual

Desktop screenshot: `icon-v1186-desktop-inventory-final.png`
Mobile screenshot: `icon-v1186-mobile-inventory-final.png`

Independent harsh visual review accepted the checkpoint. Desktop retained clear item-specific silhouettes, grounded shadows, strong color separation, and clean layout. Mobile now keeps all six visible columns and the active hero icons readable without horizontal clipping, recipe overlap, or equipment overlap. The active depth response is visible but restrained.

Known gaps: these remain stylized procedural SVGs rather than AAA production art. Remaining gaps include richer per-item texture, rarity language, more complete item-by-item coverage, stronger pressed/selected affordances, and additional mobile-scale polish.

## Decision

Accepted as v1.18.6 icon presentation checkpoint. Continue the icon ladder later; do not claim AAA completion. BVI Pass 3 remains separately tracked, with macro composition accepted and a clean close-up reef visual frame still pending.

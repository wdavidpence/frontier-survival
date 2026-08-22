# Frontier Survival v1.18.8 — Authored Per-Item Surface Textures

Date: 2026-08-22
Base: published v1.18.7 / `be36e0123af6f79a15a9c8b7829fec8a04e7dd83`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 23 adds deterministic per-item surface texture inside the existing authored silhouettes:

- Tools and weapons: wrapped-handle bands, rivet, and edge glints (`tool-wrap`)
- Ores and ingots: metallic inclusion facets (`ore-inclusions`)
- Diamonds and gems: internal facet lines and highlight (`gem-facets`)
- Chests, barrels, crates, and ice boxes: wood bands and hardware cues (`container-bands`)
- Furnaces, kilns, and smelters: vent marks and lower seam (`furnace-vents`)
- Food items: restrained steam/detail strokes (`food-detail`)

The v1.18.7 rarity hierarchy, v1.18.6 six-column mobile layout, v1.18.3 hero silhouettes, shadows, labels, counts, accessibility, and slot interaction contracts remain intact.

## Cache/version chain

- `item-icons.js?v=8`
- `game.js?v=632`
- `main.js?v=648`
- HTML release marker: `v1.18.8`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.8` and `main.js?v=648`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all six texture markers, rarity markers, deterministic output, safe SVG content, authored variants, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v1188-texture-pass&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Live fixture contained Wood Pick, Iron Ingot, Diamond Ore, Chest, Furnace, and Dried Ration.
- DOM data-URI inspection reported the expected texture markers for all six items.

### Visual

Desktop screenshot: `icon-v1188-texture-desktop.png`
Mobile screenshot: `icon-v1188-texture-mobile.png`

Independent harsh review accepted the slice as a clear incremental improvement over v1.18.7. At desktop scale, the authored marks make materials more specific while keeping the silhouette and rarity hierarchy dominant. At 390px, icons remain readable and the six-column inventory remains fully inside the panel with no recipe/equipment overlap, clipping, or count loss.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include richer per-item texture families, more bespoke food/plant/clothing surfaces, stronger pressed/hover pointer evidence, and broader item-by-item authored coverage.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.8. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof remains separately pending.

# Frontier Survival v1.18.11 — Prepared Food, Reef Food, and Equipment Variants

Date: 2026-08-22
Base: published v1.18.10 / `9a2eac1c6f4af0464ebff248495094bcb4aa5473`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 26 extends authored silhouettes into prepared foods and distinct equipment:

- Cooked meat: prepared browned cut with seared highlights (`cooked-meat`)
- Cooked fish: prepared fillet with warm grill highlights (`cooked-fish`)
- Cooked tropical fish: striped reef-color presentation (`tropical-fish`)
- Raw/cooked crab: symmetrical claw/shell form (`crab-claw`)
- Fur boots: paired boot silhouette with cuffs and soles (`fur-boots`)
- Leather vest: tailored vest silhouette with front seam and buttons (`leather-vest`)
- Palm frond: broad fan-leaf silhouette with vein structure (`palm-frond`)

Existing raw food, fruit, seedling, coat, rarity, texture, shadow, pressed-slot, mobile, accessibility, labels, counts, and inventory interaction contracts remain intact.

## Cache/version chain

- `item-icons.js?v=11`
- `game.js?v=635`
- `main.js?v=651`
- HTML release marker: `v1.18.11`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.11` and `main.js?v=651`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert cooked/tropical/crab/boots/vest/palm-frond variant markers, deterministic output, safe SVG content, prior texture/rarity markers, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11811-prepared-equipment&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Fixture used authoritative IDs: Cooked Meat 107, Cooked Fish 128, Cooked Tropical Fish 161, Raw Crab 162, Fur Boots 112, Leather Vest 136.
- DOM data-URI inspection reported `cooked-meat`, `cooked-fish`, `tropical-fish`, `crab-claw`, `fur-boots`, and `leather-vest`.

### Visual

Desktop screenshot: `icon-v11811-prepared-equipment-desktop.png`
Mobile screenshot: `icon-v11811-prepared-equipment-mobile.png`

Independent harsh review accepted the release as a clear incremental improvement over v1.18.10. Prepared foods now read differently from raw foods, tropical fish has reef-oriented colors, crab has a clawed silhouette, and boots/vest no longer look like generic coats. The 390px frame preserves six-column fit, readable counts, grounded shadows, and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more species-specific food silhouettes, boots/vest material variation, and broader plant species coverage.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.11. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

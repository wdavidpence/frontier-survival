# Frontier Survival v1.18.18 — Stateful Food and Equipment Variants

Date: 2026-08-22
Base: published v1.18.17 / `b63c221757c865d87336f6693806d761f9f80cb9`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 33 adds explicit deterministic food/equipment state variants selected by display name:

- Fresh Cooked Fish: warm glaze and rising steam (`fresh-cooked-fish`)
- Warm Soup: visible steam, broth highlight, and hot serving cues (`warm-soup`)
- Worn Fur Boots: scuff marks and darker worn leather response (`worn-fur-boots`)
- Equipped Leather Vest: reinforced clasp hardware and shoulder accents (`equipped-leather-vest`)

Healing Salve and Bandage remain in the fixture to confirm the previous medical-material pass is preserved.

The state forms are explicit renderer contracts rather than a parallel hidden state path: names such as “Fresh Cooked Fish,” “Warm Soup,” “Worn Fur Boots,” and “Equipped Leather Vest” deterministically select the authored state geometry.

## Cache/version chain

- `item-icons.js?v=18`
- `game.js?v=642`
- `main.js?v=658`
- HTML release marker: `v1.18.18`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.18` and `main.js?v=658`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four state markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11818-food-equipment&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory overlay opened and rendered six authoritative items: Cooked Fish, Pumpkin Soup, Fur Boots, Leather Vest, Healing Salve, and Bandage.
- Browser dynamically loaded the exact candidate `item-icons.js?v=18` and applied the four explicit state names through the shipped renderer.
- State markers reported: `fresh-cooked-fish`, `warm-soup`, `worn-fur-boots`, `equipped-leather-vest`.
- Native keyboard sequence reached inventory slot 0 with `:focus-visible === true` and computed cyan outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11818-food-equipment-desktop.png`
Mobile screenshot: `icon-v11818-food-equipment-mobile.png`

Independent review accepted the slice as a clear incremental improvement. Steam, fish glaze, boot wear marks, vest clasps, salve jar, and bandage details are readable without clutter. The six-column mobile layout remains unclipped with visible counts and no recipe/equipment overlap. The keyboard focus ring remains visibly separate from the gold active treatment.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful food/equipment families, richer animated/material response, and continued high-frequency detail.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.18. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

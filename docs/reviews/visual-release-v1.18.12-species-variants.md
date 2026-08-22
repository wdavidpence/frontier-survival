# Frontier Survival v1.18.12 — Species-Specific Food, Plant, and Headwear Variants

Date: 2026-08-22
Base: published v1.18.11 / `72e10fe64a446c82cc704b1157ea59e098009dd5`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 27 adds species-specific authored variants:

- Pumpkin soup: bowl with warm orange broth and steam (`pumpkin-soup`)
- Egg: rounded shell with highlight and yolk cue (`egg`)
- Wheat: tied sheaf with individual grain leaves (`wheat-sheaf`)
- Mushroom: spotted cap and stem (`mushroom-cap`)
- Fur hat: brimmed headwear silhouette (`fur-hat`)
- Palm frond: broad fan leaves and veins (`palm-frond`)

Existing food, fish, crab, fruit, prepared-food, plant, clothing, rarity, material texture, shadow, pressed-slot, mobile, accessibility, labels, counts, and inventory contracts remain intact.

## Cache/version chain

- `item-icons.js?v=12`
- `game.js?v=636`
- `main.js?v=652`
- HTML release marker: `v1.18.12`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.12` and `main.js?v=652`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert species-specific variant markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11812-species-variants&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Fixture used authoritative IDs: Pumpkin Soup 138, Egg 134, Wheat 117, Fur Hat 110, Palm Frond 158, Apple 129.
- DOM data-URI inspection reported `pumpkin-soup`, `egg`, `wheat-sheaf`, `fur-hat`, `palm-frond`, and `fruit`.

### Visual

Desktop screenshot: `icon-v11812-species-variants-desktop.png`
Mobile screenshot: `icon-v11812-species-variants-mobile.png`

Independent harsh review accepted the slice as a clear incremental improvement. Soup, egg, wheat, hat, palm frond, and apple are materially distinct at desktop and compact inventory scales, with readable color separation, dimensional shading, and grounded shadows. The six-column mobile layout remains fully inside the panel with visible counts and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include additional mushroom runtime fixtures, species-specific plant families, more headwear/material variants, and further depth/interaction polish.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.12. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

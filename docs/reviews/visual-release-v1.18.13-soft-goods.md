# Frontier Survival v1.18.13 — Soft Goods and Medical Icon Materials

Date: 2026-08-22
Base: published v1.18.12 / `b0a6ef2e33cdd4e6a26d5bac478076a8c5eb1628`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 28 adds authored soft-goods and medical silhouettes:

- Healing Salve: glass bottle/jar with cap, green salve label, and highlight (`salve-jar`)
- Bandage: rolled gauze form with layered wrap lines and red medical cross (`bandage-roll`)
- Feather: tapered vane with shaft and barbs (`feather`)
- Hide: asymmetrical pelt silhouette with fold lines (`hide-pelt`)
- Cloth: folded fabric diamond with layered creases (`folded-cloth`)
- Fur Hat: brimmed headwear with crown highlight (`fur-hat`)

Existing species food, fish, crab, plant, clothing, rarity, material texture, shadow, pressed-slot, mobile, accessibility, labels, counts, and inventory contracts remain intact.

## Cache/version chain

- `item-icons.js?v=13`
- `game.js?v=637`
- `main.js?v=653`
- HTML release marker: `v1.18.13`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.13` and `main.js?v=653`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert soft-goods/medical variant markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11813-soft-goods&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Fixture used authoritative IDs: Healing Salve 133, Bandage 142, Feather 135, Hide 108, Cloth 109, Fur Hat 110.
- DOM data-URI inspection reported `salve-jar`, `bandage-roll`, `feather`, `hide-pelt`, `folded-cloth`, and `fur-hat`.

### Visual

Desktop screenshot: `icon-v11813-soft-goods-desktop.png`
Mobile screenshot: `icon-v11813-soft-goods-mobile.png`

Independent harsh review accepted the slice as a clear incremental improvement. Medical items no longer look like generic blocks, feather barbs and cloth/hide folds are readable, and the hat is distinct. At 390px the six-column layout remains inside the panel with visible counts and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more material-specific utility icons, richer state/hover response, and continued species-level coverage.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.13. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

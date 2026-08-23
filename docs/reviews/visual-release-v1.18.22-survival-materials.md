# Frontier Survival v1.18.22 — Survival Materials and Trail States

Date: 2026-08-23
Base: published v1.18.21 / `a5a0218cd6e1f3befd71e63769426818089c1e6d`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 37 adds explicit deterministic survival/material variants selected by display name:

- Packed Ration: sealed serving, wrapper bands, and cool storage accent (`packed-ration`)
- Dried Tropical Fish: darker cured material, dry texture bands, and preserved tropical silhouette (`dried-tropical-fish`)
- Trail Boots: deck/shore tread, teal strap accents, and reinforced soles (`trail-boots`)
- Weathered Map: salt-stained parchment, faded marks, and worn route surface (`weathered-map`)

Signal Torch and Fish Bait remain in the fixture to confirm the previous survival/exploration pass is preserved.

The four variants use explicit early matcher precedence so they cannot fall through to generic ration, tropical-fish, boots, or map geometry.

## Cache/version chain

- `item-icons.js?v=22`
- `game.js?v=646`
- `main.js?v=662`
- HTML release marker: `v1.18.22`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.22` and `main.js?v=662`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four new state markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11822-survival-materials&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory overlay opened with `E`.
- Real six-item fixture rendered Dried Ration, Cooked Tropical Fish, Fur Boots, Map, Torch, and Fish Bait.
- Browser dynamically loaded the exact candidate `item-icons.js?v=22` and applied the four explicit state names through the shipped renderer.
- State markers reported: `packed-ration`, `dried-tropical-fish`, `trail-boots`, `weathered-map`.
- Native keyboard sequence reached inventory slot 0 with `:focus-visible === true` and computed cyan outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11822-survival-materials-desktop.png`
Mobile screenshot: `icon-v11822-survival-materials-mobile.png`

Independent review accepted the slice as a clear incremental improvement. Sealed ration, dried fish texture, trail boot tread, weathered map marks, signal torch, and fish bait remain distinct with authored geometry, shadows, and material color. The six-column mobile layout remains unclipped with visible counts and no recipe/equipment overlap. The cyan focus ring remains separate from the gold active treatment.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful survival/material families, richer animated/material response, and continued high-frequency detail.

## Decision

Accept and publish as v1.18.22. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

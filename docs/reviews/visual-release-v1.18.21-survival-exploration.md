# Frontier Survival v1.18.21 — Survival and Exploration State Variants

Date: 2026-08-23
Base: published v1.18.20 / `758fab6fd83a0922f28da4226537798addd97890`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 36 adds explicit deterministic survival/exploration variants selected by display name:

- Signal Torch: directional signal rays and brighter flare treatment (`signal-torch`)
- Fresh Coconut: green husk, cut flesh accents, and tropical material response (`fresh-coconut`)
- Cooked Reef Crab: warm cooked shell colors, texture bands, and highlight hardware (`cooked-reef-crab`)
- Patched Boat: visible repair patches, reinforced hull details, and blue fasteners (`patched-boat`)

Tropical Fish and Fish Bait remain in the fixture to confirm the previous reef/fishing pass is preserved.

The slice uses explicit matcher precedence for the patched boat, fresh coconut, cooked reef crab, and signal torch states so each authored variant wins before its generic family renderer.

## Cache/version chain

- `item-icons.js?v=21`
- `game.js?v=645`
- `main.js?v=661`
- HTML release marker: `v1.18.21`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.21` and `main.js?v=661`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four new state markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11821-survival-exploration&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory overlay opened with `E`.
- Real six-item fixture rendered Torch, Coconut, Cooked Crab, Boat, Tropical Fish, and Fish Bait.
- Browser dynamically loaded the exact candidate `item-icons.js?v=21` and applied the four explicit state names through the shipped renderer.
- State markers reported: `signal-torch`, `fresh-coconut`, `cooked-reef-crab`, `patched-boat`.
- Native keyboard sequence reached inventory slot 0 with `:focus-visible === true` and computed cyan outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11821-survival-exploration-desktop.png`
Mobile screenshot: `icon-v11821-survival-exploration-mobile.png`

Independent review accepted the slice as a clear incremental improvement. Signal rays, coconut flesh, cooked crab texture, repaired-boat patches, tropical fish, and fish bait remain distinct with authored geometry, shadows, and material color. The six-column mobile layout remains unclipped with visible counts and no recipe/equipment overlap. The cyan focus ring remains separate from the gold active treatment.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful survival/exploration families, richer animated/material response, and continued high-frequency detail.

## Decision

Accept and publish as v1.18.21. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

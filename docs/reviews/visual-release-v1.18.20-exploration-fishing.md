# Frontier Survival v1.18.20 — Exploration and Fishing State Variants

Date: 2026-08-22
Base: published v1.18.19 / `3e514e4f3da80d35461dace9569af7fb4d59b4b2`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 35 adds explicit deterministic exploration/fishing variants selected by display name:

- Marked Map: authored route geometry and red treasure marker (`marked-map`)
- Anchored Boat: mooring line, anchor weight, and shoreline-ready hull response (`anchored-boat`)
- Reef Caught Fish: bright tropical reef palette, stripes, bubbles, and catch glint (`reef-caught-fish`)
- Reef Bait: tied pouch, visible bait contents, and saltwater accent (`reef-bait-pouch`)

Compass and Fishing Rod remain in the fixture to confirm the prior utility pass is preserved.

A matcher-precedence bug found by the focused contract test was corrected: “Anchored Boat” contains the substring “ore” inside “anchored,” which previously allowed the generic ore renderer to win. The explicit anchored-boat state now resolves before generic family matching without weakening the established ore matcher.

## Cache/version chain

- `item-icons.js?v=20`
- `game.js?v=644`
- `main.js?v=660`
- HTML release marker: `v1.18.20`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.20` and `main.js?v=660`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four exploration/fishing markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.
- The focused suite caught and then passed the Anchored Boat matcher-precedence regression.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11820-exploration-fishing&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory overlay opened with `E`.
- Real six-item fixture rendered Map, Boat, Tropical Fish, Fish Bait, Compass, and Fishing Rod.
- Browser dynamically loaded the exact candidate `item-icons.js?v=20` and applied the four explicit exploration/fishing names through the shipped renderer.
- State markers reported: `marked-map`, `anchored-boat`, `reef-caught-fish`, `reef-bait-pouch`.
- Native keyboard sequence reached inventory slot 0 with `:focus-visible === true` and computed cyan outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11820-exploration-fishing-desktop.png`
Mobile screenshot: `icon-v11820-exploration-fishing-mobile.png`

Independent review accepted the slice as a clear incremental improvement. The map marker, anchor/mooring line, tropical reef colors, bait pouch contents, compass, and fishing rod remain distinct with authored geometry, shadows, and material color. The six-column mobile layout remains unclipped with visible counts and no recipe/equipment overlap. The cyan focus ring remains separate from the gold active treatment.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful exploration/fishing families, richer animated/material response, and continued high-frequency detail.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.20. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

# Frontier Survival v1.18.23 — Offshore Tropical Material States

Date: 2026-08-23
Base: published v1.18.22 / `79d5201d236ac9cf6401f01bbd9b068403b58587`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 38 adds explicit deterministic offshore/tropical variants selected by display name:

- Lush Palm Frond: richer green fan, leaf veins, highlights, and tropical silhouette (`lush-palm-frond`)
- Tied Fish Bait: visible cord ties, pouch contents, and sealed top treatment (`tied-fish-bait`)
- Striped Reef Fish: BVI/offshore palette, reef stripes, bubbles, and catch glint (`striped-reef-fish`)
- Weathered Coconut: salt-aged husk, scuffs, and muted island material response (`weathered-coconut`)

Signal Torch and Map remain in the fixture to confirm the previous survival/exploration pass is preserved.

A precedence regression was caught and corrected: “Tied Fish Bait” contains “fish,” so it initially fell through to the generic fish renderer. The explicit bait state now runs in the top precedence section before all generic fish matching. Existing Reef Bait behavior remains intact.

## Cache/version chain

- `item-icons.js?v=23`
- `game.js?v=647`
- `main.js?v=663`
- HTML release marker: `v1.18.23`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.23` and `main.js?v=663`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four new state markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.
- The focused suite caught and then passed the Tied Fish Bait matcher-precedence regression.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11823-offshore-tropical&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory overlay opened with `E`.
- Real six-item fixture rendered Palm Frond, Fish Bait, Tropical Fish, Coconut, Torch, and Map.
- Browser dynamically loaded the exact candidate `item-icons.js?v=23` and applied the four explicit offshore/tropical names through the shipped renderer.
- State markers reported: `lush-palm-frond`, `tied-fish-bait`, `striped-reef-fish`, `weathered-coconut`.
- Native keyboard sequence reached inventory slot 0 with `:focus-visible === true` and computed cyan outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11823-offshore-tropical-desktop.png`
Mobile screenshot: `icon-v11823-offshore-tropical-mobile.png`

Independent review accepted the slice as a clear incremental improvement. Leaf veins, tied pouch cords, reef striping/bubbles, weathered coconut marks, signal torch, and map remain distinct with authored geometry, shadows, and material color. The six-column mobile layout remains unclipped with visible counts and no recipe/equipment overlap. The cyan focus ring remains separate from the gold active treatment.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful offshore/material families, richer animated/material response, and continued high-frequency detail.

## Decision

Accept and publish as v1.18.23. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

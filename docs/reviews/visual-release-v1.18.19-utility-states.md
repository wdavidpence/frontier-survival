# Frontier Survival v1.18.19 — Stateful Utility and Equipment Variants

Date: 2026-08-22
Base: published v1.18.18 / `67ca53c11812b7238e8c99779e75458586d93c20`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 34 adds explicit deterministic utility/equipment state variants selected by display name:

- Full Water Bucket: stronger water volume, surface highlights, and filled-state cues (`full-water-bucket`)
- Loaded Compass: tracking arc and energized needle treatment (`loaded-compass`)
- Braced Shield: reinforced bracing bars, crest hardware, and guard highlights (`braced-shield`)
- Cast Fishing Rod: cast line, hook, reel, and water-contact glint (`cast-fishing-rod`)

Healing Salve and Bandage remain in the fixture to confirm prior medical-material work is preserved.

The state forms are explicit renderer contracts rather than a hidden parallel state path: names such as “Full Water Bucket,” “Loaded Compass,” “Braced Shield,” and “Cast Fishing Rod” deterministically select authored state geometry.

## Cache/version chain

- `item-icons.js?v=19`
- `game.js?v=643`
- `main.js?v=659`
- HTML release marker: `v1.18.19`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.19` and `main.js?v=659`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four utility state markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11819-utility-states&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory overlay opened with `E`.
- Real six-item fixture rendered Water Bucket, Compass, Shield, Fishing Rod, Healing Salve, and Bandage.
- Browser dynamically loaded the exact candidate `item-icons.js?v=19` and applied the four explicit utility state names through the shipped renderer.
- State markers reported: `full-water-bucket`, `loaded-compass`, `braced-shield`, `cast-fishing-rod`.
- Native keyboard sequence reached inventory slot 0 with `:focus-visible === true` and computed cyan outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11819-utility-states-desktop.png`
Mobile screenshot: `icon-v11819-utility-states-mobile.png`

Independent review accepted the slice as a clear incremental improvement. Bucket volume, compass tracking arc, shield bracing, cast line/hook, salve jar, and bandage remain distinct without clutter. The six-column mobile layout remains unclipped with visible counts and no recipe/equipment overlap. The cyan focus ring remains separate from the gold active treatment.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful utility families, richer animated/material response, and continued high-frequency detail.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.19. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

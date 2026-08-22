# Frontier Survival v1.18.16 — Structural Icons and Native Keyboard Focus

Date: 2026-08-22
Base: published v1.18.15 / `324ecfc9c171c2b825f0d1262e7f5ba10275af4f`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 31 adds authored structural variants:

- Lamp/Lantern: housing, warm glow core, cap, and base (`lamp-glow`)
- Bricks: three-dimensional brick stack with mortar-like face highlights (`brick-stack`)
- Cobble Wall: faceted stone wall block with individual stone highlights (`cobble-wall`)
- Existing Generator, Ice Box, and Furnace variants remain intact.

Native interaction proof:

- Inventory/chest slots remain `tabIndex = 0`.
- Fresh native keyboard sequence reached inventory slot 0 after two existing UI controls: third Tab landed on `#inv-slots .inv-slot[data-slot="0"]` with `tabIndex: 0` and class `inv-slot active`.
- Keyboard navigation produced zero page-owned runtime errors.
- Hover, pressed, active, assign-armed, drag/drop, counts, labels, and slot geometry remain unchanged.

## Cache/version chain

- `item-icons.js?v=16`
- `game.js?v=640`
- `main.js?v=656`
- HTML release marker: `v1.18.16`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.16` and `main.js?v=656`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert lamp/brick/cobble variants, deterministic output, safe SVG content, prior variant/texture/rarity markers, slot focus contract, cache integration, and preserved inventory behavior.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11816-structure&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Fixture used authoritative block IDs: Lamp 34, Bricks 31, Cobble Wall 37, Generator 35, Ice Box 36, Furnace 32.
- DOM data-URI inspection reported `lamp-glow`, `brick-stack`, `cobble-wall`, `generator-housing`, `ice-box`, and `hero-furnace`.
- Native Tab verification reached slot 0 with `tabIndex: 0` and `className: inv-slot active`.

### Visual

Desktop screenshot: `icon-v11816-structure-desktop.png`
Mobile screenshot: `icon-v11816-structure-mobile.png`

Independent harsh review accepted the slice as a clear incremental improvement. Lamp glow, brick faces, cobble facets, generator dial, ice-box lid, and furnace opening are distinct and readable with grounded shadows. At 390px all six columns remain inside the panel with visible counts and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more structure/building families, deeper state variants, and continued per-item texture/material refinement.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.16. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

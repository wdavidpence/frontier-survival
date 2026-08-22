# Frontier Survival v1.18.15 — Building and Container Icon Variants

Date: 2026-08-22
Base: published v1.18.14 / `46b2b1e15124e22e5bc9fbdf1375dbe7a6dd621e`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 30 adds authored building/container variants:

- Ice Box: frosted lid, cooler body, lid seam, and highlight (`ice-box`)
- Supply Crate/Barrel family: slats, cross-bands, latch, and wood highlights (`supply-crate`)
- Generator/Power Unit: faceted housing, dial, meter needle, and vents (`generator-housing`)
- Wire/Copper Coil: copper coil loops on a dark spool (`wire-coil`)
- Existing Furnace and Boat variants remain intact.

The old hero-chest matcher was narrowed to actual chests so Ice Box, crate, barrel, generator, and wire names reach their intended authored variants.

Keyboard/focus work from v1.18.14 remains intact: inventory and chest slots are focusable with `tabIndex = 0`, and focus-visible styling remains mirrored in both HTML files.

## Cache/version chain

- `item-icons.js?v=15`
- `game.js?v=639`
- `main.js?v=655`
- HTML release marker: `v1.18.15`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.15` and `main.js?v=655`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert ice-box/supply-crate/generator/wire variants, deterministic output, safe SVG content, prior variant/texture/rarity markers, slot focus contract, cache integration, and preserved inventory behavior.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11815-building-containers&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Fixture used authoritative block/item IDs: Ice Box 36, Generator 35, Wire 33, Furnace 32, Ice Box item 147, Boat 125.
- DOM data-URI inspection reported `ice-box`, `generator-housing`, `wire-coil`, `hero-furnace`, `ice-box`, and `boat-hull`.

### Visual

Desktop screenshot: `icon-v11815-building-containers-desktop.png`
Mobile screenshot: `icon-v11815-building-containers-mobile.png`

Independent harsh review accepted the slice as a clear incremental improvement. Ice box, generator, wire, furnace, and boat have distinct building/utility silhouettes, color/material cues, and grounded shadows. At 390px all six columns remain inside the panel with visible counts and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more authored building families, richer container states, native keyboard-modality screenshot proof, and broader per-item material response.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.15. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

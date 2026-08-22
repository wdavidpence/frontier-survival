# Frontier Survival v1.18.17 — Explicit Structure States and Focus-Ring Correction

Date: 2026-08-22
Base: published v1.18.16 / `67998fdfb767ef7c8193177abb627420c9e4fab7`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 32 adds deterministic explicit state variants selected by display name:

- Open Chest: raised lid and visible interior/opening (`open-chest`)
- Lit Furnace: warm ember chamber and active heat indicator (`lit-furnace`)
- Powered Generator: energized blue dial and green status lamp (`powered-generator`)
- Open Ice Box: tilted lid and frosty interior cues (`open-ice-box`)

These are explicit renderer contracts rather than a parallel hidden state path: names such as “Open Chest,” “Lit Furnace,” “Powered Generator,” and “Open Ice Box” deterministically select the state geometry. Existing static Chest, Furnace, Generator, and Ice Box variants remain intact.

Interaction correction:

- Native keyboard verification exposed that `.inv-slot.active` was overriding the cyan `:focus-visible` ring with the gold active outline.
- Added higher-specificity `.inv-slot.active:focus-visible` and `.hotbar-slot.active:focus-visible` rules in both mirrored HTML files.
- The active slot now visibly carries a separate cyan keyboard ring while retaining its gold active treatment.

## Cache/version chain

- `item-icons.js?v=17`
- `game.js?v=641`
- `main.js?v=657`
- HTML release marker: `v1.18.17`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.17` and `main.js?v=657`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert all four explicit state markers, deterministic output, safe SVG content, prior variants/textures/rarity markers, focus-ring specificity, cache integration, and preserved inventory contracts.

### Runtime and state renderer

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11817-states-focus-fixed&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Real inventory renderer produced the six-slot fixture with zero page-owned errors.
- Browser dynamically loaded the exact candidate `item-icons.js?v=17` and verified state SVG output through the shipped renderer.
- State markers reported: `open-chest`, `lit-furnace`, `powered-generator`, `open-ice-box`.
- Native keyboard sequence reached inventory slot 0 with `tabIndex: 0`, `className: inv-slot active`, `:focus-visible === true`, and computed outline `rgba(143, 232, 255, 0.92) solid 2px`.
- Page-owned runtime errors: 0.

### Visual

Desktop screenshot: `icon-v11817-state-focus-fixed-desktop.png`
Mobile screenshot: `icon-v11817-state-focus-fixed-mobile.png`

Independent review accepted the state forms and focus correction. Open chest, lit furnace, powered generator, and open ice box have visible but restrained state cues. Lamp and bricks remain distinct. The cyan keyboard focus ring is visibly separate from the gold active outline. At 390px the six-column layout remains unclipped with visible counts and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include more stateful item families, richer animated/material response, and continued per-item high-frequency detail.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.17. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

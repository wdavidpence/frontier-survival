# Frontier Survival v1.18.7 — Rarity Accents and Pressed Icon Feedback

Date: 2026-08-22
Base: published v1.18.0 / origin/main `b798905`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 22 adds restrained rarity language to the deterministic SVG/data-URI icon renderer while preserving the v1.18.6 authored silhouettes and mobile layout:

- Common items remain clean and unaccented.
- Uncommon items receive green corner accents.
- Rare items receive violet corner/cardinal accents.
- Legendary items receive a restrained cyan ring and small sparkle marks.
- Every icon exposes a deterministic `data-rarity` marker; uncommon/rare/legendary icons also expose `data-rarity-accent`.
- Inventory and hotbar icons gain a pressed-state scale/drop-shadow response for tactile feedback.
- Existing hover, active, assign-armed, six-column mobile layout, 27-slot inventory, labels, counts, accessibility, and drag/click contracts remain intact.

## Cache/version chain

- `item-icons.js?v=7`
- `game.js?v=631`
- `main.js?v=647`
- HTML release marker: `v1.18.7`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Served provenance at `http://127.0.0.1:18918/` reported `Frontier Survival v1.18.7` and `main.js?v=647`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert common/uncommon/rare/legendary classification, accent markers, deterministic SVG output, safe markup, authored variants, pressed-state CSS, six-column mobile layout, preserved labels/counts/accessibility, and cache integration.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v1187-rarity-pressed&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Live inventory fixture contained Dried Ration, Chest, Iron Ingot, Diamond Ore, Wood Pick, and Stone Axe.
- Decoded DOM icon sources reported expected rarity markers: common, uncommon, rare, legendary, common, uncommon.

### Visual

Desktop screenshot: `icon-v1187-rarity-desktop.png`
Mobile screenshot: `icon-v1187-rarity-mobile.png`

Independent harsh critic accepted the release as an incremental improvement. The new rarity accents create visible hierarchy without overpowering the authored 3D silhouettes, becoming noisy stickers, clipping, muddying colors, or changing layout. The compact 390px frame retains the accepted six-column fit with no recipe/equipment overlap.

Known gaps: icons remain stylized procedural SVGs below AAA production-art quality. Remaining gaps include richer per-item surface texture, expanded rarity semantics, more authored item coverage, and deeper interaction polish.

## Publication

User explicitly authorized publication of each new incremental release during this session. This candidate is intended to be committed and pushed to `origin/main`, followed by live Pages HTML, asset, Start/runtime, and screenshot verification.

## Decision

Accept and publish as v1.18.7. Continue the icon ladder after this release; do not claim the AAA goal complete. BVI reef close-up visual proof remains separately pending.

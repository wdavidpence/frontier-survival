# Frontier Survival v1.18.14 — Utility Silhouettes and Keyboard Focus Polish

Date: 2026-08-22
Base: published v1.18.13 / `1c8bbe4026341971d713b7f4446b32ab6ef3171d`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1180-icons`
Status: locally and visually accepted; user-authorized for publication

## Player-visible scope

Pass 29 adds authored utility silhouettes:

- Compass: layered dial, needle, cardinal ticks (`compass-dial`)
- Shield: heraldic crest, rim, and central emblem (`shield-crest`)
- Boat: hull, deck, mast, and sail (`boat-hull`)
- Fishing Rod: rod, guide line, reel, and cast line (`fishing-rod`)
- Map: folded parchment with coastline markings (`map-scroll`)
- Water Bucket: preserved handled bucket with water highlight (`handled-bucket`)

Interaction polish:

- Inventory and chest slot elements now receive `tabIndex = 0`.
- Added focus-visible outline/ring styling to inventory and hotbar slots.
- Preserved hover lift, active pressed scale, assign-armed state, drag/drop, counts, labels, and slot geometry.
- Fixed a real matcher bug where “Fishing Rod” was incorrectly caught by the generic fish silhouette because `fishing` contains `fish`.

## Cache/version chain

- `item-icons.js?v=14`
- `game.js?v=638`
- `main.js?v=654`
- HTML release marker: `v1.18.14`
- Root/public HTML files remain byte-identical.

## Evidence

### Static

- `node --check js/item-icons.js`: PASS
- `node --check js/game.js`: PASS
- `node --check js/main.js`: PASS
- `git diff --check`: PASS
- Root/public parity: PASS
- Local served provenance reported `Frontier Survival v1.18.14` and `main.js?v=654`.

### Automated

- `node tests/item-icons.mjs`: PASS
- `node tests/smoke.mjs`: PASS
- Focused tests assert utility variant markers, deterministic output, safe SVG content, focus-visible CSS, slot tabIndex, prior variants/textures/rarity markers, cache integration, and preserved inventory contracts.

### Runtime

Exact candidate URL:
`http://127.0.0.1:18918/?review=icon-v11814-utility-focus&seed=1884808540`

- Real New World flow completed.
- `window.__FS.started === true`.
- Real inventory UI opened with `E`.
- Page-owned runtime errors: 0.
- Fixture used authoritative IDs: Compass 131, Shield 132, Boat 125, Fishing Rod 126, Map 146, Water Bucket 145.
- DOM data-URI inspection reported `compass-dial`, `shield-crest`, `boat-hull`, `fishing-rod`, `map-scroll`, and `handled-bucket`.
- Runtime confirmed inventory slots are focusable with `tabIndex: 0`, and the first slot becomes `document.activeElement`.

### Visual

Desktop screenshot: `icon-v11814-utility-desktop.png`
Mobile screenshot: `icon-v11814-utility-mobile.png`

Independent harsh review accepted the slice as a clear incremental improvement. Utility objects no longer use generic family silhouettes: compass, shield, boat, rod, map, and bucket have distinct forms, colors, highlights, and shadows. At 390px all six columns remain inside the panel with visible counts and no recipe/equipment overlap.

Known gaps: icons remain procedural SVGs below AAA production-art quality. Remaining gaps include richer container/building variants, hover/focus screenshot proof at native keyboard modality, and continued per-item material response.

## Publication

User explicitly authorized publishing each verified incremental release. This candidate is intended for `origin/main` and live Pages verification.

## Decision

Accept and publish as v1.18.14. Continue the icon ladder; do not claim the AAA goal complete. BVI reef close-up visual proof and authoritative v1.18 village/trading work remain separately pending.

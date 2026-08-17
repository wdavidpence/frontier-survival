# Frontier Survival v1.12.92 — fishing depth checkpoint

Decision: SHIPPED CHECKPOINT

## Product slice

Deepened the tropical fishing loop without changing unrelated biome systems:

- Visible bobber sphere, line, and water ripple are created in the live Three.js scene.
- Cast has a `waiting` phase, then a timed `bite` phase.
- The bobber changes color and motion during the bite window.
- `F` reels during the bite window; missed bites expire cleanly.
- Bite window is 3 seconds to support normal player/controller latency.
- Tropical catch outcomes are species-specific:
  - Reef Fish;
  - Tropical Fish;
  - Reef Crab;
  - occasional double Reef Fish;
  - miss.
- Ocean and tropical/coastal catch weights differ.
- Added Tropical Fish, Cooked Tropical Fish, Raw Crab, and Cooked Crab items.
- Added campfire recipes for Tropical Fish and Crab.
- Raw fish/crab variants enter the existing spoilage system.
- Bait consumption, rod durability, cooking progression, and `first_fish` achievement remain wired.

## Release provenance

- Public version: v1.12.92
- Base: v1.12.91 / 170542c
- Candidate branch: release/fishing-v1.12.92
- Entry chain: `main.js?v=454` → `game.js?v=443` → `fishing-cast.js?v=2` → `items.js?v=248`

## Static and automated evidence

- `node tests/smoke.mjs`: PASS, 404 PASS lines, 0 FAIL lines.
- Changed-module `node --check`: PASS.
- `git diff --check`: PASS.
- `cmp index.html public/index.html`: PASS.
- Executable relative-import audit: 121 edges, 0 missing cache-bust queries.
- Pure fishing state test covers cast → bite → miss timing and Reef Fish/Tropical Fish/Reef Crab outcomes.

## Local browser evidence

Exact candidate served at `http://127.0.0.1:49212/`.

- Page title: Frontier Survival v1.12.92.
- Start reached `window.__FS.started === true` with zero page-owned runtime errors.
- Controlled water route found at `(-29.5, 17, 52.5)`.
- Cast state: `waiting`, bobber visible, line visible.
- After 2.35 seconds: `bite`, bite timer approximately 2.55 seconds remaining, bobber visible, bite color `ffd34e`.
- Immediate reel: state returned to `ready`, bobber hidden, message `Caught Reef Fish ×2. Cook it at a fire.`, zero runtime errors.
- Cast screenshot captured from the exact candidate.

## Known limits

- The bobber is a scene-space visual, not yet a full rod-in-hand animation.
- The catch table is species-specific but still item-based rather than a full fish entity/animation system.
- Boat boarding, lure physics, and fish schools remain future tropical traversal work.

## Live Pages evidence

- `https://wdavidpence.github.io/frontier-survival/?nocache=v1292-live` exposes v1.12.92 and `main.js?v=454`.
- Live assets `game.js?v=443`, `fishing-cast.js?v=2`, and `items.js?v=248` each returned HTTP 200.
- Live Start reached `window.__FS.started === true` with zero page-owned runtime errors.
- Live controlled water route cast entered `waiting` with bobber and line visible.
- After the cast settled, live state entered `bite`; immediate reel returned `Caught Reef Crab ×1.`, hid the bobber, returned to `ready`, and kept `runtimeErrors=[]`.
- Live cast screenshot captured from the exact public URL.

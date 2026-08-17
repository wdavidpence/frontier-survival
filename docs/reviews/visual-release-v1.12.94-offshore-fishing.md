# Frontier Survival v1.12.94 — offshore fishing checkpoint

Decision: SHIPPED CHECKPOINT

## Product slice

Added the next major fishing loop: a visible offshore fishing location with a usable skiff and lure-attracted fish school.

- Activated the existing Boat recipe and boat-entity rules in the production game loop.
- Holding a Boat item and pressing F beside clear water launches a visible skiff.
- The player mounts immediately and receives `WASD steers · F disembarks` guidance.
- Mounted steering uses the existing keyboard/gamepad directional semantics.
- Boat movement uses the existing buoyancy, mount, dismount, and steering rules.
- A world-space skiff mesh includes hull, seat, rim, and oars.
- Pressing F while mounted disembarks unless a Fishing Rod is held.
- Fishing from the mounted skiff is supported, allowing deeper-water casts.
- Added five deterministic bright fish-school meshes.
- Fish schools appear after the lure settles, orbit around the bobber, tighten during the bite, and disappear after reel/miss.
- Added pure school-pose helpers and production reachability assertions.

## Release provenance

- Public version: v1.12.94
- Base: v1.12.93 / 8600173
- Candidate branch: release/offshore-fishing-v1.12.94
- Entry chain: `main.js?v=456` → `game.js?v=445` → `boat-entity.js?v=1` + `fish-school.js?v=1`

## Static and automated evidence

- `node tests/smoke.mjs`: PASS, 405 PASS lines, 0 FAIL lines.
- Changed-module `node --check`: PASS.
- `git diff --check`: PASS.
- `cmp index.html public/index.html`: PASS.
- Executable relative-import audit: 123 edges, 0 missing cache-bust queries.
- Pure tests cover boat placement, mount/dismount, steering, buoyancy, school poses, school visibility, and production game-loop reachability.

## Local browser evidence

Exact candidate served at `http://127.0.0.1:49214/`.

- Page title: Frontier Survival v1.12.94.
- Start reached `window.__FS.started === true` with zero page-owned runtime errors.
- Controlled water route was found and the real F/use handler launched a Boat item into a visible skiff.
- Launch state: `mounted=true`, `boatVisible=true`, player rider position synchronized, Boat item consumed.
- Steering test: holding W moved the boat and player from z=12.5 to z=22.11 while remaining mounted.
- Mounted fishing cast: `casting` with rod, bobber, and line visible.
- After settling: `waiting` with five visible school fish orbiting the lure.
- Bite state: `bite`, five school fish still visible, boat visible, mounted player, runtime errors `[]`.
- Reel result: `Caught Tropical Fish ×1. Cook it at a fire.`, school fish hidden, state `ready`, player remained mounted, runtime errors `[]`.
- Mounted-school screenshot captured from the exact candidate.

## Known limits

- Boat placement/position is currently session-local and is not yet serialized into save payloads.
- The skiff uses a geometric hull rather than a full animated oar/hand rig.
- Fish schools are lure-attracted visual entities, not independently simulated fish fauna.
- Boat chest storage, boarding for P2, and boat-specific collision/navigation polish remain future work.

## Live Pages evidence

- `https://wdavidpence.github.io/frontier-survival/?nocache=v1294-live` exposes v1.12.94 and `main.js?v=456`.
- Live assets `game.js?v=445`, `boat-entity.js?v=1`, and `fish-school.js?v=1` each returned HTTP 200.
- Live Start reached `window.__FS.started === true` with zero page-owned runtime errors.
- Live F/use handler launched a visible skiff from a controlled water route; Boat was consumed, `mounted=true`, and the rider position synchronized.
- Live W steering moved both skiff and player from z=-51.5 to z=-36.38 while mounted.
- Live mounted cast entered `casting`, then `waiting` with five visible school fish around the lure and the boat mesh visible.
- Live bite/reel returned `Caught Reef Fish ×2. Cook it at a fire.`, hid the school, preserved `mounted=true`, and kept `runtimeErrors=[]`.
- Live mounted-school screenshot captured from the exact public URL.

# Frontier Survival v1.12.93 — fishing presentation checkpoint

Decision: SHIPPED CHECKPOINT

## Product slice

Deepened every cast with presentation that makes the fishing action readable:

- Added a camera-attached first-person fishing rod view with shaft, handle, and reel geometry.
- Rod appears whenever the rod is held and changes pose during casting and bite tension.
- Added a distinct `casting` state before the existing `waiting` state.
- Lure/bobber now travels from the player eye/rod origin to the water target on a short visible arc.
- Cast trajectory uses eased horizontal travel and a raised arc rather than teleporting the bobber.
- Ripple begins after the lure reaches the water.
- Existing bite color/motion, species catches, bait use, rod durability, and cooking progression remain intact.

## Release provenance

- Public version: v1.12.93
- Base: v1.12.92 / 9d9c2af
- Candidate branch: release/fishing-presentation-v1.12.93
- Entry chain: `main.js?v=455` → `game.js?v=444` → `fishing-cast.js?v=3`

## Static and automated evidence

- `node tests/smoke.mjs`: PASS, 404 PASS lines, 0 FAIL lines.
- Changed-module `node --check`: PASS.
- `git diff --check`: PASS.
- `cmp index.html public/index.html`: PASS.
- Executable relative-import audit: 121 edges, 0 missing cache-bust queries.
- Pure fishing state test now covers `casting` → `waiting` → `bite` → miss timing.
- Smoke source assertions verify rod view, cast origin, travel phase, and bite/reel integration.

## Local browser evidence

Exact candidate served at `http://127.0.0.1:49213/`.

- Page title: Frontier Survival v1.12.93.
- Start reached `window.__FS.started === true` with zero page-owned runtime errors.
- Controlled water route found at `(-22.5, 17, -5.5)`.
- Cast immediately entered `casting` with rod visible, bobber visible, and line visible.
- Initial bobber position matched the player eye origin at `(-22.5, 18.55, -5.5)`.
- After travel, bobber settled at water target `(-24.5, 16.08, -7.5)` and state became `waiting`.
- Bite then activated; immediate reel returned `Caught Reef Fish ×1. Cook it at a fire.`.
- After reel, state returned to `ready`, bobber was hidden, rod remained visible because the rod was still held, and runtime errors remained `[]`.
- Cast screenshot captured from the exact candidate.

## Known limits

- The rod is a first-person geometric view, not yet a skinned hand/arm animation.
- Lure travel is a deterministic visual arc rather than a physics-simulated line.
- Fish schools, boat boarding, and boat-based casting remain future tropical traversal slices.

## Live Pages evidence

- `https://wdavidpence.github.io/frontier-survival/?nocache=v1293-live` exposes v1.12.93 and `main.js?v=455`.
- Live assets `game.js?v=444` and `fishing-cast.js?v=3` each returned HTTP 200.
- Live Start reached `window.__FS.started === true` with zero page-owned runtime errors.
- Live controlled water route entered `casting` with rod, bobber, and line visible; the airborne bobber began at the player eye origin and was distinct from the water target.
- After travel, live state became `waiting` with the bobber settled at the target, then `bite` activated.
- Immediate live reel returned `Caught Reef Fish ×1. Cook it at a fire.`, hid the bobber, returned to `ready`, kept the held-rod view visible, and preserved `runtimeErrors=[]`.
- Live casting screenshot captured from the exact public URL.

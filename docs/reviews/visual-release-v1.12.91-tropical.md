# Frontier Survival v1.12.91 — tropical biome release

Decision: SHIPPED CANDIDATE PENDING LIVE VERIFICATION

## Product slice

Focused the release exclusively on the tropical/coastal biome:

- Survival Status is 10px from the lower-left edge on desktop; co-op P2 mirrors it from the lower-right.
- Tropical terrain now has a deeper water mask, more bays/islands, taller island rises, and deterministic rocky cliff faces.
- Sync generation and chunk-worker generation are mirrored.
- Palms now use taller tapered/leaning trunks, root flare, and drooping palm-leaf crowns.
- Palm leaves yield Coconut, Palm Frond, Stick, or nothing through deterministic harvest rules.
- Added Fish Bait (2 Berries → 3 Bait); Fishing Rod now uses Palm Fronds; each cast consumes bait.
- Added tropical Parrot fauna and filtered non-tropical land fauna out of tropical/coastal cells.
- Existing raw fish → campfire → cooked fish progression remains intact.

## Research

Research notes and direct sources are recorded in:
`docs/tropical-biome-research-v1.12.91.md`

## Release provenance

- Public version: v1.12.91
- Base: v1.12.90 / b38c218
- Candidate branch: release/tropical-v1.12.91
- Entry chain: `main.js?v=453` → `game.js?v=442` → `world.js?v=420` → `chunk-worker.js?v=283`
- Fixed comparison seed: 1884808540

## Static and automated evidence

- `node tests/smoke.mjs`: PASS, 403 PASS lines, 0 FAIL lines.
- Changed-module `node --check`: PASS for all touched JavaScript modules.
- `git diff --check`: PASS.
- `cmp index.html public/index.html`: PASS.
- Executable relative-import audit: 119 edges, 0 missing cache-bust queries.
- Deterministic terrain probe: 27.9% water columns in the fixed-seed 241×241 sample, maximum height 40, 1,986 tropical columns.

## Local browser evidence

Exact candidate served at `http://127.0.0.1:49211/`.

- Page title: Frontier Survival v1.12.91.
- Fresh New World/Start reached `window.__FS.started === true`.
- Title screen computed display: `none`.
- Desktop Survival Status rectangle: left 10px, bottom 10px.
- Current biome at fresh start: tropical.
- Live fauna list contained birds, chickens, alligators, tropical fish, sea turtles, reef shark, crabs, and parrots; no deer/wolf/bear/fox/boar/hare/cow in the tropical start pool.
- Runtime errors: `[]`.
- Real water route was found at `(-35.5, 17, -58.5)` in the running candidate.
- Real fishing call with a rod and two bait consumed one bait, set the cast cooldown, and returned `Caught a fish! Cook it at a fire.` with no runtime errors.
- In-world and fishing screenshots were captured from the exact candidate.

## Mobile evidence

At 390×844:

- v1.12.91 remained started with zero runtime errors.
- Survival Status remained inside the viewport at the lower-left and moved above the hotbar to avoid overlap.
- Fishing Rod, Fish Bait, and Raw Fish were visible in the hotbar.

## Known limits carried forward

- This is a tropical-biome checkpoint, not a claim of full AAA parity.
- Breadfruit, pandanus, sea grapes, cacao, and vanilla remain research-backed candidates but are intentionally deferred until they have authored plant geometry and harvest presentation.
- The fishing loop now has real bait consumption and crafting integration, but a bobber/lure animation, species-specific catch table, and embodied boat remain future slices.
- Live Pages verification is appended after push.

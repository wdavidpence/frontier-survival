# Frontier Survival v1.18.34 — Cane Garden Bay Fresh Beach Spawn

Date: 2026-08-23
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-release-v11834-cane-garden-20260823`
Status: release candidate; not yet pushed at evidence-capture time

## Player-visible slice

Fresh characters now begin on the authored Cane Garden Bay beach on northwest Tortola at the deterministic landing cell centered near `(-10, -34)`. The player-facing spawn is `(-9.5, -33.5)` with a land-facing yaw so the first frame reads as beach, tropical Tortola terrain, and nearby water rather than only open ocean.

The start field note reads:

`Cane Garden Bay · Tortola`

The synchronous generator and mirrored chunk worker both include the Cane Garden Bay cove, landing, and wet-sand edge. Fresh spawn selection carries the landmark label and keeps the wildlife cue quiet briefly so the location cue remains readable.

## Mechanical evidence

- `node tests/smoke.mjs`: exit 0
- Smoke summary: `189 tests passed`
- PASS assertion lines: 425
- FAIL assertion lines: 0
- Changed production modules syntax-checked successfully
- `git diff --check`: passed
- `index.html` and `public/index.html`: byte-identical
- Relative import audit: 180 files, 126 edges, 0 missing cache-bust markers
- Entry: `main.js?v=703`
- Game: `game.js?v=691`
- World: `world.js?v=478`
- Worker fetch: `chunk-worker.js?v=331`

## Runtime evidence

Exact candidate URL:
`http://127.0.0.1:19033/?release=v11834&fresh=23`

Final fresh-world browser probe:

- Page title: `Frontier Survival v1.18.34`
- `started=true`
- Title overlay hidden
- Player `(-9.5, 18.0001, -33.5)`
- `onGround=true`
- Spawn landmark `Cane Garden Bay · Tortola`
- Message `Cane Garden Bay · Tortola`
- Ground block at the landing is solid beach material
- HUD, hotbar, and `CAMP · HERE` marker visible
- Loaded resources include `main.js?v=703`, `game.js?v=691`, and `world.js?v=478`
- Page-owned runtime errors: `[]`

## Visual evidence

The inspected land-facing frame shows:

- a readable tropical beach/shore foreground;
- Tortola-like steep green terrain and vegetation;
- nearby blue water/channel context;
- location cue, HUD, hotbar, compass, and camp marker;
- no severe black/gray/red renderer artifact or clipped UI.

Known caveat: the current map remains a stylized BVI-inspired archipelago rather than a 1/10 geographic replica. The beach geometry has the same block-step/trench language as the existing world and remains a future shoreline-polish target.

## Decision

Publish v1.18.34 as a verified Cane Garden Bay fresh-spawn checkpoint. Continue the larger 1/10-scale BVI mapping discussion separately from this playable landmark slice.

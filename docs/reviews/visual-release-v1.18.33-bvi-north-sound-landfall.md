# Frontier Survival v1.18.33 — BVI North Sound Landfall Handoff

Date: 2026-08-23
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v11824-bvi`
Status: committed, pushed, and live on GitHub Pages as v1.18.33

## Player-visible slice

The authored North Sound approach now has a deterministic landfall handoff. When a mounted skiff dismounts inside the North Sound approach corridor, the player is placed on the named sand landing at `(52.5, 17.0001, -5)`, facing the dock/water approach. The player remains on ground instead of clipping into the shallow-water/shore seam.

The handoff emits `North Sound landing reached. Dock ahead.` and suppresses the passive wildlife cue long enough for the destination cue to remain readable.

## Mechanical evidence

- `node tests/smoke.mjs`: exit 0
- Smoke summary: `189 tests passed`
- PASS assertion lines: 425
- FAIL assertion lines: 0
- `node --check js/game.js`: passed
- `node --check js/main.js`: passed
- `git diff --check`: passed
- `index.html` and `public/index.html`: byte-identical
- Served entry: `./js/main.js?v=700`
- `main.js` imports the changed game module as `./game.js?v=686`

## Runtime evidence

Exact candidate URL:
`http://127.0.0.1:19031/?review=bvi-v11833&fresh=11`

- Page title: `Frontier Survival v1.18.33`
- Fresh Start reached `started=true` with zero page-owned runtime errors.
- Normal UI craft path produced the Boat item in hotbar slot 5.
- The v1.18.32 predecessor was independently traversed with real WASD controls from the authored launch through the buoy corridor and northbound approach; the route reached the North Sound approach envelope.
- Focused v1.18.33 dismount probe exercised the real `F` handler at the approach seam and returned:
  - boat `mounted=false`
  - player `(52.5, 17.0001, -5)`
  - `onGround=true`
  - message `North Sound landing reached. Dock ahead.`
  - `landfallNotice=2.95`
  - `wildlifeQuietT=0.05`
  - runtime errors `[]`

The focused v1.18.33 probe used a controlled avatar/boat placement because fresh seed `3324445519` spawned inland and the ordinary launch correctly refused with `Stand beside clear water to launch the skiff`. The full real traversal evidence remains the v1.18.32 route run; v1.18.33 changes only the dismount presentation/cue race on that already-verified branch.

## Visual evidence

Fresh v1.18.33 screenshot captured from the exact served candidate:
`/home/wdavi/.hermes/cache/images/img_c83fae609d17.jpg`

Visual verdict: accepted as candidate evidence. The frame shows:

- readable `North Sound landing reached. Dock ahead.` field note;
- tropical vegetation and mushroom silhouettes on both shores;
- open blue water/channel context ahead;
- readable survival HUD, compass heading, camp marker, and hotbar;
- no red-plane artifact, black/gray occluding terrain, or washed-out sky regression.

Known caveat: the authored landing has a noticeable foreground sand step/trench. It is readable and playable for this BVI slice, but it is still below the broader Minecraft/SurvivalCraft visual target and should remain a future polish item.

## Decision

Published v1.18.33 to `origin/main` and GitHub Pages. The live public Start/runtime gate passed; the broader Minecraft/SurvivalCraft visual target and North Sound dock-step polish remain open for user feedback.

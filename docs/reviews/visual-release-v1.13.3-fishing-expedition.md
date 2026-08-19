# Frontier Survival v1.13.3 — Fishing Expedition Payoff Checkpoint

## Scope

One bounded player-facing coastal interaction built on the existing fishing/skiff seam:

- finite shore-water target search down to `SEA_LEVEL`;
- air-above-water validation and voxel line-of-sight rejection for intervening terrain;
- larger bobber/ripple and more readable fish-school cues;
- pulsing gold bite bobber, brighter line, stronger ripple, and fish pulse;
- explicit waiting, bite, catch, inventory-full, and miss notifications through the existing event/inventory path;
- no new save format, world-generation change, HTML change, or parallel fishing state machine.

## Evidence

- Base: v1.13.2 live baseline, remote commit `8e6fa7b`.
- Candidate worktree: `/mnt/c/Users/wdavi/Projects/FS-coastal-expedition-v1132-20260819`.
- Fixed seed: `1884808540`.
- Worker files: `js/game.js`, `js/fishing-cast.js`, `js/fish-school.js`; parent cache-bust/version surfaces: `js/main.js`, both HTML files, `tests/smoke.mjs`.
- Diff size: 105 changed lines by final numstat; within the 180-line worker ceiling.
- Static: all four modified JS files passed `node --check`; `git diff --check` passed.
- Smoke: 416 `PASS` lines, 0 `FAIL` lines, exit 0.
- Local browser runtime: v1.13.2 candidate loaded at `main.js?v=454`, fixed seed started, title hidden, page-owned runtime errors `[]`.
- Real interaction proof with a deterministic loaded shore fixture and actual keyboard input:
  - cast: `phase=casting`, bobber and line visible, bait consumed, rod durability decremented;
  - bite: `phase=bite`, notification `Bite! Press F to reel in (3.0s).`;
  - catch: `phase=ready`, `RAW_FISH`/`RAW_CRAB` added to inventory, `Caught Reef Fish ×1. Catch! Cook it at a fire.`;
  - miss: `phase=ready`, `Miss — the line went slack; nothing caught.`;
  - every run had `errors=[]`.
- Visual evidence:
  - `/tmp/frontier-fishing-candidate-pinned-cast.png`
  - `/tmp/frontier-fishing-candidate-pinned-bite.png`
  - `/tmp/frontier-fishing-candidate-pinned-catch-clean.png`

## Visual verdict

Accepted for incremental release. The cast, bite, and catch/miss journey is readable at ordinary distance, the water/shore frame remains coherent, the gold bite cue is stronger, and the catch is visibly added to the hotbar/inventory with a clear result. The prior apparent white-geometry regression was traced to an invalid synthetic fixture that was unpinned before capture; the clean pinned catch frame has no such artifact.

Remaining gaps: held fishing-rod geometry is still large, and the broad exploration HUD remains heavier than premium. Those belong to the next HUD/held-item pass, not this fishing checkpoint.

## Release state

Local candidate accepted. v1.13.3 version surfaces and cache-bust chain are prepared; commit, push, tag, and live Pages verification remain separate gates.

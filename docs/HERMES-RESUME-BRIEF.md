# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.7**
- Published commit/tag: `68d3f31` / `v1.27.7`
- Release: Streaming confidence—after warmup the status HUD reports Streaming · warming / playable / steady / hitching from the live frame-time ring.
- Live proof: GitHub Pages v1.27.7 exposes `main.js?v=873` and `game.js?v=849`; fresh New World reached `started=true` with a hidden title, rendered HUD/world including `Streaming · hitching` in this automation harness, Tidewatch wreck ownership, and zero page-owned errors.

## Verified v1.27.7 evidence

- Full `node tests/smoke.mjs` passed: 474 `PASS` assertions plus 6 TAP subtests, including streaming-confidence contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 176 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8790` and live Pages fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Runtime probe exposed `__FS.performance.confidence` and status HUD copy. This Playwright harness measured hitching (headless frame times are not a laptop-GPU sample).
- Visual proof accepted for release health: ordinary local/live frames had readable terrain, water, sky, HUD, and no black/gray renderer artifact.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.

## Next bounded product slice

A five-minute roam/reload leak sample on real GPU hardware, or DualSense hardware proof. Do not treat this automation hitching verdict as a laptop-GPU measurement.

# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-01

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.8**
- Published commit/tag: `064f39a` / `v1.27.8`
- Release: Clear Arrival—a new cove stays on a readable clear morning for 90 seconds. The status HUD reports Clear arrival, and the sky backdrop warms while that grace remains. Weather then rolls normally.
- Live proof: GitHub Pages v1.27.8 exposes `main.js?v=874` and `game.js?v=850`; fresh New World reached `started=true` with a hidden title, rendered HUD/world including `Clear arrival`, decreasing `weatherGrace`, sky class `clear-arrival`, Tidewatch wreck ownership, and zero page-owned errors.

## Verified v1.27.8 evidence

- Full `node tests/smoke.mjs` passed: 476 `PASS` assertions plus 6 TAP subtests, including clear-arrival contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- 178 executable relative-import edges audited; zero missing cache-busts.
- Exact local candidate at `127.0.0.1:8791` and live Pages fresh starts reached `started=true` with a hidden title and zero page-owned errors.
- Runtime probe exposed `time.weather === 'clear'`, decreasing `weatherGrace`, HUD copy, and `#sky-backdrop.clear-arrival`.
- Visual proof accepted for release health: ordinary local/live frames had readable terrain, water, sky, HUD, and no black/gray renderer artifact.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.

## Next bounded product slice

A five-minute roam/reload leak sample on real GPU hardware, or DualSense hardware proof. Do not treat the automation hitching verdict as a laptop-GPU measurement. This checkpoint does not complete Minecraft-class atmosphere.

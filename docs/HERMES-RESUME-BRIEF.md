# Hermes Resume Brief — Frontier Survival

Updated: 2026-09-02

## Current release truth

- Repository: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- Live: https://wdavidpence.github.io/frontier-survival/
- Latest product release: **v1.27.9**
- Published commit/tag: `063c0be` / `v1.27.9`
- Release: Sandbox Feel—mined/Q/death items bounce and magnet, sneak lowers the camera and clings to ledges, eating chews, unsupported leaves decay, plus footstep dust, water bubbles, mine-punch SFX, knockback, hotbar name fade, and pickup pops.
- Live proof: GitHub Pages v1.27.9 exposes `main.js?v=875` and `game.js?v=851`; fresh start reached `started=true` with a hidden title, `_spawnWorldDrop` wired, and zero page-owned errors.

## Verified v1.27.9 evidence

- Full `node tests/smoke.mjs` passed, including minecraft-feel contracts.
- All changed JavaScript syntax checks passed.
- Root/public HTML parity and `git diff --check` passed.
- Exact local candidate at `127.0.0.1:8792` and live Pages starts reached `started=true` with a hidden title and zero page-owned errors.
- Visual proof: ordinary local solo cove frame was readable (sand, water, palms, sky, HUD, no black/gray renderer artifact). Live Start also reached a playable world; the captured live frame was split-screen because co-op settings persisted in that browser.

## Operational state

- Canonical checkout remains quarantined because it contains broad old mixed WIP. Never publish from it.

## Next bounded product slice

A five-minute roam/reload leak sample on real GPU hardware, or DualSense hardware proof. This checkpoint does not complete Minecraft-class atmosphere.

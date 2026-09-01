# Frontier Survival v1.27.1 — Tidewatch Harbor Signal

**Release type:** verified incremental checkpoint

## Player journey

1. Start the Tidewatch expedition from a campfire with an iron pick.
2. Reach and secure Iron Ravine, then return to campfire to claim the existing charts and signal-torches reward.
3. The return transforms the home cove: a **Tidewatch Harbor Signal** is raised on a nearby clear natural landing.
4. The Discovery Log records the transformation, so the completed voyage has a durable visible consequence at camp and a new visual departure point for later routes.

## What changed

- Added a lightweight authored harbor-signal landmark: timber deck and mast, route/chart board, twin signal lanterns, and two animated pennants.
- Added deterministic placement that looks for a clear 3×3 natural platform near the cove, avoiding occupied built surfaces when the nearby world is loaded.
- The prop exists only after the expedition reward is claimed; it rebuilds safely on load from the already-persisted claimed expedition state.
- Added `harbor_signal` to the persistent Discovery Log and an explicit reward-claim message.
- All mesh/material resources are owned and disposed by the landmark lifecycle; the frame update only animates the two lanterns and pennants.

## Verification

- Static: `168` executable import edges audited; zero cache-bust omissions; `node --check` passed for every changed module; root/public HTML parity and `git diff --check` passed.
- Automated: full smoke suite exited `0` with `462` PASS assertions plus six TAP subtests. New strict harbor-signal integration contract runs from the canonical smoke command.
- Runtime: exact local candidate served from `127.0.0.1:8784`, version `v1.27.1`, `main.js?v=867`, and `game.js?v=843`. Fresh New World reached `started=true`, hid the title, rendered HUD/world, and captured zero page-owned errors. A controlled claimed-reward runtime probe created the signal with 12 children, 2 lanterns, and 2 pennants.
- Visual: ordinary fresh-start and controlled claimed-reward screenshots were reviewed. The signal is visibly instantiated and the cove/world/HUD remains free of black/gray renderer artifacts. The cove has substantial existing authored scenery, so broader harbor composition remains a future presentation pass rather than a claim of final AAA parity.

## Scope remaining

This links an expedition reward to a durable home transformation, but it is not yet a player-placeable harbor construction system or the final ten-pillar target. The next strongest slice is to make the signal unlock a second named route or a player-selectable harbor build choice, while continuing mobile/co-op and long-session performance validation.

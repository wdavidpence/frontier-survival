# Frontier Survival v1.27.2 — Tidewatch Harbor Choice

**Release type:** verified incremental checkpoint

## Player journey

1. Complete the Tidewatch expedition and claim the return reward at campfire.
2. A **Tidewatch Harbor Signal** is raised on a nearby clear landing.
3. Walk up to the signal and press **F** (Solo) or **Circle** (Co-op P2) to choose a lasting harbor plan:
   - **Lookout Plan** — chart-table and brass spyglass for the next offshore route.
   - **Landing Plan** — low supply pier with mooring posts for skiff returns.
4. The chosen plan persists through save/load and is visible in the HUD and on the landmark itself.

## What changed

- Added a durable, legacy-safe `harborChoice` state with two authored plans.
- P1 and P2 share one interaction handler that cycles the plan at the signal.
- The signal visual rebuilds to the selected plan without changing the existing claimed-reward gate.
- Capture/save persist the choice as optional data so older saves remain loadable.

## Scope remaining

This is player-directed harbor expression on the Tidewatch return, not Minecraft-class building parity or all ten pillars completed. Broader authored regions, complete co-op harbor roles, and long-session performance remain open.

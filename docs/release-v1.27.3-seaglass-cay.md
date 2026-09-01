# Frontier Survival v1.27.3 — Seaglass Cay Lookout Route

**Release type:** verified incremental checkpoint

## Player journey

1. Complete Tidewatch and raise the Harbor Signal.
2. Choose the **Lookout Plan** at the signal.
3. That charts **Seaglass Cay**, a second named offshore destination with a glass beacon.
4. Travel to the cay and press **F** / **Circle** to survey it.
5. Return to the Harbor Signal to claim the cay chart. The Discovery Log records the voyage.

## What changed

- Lookout now unlocks a durable `lookoutRoute` instead of only rebuilding the harbor prop.
- Added a Seaglass Cay beacon visual and shared P1/P2 survey/claim handlers.
- Capture/save persist the route as optional data so older saves remain loadable.

## Scope remaining

This is one more authored expedition loop, not Minecraft-class world breadth or all ten pillars completed. Broader regional destinations, complete co-op harbor roles, and long-session performance remain open.

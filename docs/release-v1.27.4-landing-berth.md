# Frontier Survival v1.27.4 — Landing Berth

**Release type:** verified incremental checkpoint

## Player journey

1. Complete Tidewatch and raise the Harbor Signal.
2. Choose the **Landing Plan**.
3. Bring the skiff to the pier and press **F** / **Circle** to **moor** it at the working berth.
4. Press **F** / **Circle** again to **launch** it from the berth without the beach-push ritual.
5. The Discovery Log records the landing berth; moored state persists through save/load.

## What changed

- Landing now opens a durable `landingBerth` slip instead of only adding pier meshes.
- Shared P1/P2 handlers moor and launch the live dinghy at that slip.
- Capture/save persist the berth as optional data so older saves remain loadable.

## Scope remaining

This is working harbor-boat expression, not Minecraft-class building parity or all ten pillars completed.

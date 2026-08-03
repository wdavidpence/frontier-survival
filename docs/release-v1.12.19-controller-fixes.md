# Frontier Survival v1.12.19 — PS5 controller quick fixes

This is a focused local controller/UI correction on v1.12.18.

- DualSense left-stick Y now follows the standard convention: up moves forward, down moves backward.
- Cross/jump is edge-triggered: holding the button no longer repeatedly/latch-jumps; release and press again produces the next jump.
- PS5 mapping now follows the Minecraft-style PlayStation layout used by the game:
  - Cross jump; L2 use/place; R2 mine/attack; L3 sprint; R3 crouch.
  - Triangle Pack & Craft; Square drop; L1/R1 previous/next hotbar.
  - Options pause; right stick look; left stick move.
- Added an in-game Controller controls popup available from the title screen and HUD.
- Removed the old LOOK/keys debug overlay.
- Co-op instructional text is controller-specific while Solo laptop retains keyboard/mouse instructions.
- Co-op stat panels are compact and translucent for landscape iPhone-to-TV play.
- Expanded foliage clearance around fresh spawns so both split-screen cameras start with a readable view.

Verification:

- `node tests/smoke.mjs`: 366 PASS lines, exit 0.
- `node --check js/input.js`, `js/game.js`, `js/main.js`, `js/world.js`: pass.
- `git diff --check`: pass.
- Root/public HTML parity: pass.
- Mocked Gamepad probe: stick up → forward; stick down → backward; held Cross does not retrigger jump; release/repress does.
- Chromium local runtime: Solo/Co-op Start true, zero runtime errors, controller-only co-op true, no touch/debug overlay.
- Chromium visual review: readable co-op horizon, compact translucent stat windows, both HUDs/hotbars, controller popup readable at TV viewport.

Not pushed or deployed; publish only after explicit ship approval.

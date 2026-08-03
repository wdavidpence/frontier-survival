# Frontier Survival v1.12.18 — islands, TV co-op, and compact start flow

Baseline: v1.12.17, commit 338d821.

Player-visible changes:

- New World is immediate: the confirmation dialog is gone.
- New World clears the save and generates a fresh 32-bit random seed different from the current seed.
- Starter/world generation is wetter: the coastal shelf reaches farther from spawn, ocean basins begin at a higher noise threshold, and tropical island peaks occur more often inside those basins.
- Synchronous generation and chunk-worker generation use the same ocean/island thresholds.
- Existing Boat recipe and water-speed movement remain the intended travel loop: craft a Boat, equip it, then sail/swim between tropical islands, reefs, kelp, and beaches.
- Removed touchscreen movement/look overlays from the shipped HTML.
- Local Co-op is explicitly two-controller TV mode; both players are represented as DualSense/gamepad players, with controller-only input enabled in co-op.
- Start menu is wider, shorter, and responsive for laptop and TV browser viewports.
- Added a Nintendo-style “TV + PS5 setup” popup covering iPhone screen mirroring, DualSense Bluetooth pairing, two-controller co-op, and boat/ocean travel.
- Visible version/cache-bust surfaces are v1.12.18 / `main.js?v=280`.

Evidence:

- Full canonical smoke suite passes, including v1.12.18 regression assertions.
- Changed JavaScript syntax checks pass.
- `git diff --check` passes.
- `index.html` and `public/index.html` are byte-identical.
- Local menu bounding box stayed inside a 1280×577 browser viewport.
- Local Solo Start: `window.__FS.started === true`, fresh random seed, zero runtime errors.
- New World: immediate transition, no confirmation, seed changed from 334070334 to 2977004609, zero runtime errors.
- Local Co-op: `coopMode === true`, `input.controllerOnly === true`, split-screen HUD/hotbars render, ocean visible across the horizon, and no touch overlay exists.
- Setup popup visually reviewed and readable.

Known limitation: physical PS5 Bluetooth pairing and iPhone-to-TV casting cannot be exercised from this Linux browser harness; the shipped popup documents the exact user steps.

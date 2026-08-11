# Frontier Survival v1.12.43 — mining and crafting release review

## Scope

- Restored reliable primary-button mining/cutting through PointerEvent input alongside legacy mouse events.
- Reworked voxel DDA targeting to normalize camera vectors, use bounded steep-angle traversal, handle voxel-edge ties deterministically, and correctly compute negative-direction boundary distances.
- Added crafting progression metadata for all 55 recipes: category grouping plus Wood/Stone/Iron tier ordering. The existing inventory recipe list now presents the progression in that order; `recipesByCategory()` is available for future grouped UI.
- Added inline favicon to eliminate the browser's non-product 404 during runtime verification.

## Verification

- `node tests/smoke.mjs` — exit 0; full suite passed, including crafting metadata and angled-ray/input contracts.
- `node --check js/world.js js/input.js js/game.js js/crafting.js` — pass.
- `git diff --check` — pass.
- Root/public HTML byte parity — pass.
- Import audit — 107 relative ES-module edges, 0 missing cache-busts; changed world/input/crafting importers and entry are `?v=408`.
- Local Chromium: steep pitch `-0.35`, real `pointerdown`, target log removed, `+1 Log`, pointer release cleared held state, zero page errors.
- Local Chromium crafting: Start true, title hidden, inventory open, 55 recipe buttons, Planks highlighted/actionable.
- Live Pages: `https://wdavidpence.github.io/frontier-survival/` exposed v1.12.43 and `main.js?v=408`; live steep mining and crafting probes both passed with zero page errors.

## Worker lanes

- Claude produced the crafting metadata artifact; its real diff was independently inspected and selectively integrated.
- Antigrav attempted the bounded mining lane twice but was permission-gated before producing an artifact; Luna implemented and independently verified the root-cause fix.
- Luna retained final synthesis, browser judging, commit, and publication authority.

## Known boundary

This is a verified incremental checkpoint toward the Minecraft/AAA target, not a claim of full AAA parity. The current release specifically closes the reported LMB/angled-targeting regression and advances crafting progression/readability.

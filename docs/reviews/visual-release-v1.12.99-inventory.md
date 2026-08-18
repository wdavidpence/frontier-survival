# Frontier Survival v1.12.99 — Inventory Interaction Checkpoint

Date: 2026-08-18
Base: v1.12.98 / commit 8dfed66
Scope: inventory/hotbar/chest icon accessibility and bidirectional slot drag/drop.

## Player-visible scope

- Added pure immutable `swapSlots(slots, from, to)` logic for full-stack moves and occupied-destination swaps.
- Added native dragstart/dragover/drop/dragend wiring across the inventory panel and P1/P2 hotbars.
- Supports inventory indices 0..26 moving to all hotbar indices 0..8 and the reverse direction, preserving full stack data.
- Existing click-based arm-and-assign and controller/keyboard paths remain intact.
- Populated inventory, hotbar, and chest slots now expose colorful procedural SVG icons with item names in `title`, `aria-label`, and SVG `aria-label` metadata.
- Populated slots are draggable; empty slots remain labeled and non-draggable.
- Added a visible drag cursor/affordance without changing the broader UI layout.

## Evidence buckets

### Static

- Product files: `js/inventory.js`, `js/item-icons.js`, `js/game.js`, transitive inventory importers `js/crafting.js` and `js/player.js`, `js/main.js`, both HTML artifacts, and `tests/smoke.mjs`.
- Cache-bust chain updated:
  - inventory `220 -> 221`
  - item-icons `2 -> 3`
  - player `238 -> 239`
  - crafting `416 -> 417`
  - game `448 -> 449`
  - entry `460 -> 461`
- Root/public HTML byte parity passed.
- Touched JS syntax checks passed.
- `git diff --check` passed.
- Import audit: 124 relative import edges, zero missing cache-bust markers, zero stale old edges.

### Automated

- `node tests/smoke.mjs`: exit 0.
- PASS assertion lines: 414.
- New contracts cover immutable full-stack swapping, representative distinct icon families, SVG item labels, drag/drop payloads, all-slot metadata, and existing arm-and-assign behavior.

### Runtime/browser

Exact candidate was served locally at:
`http://127.0.0.1:18911/?review=inventory-candidate&seed=1884808540`

- Fixed seed started successfully after the known 5-second generation bridge timeout.
- Inventory opened through the real `E` keyboard path.
- Runtime state showed `started: true`, inventory open, five populated starter icons, all nine hotbar slots represented, and zero page-owned errors.
- Actual DOM drag events verified both directions:
  - hotbar slot 0 -> inventory slot 9 moved the full ration stack `{id:101,count:8}`;
  - inventory slot 9 -> hotbar slot 8 moved the same stack back;
  - no item loss and zero page-owned errors.

### Visual

- Open inventory screenshot: `/tmp/frontier-inventory-open.png`
- Ration, torch, stick, berries, and log icons are colorful and visibly distinct.
- Names/counts are readable; crafting recipes and hotbar remain intact.
- No black/gray occlusion, clipping, or obvious layout regression.
- Drag affordance is supported by DOM/runtime evidence rather than pixels alone.

## Decision

Accepted as a complete local v1.12.99 inventory checkpoint pending commit, push, and live Pages verification. Save/quit feedback and the broader held-item visual catalog remain open later slices.

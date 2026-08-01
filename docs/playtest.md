# Playtest Log

## Controls
WASD move, mouse look (click canvas), Space jump, Shift sprint, LMB mine, RMB place, 1-9 hotbar, R eat ration, Esc release mouse.

## Session 2026-07-28
- [x] Boot to world without console errors
- [x] Title → Start hides overlay and generates world
- [x] HUD meters + hotbar + help visible
- [x] Spawn on solid grass (block id 1 under feet), body temp ~37°C, full health
- [x] Day/night status line + weather + air temp
- [x] 49 chunk meshes present
- [ ] Pointer lock + look (needs real user mouse; automation limited)
- [ ] Move/jump/collide manual
- [ ] Break and place blocks manual
- [ ] Night cold + campfire recovery manual
- [ ] Sprint drains stamina manual
- [x] Eat ration / food from inventory (R)
- [x] Inventory E opens; recipes craftable when ingredients present
- [x] No free creative blocks — must gather to place

### Notes
- Crafting UI verified in browser (Pack & Craft panel, 27 slots, 8 recipes).
- Survival pressure still active while inventory open.

## Session 2026-07-31 (v1.11.4)
### Furnace — feed fuel, smelt input, take output (empty-handed)
- [ ] Place furnace block in world; walk up to it
- [ ] **Feed fuel:** hold coal/stick/charcoal/log in hotbar, right-click furnace → toast "You fed the furnace." (fuel consumed from hotbar)
- [ ] **Smelt input:** hold ore/food item that can be smelted, right-click furnace → toast "Furnace: smelting …" (item consumed, cooking starts)
- [ ] **Take output:** switch to empty hand, right-click furnace → toast "Furnace → +N <item>" (smelted item added to inventory)
- [ ] Verify furnace continues cooking over time (leave tab, return after ~10s; output should be ready if fuel remains)
- [ ] Verify furnace warmth still works (campfire heat map preserved alongside furnace-tick)

## Furnace smelting (v1.11.4+)

1. Craft/place a **Furnace** (8 cobble).
2. Look at furnace, press **F** holding **coal/charcoal/log** → feeds fuel (`furnace-tick` + heat).
3. Press **F** holding **iron ore / sand / clay / log** (smeltable) → queues input.
4. Wait a few seconds (furnace ticks each frame).
5. Empty hand + **F** on furnace → take output (ingot/glass/brick/charcoal).
6. Coop: same world block; prefer one player operating the furnace at a time.

## Slab half place (v1.11.5+)

1. Craft wood slabs; select hotbar.
2. Look **up** slightly and place → "Top slab placed."
3. Look level/down and place → "Bottom slab placed."
4. Meta stored in `_slabHalf` map (mesh half still follow-up).

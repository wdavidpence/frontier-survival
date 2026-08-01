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

## Session 2026-07-31 (v1.11.6)
### Stair facing + crop growth wires

- [ ] Place a stair block (craft from wood planks)
- [ ] **Face meta:** look at different faces of a block and place stairs — verify stair orientation matches the face (top, bottom, side)
- [ ] Walk up/down stairs to confirm collision and step height feel correct
- [ ] **Crop growth:** plant seeds on tilled soil, water if applicable
- [ ] Wait or leave/return — verify crops advance through growth stages (seed → sprout → growing → ready)
- [ ] Harvest fully grown crops by breaking them (should drop the crop item)
- [ ] Verify growth is additive — multiple stages visible, not just binary on/off

## Stair facing (v1.11.6+)

1. Craft stairs from wood planks (4 planks in 2×3 crafting grid).
2. Select stairs in hotbar, hold empty hand.
3. Look at the **top face** of a placed block and place → stair sits on top, facing your direction.
4. Look at the **side face** of a block and place → stair attaches to that side, vertical rise toward you.
5. Look **down** at ground and place → stair sits on the ground, facing your direction.
6. Meta stored in `STAIRS_WOOD` face property; mesh orientation follows.

## Crop growth (v1.11.6+)

1. Craft a hoe; till dirt to farmland (dirt must be adjacent to water).
2. Select seeds in hotbar, right-click farmland → seed planted.
3. Crops advance through growth stages via `advanceCropGrowth` each tick.
4. Wait (or leave/return) — watch crops grow taller through stages.
5. Fully grown crops drop the crop item when broken (empty hand + LMB).
6. Replant after harvest for continuous growth cycle.

## Slab half place (v1.11.5+)

1. Craft wood slabs; select hotbar.
2. Look **up** slightly and place → "Top slab placed."
3. Look level/down and place → "Bottom slab placed."
4. Meta stored in `_slabHalf` map (mesh half still follow-up).

## Stairs facing (v1.11.6+)

1. Craft wood stairs; select hotbar.
2. Face a direction and place → toast \"Stairs face &lt;cardinal&gt;.\"
3. Meta stored in `_stairFace` map (mesh rotation follow-up).

## Door toggle (v1.11.7+)

1. Place wooden door; look at it; press **F** → opens/closes via `toggleDoor` helper.

## Bed facing (v1.11.8+)

1. Craft/place bed while facing a direction → toast includes \"Bed faces &lt;cardinal&gt;\".
2. Meta stored in `_bedFace` (mesh follow-up). Coop sleep rules unchanged.

## Compass / map HUD (v1.11.9+)

1. Hold **compass** or **map** → status shows xyz.
2. If spawn known: also `spawn &lt;m&gt;m ±deg` via `compass-bearing` helpers.
3. Map still adds chunk coords.

## Compass spawn bearing (v1.11.9+)

1. Craft a compass from iron ingots + redstone dust (iron in cross pattern, redstone center).
2. Ensure spawn is known (spawn point set on first world join or via command).
3. Hold compass in any hotbar slot → status line should show xyz coordinates.
4. If spawn is known: status line also shows `spawn <m>m ±deg` with distance and bearing angle.
5. Walk in a straight line toward spawn — verify distance decreases monotonically.
## Compass / map HUD (v1.11.9+)

1. Hold **compass** or **map** → status shows xyz.
2. If spawn known: also `spawn <m>m ±deg` via `compass-bearing` helpers.
3. Map still adds chunk coords.
4. Verify: walk away from spawn with compass selected — distance should rise; turn until ±deg near 0 when facing spawn.

## Bed facing (v1.11.8+)

1. Craft a bed from wool + wood planks (3 wool across top row, 3 planks below).
2. Select bed in hotbar, hold empty hand.
3. Look at a flat surface (ground or block top face) and place → bed appears, facing the direction you were looking.
4. The bed's headboard faces your viewing direction; foot extends away from you.
5. Meta stored in `BED` face property; mesh orientation follows the cardinal direction.
6. Verify by walking around the bed — headboard should be on the side you were facing when placed.

## Station pure modules (v1.12.0+) — pending world wire

The following station helper modules are implemented and smoke-tested but not yet wired into the world (no block placement, no right-click interaction):

- **Smoker** — `smoke` helper (v1.12.0)
- **Blast Furnace** — `blast` helper (v1.12.0)
- **Campfire cook** — `campfire-cook` helper (v1.12.0)
- **Grindstone** — `grindstone` helper (v1.12.0)
- **Stonecutter** — `stonecutter` helper (v1.12.0)

These are additive, pure helpers with no world-side plumbing yet. Wire them up as blocks when ready for playtest.

## Cauldron, Enchanting Table, Brewing Stand, Beacon, Noteblock pure helpers (v1.11.10+)

The following pure helper modules are implemented and smoke-tested but not yet wired into the world (no block placement, no right-click interaction):

- **Cauldron** — `cauldron` helper (v1.11.10)
- **Enchanting Table** — `enchant` helper (v1.11.10)
- **Brewing Stand** — `brew` helper (v1.11.10)
- **Beacon** — `beacon` helper (v1.11.10)
- **Noteblock** — `noteblock` helper (v1.11.10)

These are additive, pure helpers with no world-side plumbing yet. Wire them up as blocks when ready for playtest.

## Station pure backlog (v1.12.0+)

Pure helpers exist for smoker/blast/campfire-cook/grindstone/stonecutter/hopper/piston/daylight/loom/cartography/smithing/composter.
\`furnace-tick.tickFurnace(state, units, speedMult=1)\` supports smoker/blast (pass 2). World block UI wire is follow-up.

## Furnace speedMult default (v1.12.1+)

\`furnace-tick.tickFurnace(state, units, speedMult=1)\` defaults \`speedMult\` to **1** (normal speed). Passing 2 doubles cook rate for smoker/blast furnace variants. The default is additive — no world-side change until wired up as a block property.

## 1.17+ pure helpers (v1.12.3+)

Pure modules exist for scaffolding, honey-slide, powder-snow, dripstone, amethyst, copper, lightning-rod, sculk, frogspawn, mangrove.
Honey move/jump mult is applied in player when block under feet name contains "honey" (block id TBD).

## Powder snow sink (v1.12.6+)

1. When a powder-snow-named block exists at feet/body, player sinks via powderSnowSinkVy.
2. Jump while sinking is reduced. No-op until block id/name exists in world.

## Scaffolding climb (v1.12.7+)

1. Scaffolding-named blocks act like climbable (scaffoldingClimbVy).
2. Forward/jump climb up; crouch/back climb down.

## 1.21 pure combat backlog (v1.12.8+)

Pure: breeze-charge, wind-charge, mace-smash, wolf-armor, armadillo-scute, bogged-arrow, crafter-enabled, heavy-core, flow-armor-trim.

## Mace smash melee (v1.12.9+)

1. Holding a mace-named tool applies maceSmashDamage using recent fall speed as distance proxy.
2. No-op bonus until fall speed builds or a mace item exists.

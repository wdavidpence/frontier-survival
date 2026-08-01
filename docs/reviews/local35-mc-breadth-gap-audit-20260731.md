# local35 MC-breadth gap audit (2026-07-31)

Provenance: judge takeover after local35 thrash/no-artifact. Read-only inventory of repo paths plus pure modules landed this wave.

## Present (repo evidence)

- `js/blocks.js`: FURNACE, STAIRS_WOOD, SLAB_WOOD, DOOR_*, FENCE, IRON_ORE, COAL_ORE, SULFUR_ORE
- `js/items.js`: wood/stone/iron picks/axes, IRON_INGOT, COAL, CHARCOAL, CLAY_BALL, BRICK
- `js/crafting.js`: furnace craft, smelt_iron/charcoal/glass/brick heat recipes, stations stubs
- `js/building-shapes.js`: pure stairs/slab/door/fence shapes + recipes (smoke covered)
- `js/tool-tiers.js`: pure TIER_ORDER wood/stone/iron + harvest/speed (smoke covered)
- `js/smelting.js`: pure fuel + ore/sand/clay/log maps (smoke covered)
- `js/chests.js`, `js/inventory.js`, `js/equipment.js`, `js/durability.js` present
- Co-op split-screen shell already in title/playMode path (v1.11.x)

## Gaps vs Minecraft-breadth primary

| sev | gap | preferred file | pure-first? |
|-----|-----|----------------|-------------|
| P0 | Wire building-shapes recipes into craftRecipe list | `js/crafting.js` | pure done |
| P0 | Authoritative tool harvest via tool-tiers in mine path | `js/durability.js` or mine helper | pure done |
| P0 | Furnace UI tick consume fuel / produce from smelting.js | `js/game.js` (sole) | pure done |
| P1 | Stair/slab placement orientation | `js/game.js` / world place | after pure |
| P1 | Station catalog tags (workbench/furnace/anvil stub) | `js/station-catalog.js` | pure first |
| P1 | Ore-drop table consistency | `js/ore-drops.js` | pure first |
| P1 | Co-op craft/smelt binds acting player inventory | `js/game.js` | after solo |
| P2 | Roof/ramp/corner stairs | `js/building-shapes.js` | pure first |
| P2 | Barrel / double-chest UX | `js/chests.js` | single owner |
| P3 | Decorative building variants | blocks/atlas | later |

## Co-op impact (P0 configs)

- PC KBM+pad, PC dual pad, PS5 dual DualSense: crafting/smelting/hotbar must be per-actor.
- Stair place must use acting player yaw; no shared hotbar selection bleed.

## Top 10 next mintable card titles

1. Wire STAIRS/SLAB/DOOR/FENCE recipes into craftRecipe list
2. Mine path uses tool-tiers harvestLevel
3. Furnace block UI tick uses smelting.js fuel+recipes
4. Stair placement yaw/flip in placeBlock path
5. Slab top/bottom half placement
6. Pure station-catalog workbench/furnace tags
7. Pure ore-drops table for IRON_ORE/SULFUR_ORE
8. Co-op craft binds to acting player inventory
9. Roof/ramp pure shape helpers
10. Platform: gamepad inventory grid focus (D-pad)

## Decision

Keep pure MC modules landing under depth caps; serialize any `game.js`/`crafting.js` wire cards to one owner.

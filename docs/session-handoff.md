# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable spine + **inventory/crafting**:
- Three.js FPS voxel world, survival meters, day/night
- 27-slot inventory, E = Pack & Craft
- Recipes: planks, sticks, torches, campfire, wood/stone tools
- Drops go to inventory; place/eat consume stacks; tools speed mining
- `node tests/smoke.mjs` — **20/20** pass
- Browser: craft UI verified, campfire craft chain works, no JS errors

**Play:** serve repo root → http://127.0.0.1:8765/public/

## Next (earliest high-value unchecked)
1. **localStorage save/load** (world seed + inventory + survival + time)
2. Break feedback / texture atlas polish
3. Passive animals + meat + campfire cooking
4. Predators at night
5. Clothing warmth + sleep/bed

## Loop to feel SC-like right now
Mine logs → E → planks → sticks → campfire → place before night → R eat rations → craft picks for stone/coal → torches.

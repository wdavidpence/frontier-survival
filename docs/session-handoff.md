# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable survival loop with ecology:
- Voxel world, meters, craft, save/load
- **Wildlife:** hares, deer (flee + meat), wolves (hunt, worse at night)
- **Food:** raw meat (risky), cook at campfire (F or E recipe with heat)
- LMB melee animals; spawn cleared 16m; wolves outer ring
- `node tests/smoke.mjs` — **24/24**
- Browser: 19 fauna, nearest 20m, hunt→cook works, wolf chase at night, no JS errors

**Play:** http://127.0.0.1:8765/public/ (serve repo root)

## Next
1. Texture atlas + break/hit juice (graphics/feel)
2. Clothing warmth + sleep/bed
3. Deeper audio / more biomes
4. Performance (greedy mesh) + larger world
5. Public ship polish

## Loop
Mine wood → campfire → hunt hare/deer → F cook meat near fire → avoid wolves at night → K save.

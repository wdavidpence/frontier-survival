# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable SC-style survival loop:
- World, craft, fauna, cook, save, atlas/FX
- **Clothing:** hide → cloth → hat/coat/boots; F equip; warmth on body temp
- **Bed:** craft/place; F at night (or exhausted) to sleep — time skip + rest
- Hunt drops hide; equipment saved
- `node tests/smoke.mjs` — **28/28**
- Browser: equip coat warmth 8, sleep 80→20, time advances, equip UI 3 slots

**Play:** http://127.0.0.1:8765/public/

## Next
1. Deeper ambient audio
2. Greedy mesh / larger world performance
3. Public ship (README polish + GitHub Pages)
4. Optional: spear/bow, more biomes

## Loop
Hunt → hide/cloth/clothes → bed → sleep night safely → fire + coat beat cold.

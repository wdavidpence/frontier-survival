# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable spine + inventory/crafting + **localStorage save/load**:
- Seed, sparse world edits, inventory, survival body, time/weather
- Autosave ~40s, on inventory close, beforeunload; K / Save button
- Title: Continue save / New world
- `node tests/smoke.mjs` — **21/21** pass
- Browser: save→mutate→load restores pos, hunger, logs, campfire block

**Play:** serve repo root → http://127.0.0.1:8765/public/

## Next
1. Animals + meat + campfire cooking (ecology / food loop)
2. Predators at night
3. Texture atlas + break feedback (graphics polish)
4. Clothing warmth + sleep/bed
5. Soundscape depth

## Loop
Mine → craft campfire → place → K save → refresh → Continue.

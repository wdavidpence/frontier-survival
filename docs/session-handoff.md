# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable survival with ecology + **graphics juice**:
- Procedural texture atlas on all blocks (grass/dirt/stone/wood/etc.)
- Break crack overlay + debris particle bursts
- Improved break/hit SFX
- Wildlife, craft, cook, save/load as before
- `node tests/smoke.mjs` — **25/25**
- Browser: atlas map + UVs on chunks, crack + particles OK, no JS errors

**Play:** http://127.0.0.1:8765/public/

## Next
1. Clothing warmth + sleep/bed (survival depth)
2. Deeper audio / ambient
3. Performance (greedy mesh) + larger world
4. Public ship polish / GitHub Pages

## Loop
Mine (see cracks + chips) → craft fire → hunt → cook → survive night → save.

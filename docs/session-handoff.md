# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable SC-style survival loop with **ambient audio**:
- Wind, night drone, rain, fire bed, water beds (procedural Web Audio)
- Day birds / night wolf howls; crackle near campfires
- Full loop: mine, craft, hunt, cook, clothes, bed sleep, save
- `node tests/smoke.mjs` — **29/29**
- Browser: ambient layers start, mix day/night/fire/rain OK, AudioContext running

**Play:** http://127.0.0.1:8765/public/

## Next
1. Greedy mesh / larger world performance (or keep radius + optimize)
2. Public ship: README polish + GitHub Pages if credentials allow
3. Optional spear/bow, more biomes, difficulty modes

## Note
1.0 is a strong playable vertical slice — not feature-parity with commercial Survivalcraft. Ship path is polish + deploy.

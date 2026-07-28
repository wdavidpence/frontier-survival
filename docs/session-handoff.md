# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode.

## Current state (2026-07-28)
Playable SC-style loop + **greedy mesh / larger world**:
- Greedy meshing + atlas tile shader (fract UVs)
- World radius 5 → **121 chunks**; browser ~31k verts / 15.5k tris
- Full survival systems (meters, craft, fauna, cook, clothes, bed, ambient audio, save)
- `node tests/smoke.mjs` — **30/30**

**Play:** http://127.0.0.1:8765/public/

## Next
1. Public ship: README polish + GitHub Pages (if auth available)
2. Optional: spear/bow, biomes, difficulty modes
3. More SC depth over time (electricity long-term)

## Honest scope
Strong playable browser 1.0 vertical slice — not commercial Survivalcraft feature parity.

# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode for this repo.

## Current state (2026-07-28)
Playable Phase 0–2 spine is running:
- Three.js FPS voxel world (7×7 chunks, dig/place, collision)
- Survival meters: health, hunger, stamina, body temp, fatigue
- Day/night, weather, campfire heat, rations (R)
- HUD + title/death overlays + procedural SFX
- `node tests/smoke.mjs` — 12/12 pass
- Browser verified: boot OK, grass spawn, temp 37°C, 49 chunk meshes, no JS errors

**Play:** serve repo root → `http://127.0.0.1:8765/public/`  
(server may already be on port 8765)

## Next (earliest unchecked)
Phase 1 polish / Phase 3 craft:
1. Crafting + inventory (E): log→planks→sticks→craft campfire/torch/tools from gathered blocks
2. Save/load localStorage
3. Texture atlas + break feedback
4. Then animals / predators (Phase 4)

## Verification
```bash
cd /mnt/c/Users/wdavi/Projects/SurvivalCraftMobile
node tests/smoke.mjs
# python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/public/
```

## Notes
- Original IP only; SC is systems reference.
- Keyboard/mouse browser target, not mobile.

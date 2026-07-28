# Session Handoff

**Project:** Frontier Survival (SurvivalCraft-inspired browser PC game)  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
**Directive:** Hermes sole SWE + tester — **do not** delegate to OpenCode for this repo.

## Current state (2026-07-28)
- Empty scaffold dirs created; design docs written (`docs/SCM.md`).
- Next: implement Phase 0–2 playable spine (Three.js FPS voxel + survival meters).

## Resume rule
Open `docs/plan.md`, do earliest `[ ]` item, verify, mark `[x]`, update this file, commit.

## Verification
```bash
cd /mnt/c/Users/wdavi/Projects/SurvivalCraftMobile
node tests/smoke.mjs
# serve public/ on a free port, open in browser
```

## Notes
- Brand internally as original game; SC is design reference only.
- Target keyboard/mouse browser, not mobile.

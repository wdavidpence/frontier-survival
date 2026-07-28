# Implementation Checklist

Track with `[ ]` / `[x]`. Earliest unchecked item is next work.

## Phase 0 — Spine
- [x] docs/SCM.md design pillars + full roadmap
- [x] docs/plan.md checklist
- [x] docs/session-handoff.md
- [ ] README.md
- [ ] public/index.html shell + HUD
- [ ] js modules: main, input, game loop, blocks, world gen stub, player, survival, time, hud, audio stub
- [ ] tests/smoke.mjs
- [ ] git init + first commit
- [ ] local static server verified

## Phase 1 — Voxel world
- [ ] Block definitions + properties
- [ ] Heightmap world gen (grass/dirt/stone/sand/water shore)
- [ ] Chunk mesh (faces culling)
- [ ] Raycast dig/place
- [ ] Player physics collision
- [ ] Hotbar holds blocks

## Phase 2 — Survival body
- [ ] survival.js meters + drain formulas
- [ ] day/night + ambient temp
- [ ] hunger/starvation
- [ ] stamina sprint
- [ ] sleep debt
- [ ] cold damage without warmth
- [ ] HUD meters live

## Phase 3 — Shelter & craft
- [ ] inventory + recipes
- [ ] campfire heat
- [ ] clothing warmth
- [ ] death/respawn modes

## Phase 4+ 
See docs/SCM.md phases 4–8.

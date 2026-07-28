# Implementation Checklist

Track with `[ ]` / `[x]`. Earliest unchecked item is next work.

## Phase 0 — Spine
- [x] docs/SCM.md design pillars + full roadmap
- [x] docs/plan.md checklist
- [x] docs/session-handoff.md
- [x] README.md
- [x] public/index.html shell + HUD
- [x] js modules: main, input, game loop, blocks, world gen, player, survival, time, audio
- [x] tests/smoke.mjs
- [x] git init + commits
- [x] local static server + browser boot verified

## Phase 1 — Voxel world
- [x] Block definitions + properties
- [x] Heightmap world gen (grass/dirt/stone/sand/water/snow/trees/coal)
- [x] Chunk mesh (face culling, vertex colors)
- [x] Raycast dig/place
- [x] Player physics collision
- [x] Hotbar selects placeable stacks (inventory-backed)
- [ ] Greedy meshing / larger render distance
- [ ] Texture atlas (replace flat colors)
- [ ] Break particles + block damage crack overlay

## Phase 2 — Survival body
- [x] survival.js meters + drain formulas
- [x] day/night + ambient temp + weather
- [x] hunger/starvation
- [x] stamina sprint
- [x] sleep/fatigue debt
- [x] cold damage without warmth; campfire heat helps
- [x] HUD meters live
- [x] Homeostasis fix (mild weather no longer freezes you)
- [ ] Sleep action / pass-out recovery at bed or camp
- [ ] Clothing warmth slots
- [ ] Difficulty modes wired to UI

## Phase 3 — Shelter & craft
- [x] inventory + recipes (planks, sticks, torches, campfire, tools)
- [x] Mine drops into inventory; place consumes stacks
- [x] Tool mine speed (wood/stone pick, wood axe)
- [x] E opens Pack & Craft UI
- [ ] campfire cook meat
- [ ] clothing craft
- [ ] death drops optional by mode
- [ ] localStorage save/load

## Phase 4 — Ecology
- [ ] passive animals + meat
- [ ] predators
- [ ] hunting tools

## Phase 5+
See docs/SCM.md

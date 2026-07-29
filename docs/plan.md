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
- [x] Texture atlas (procedural canvas)
- [x] Break particles + block damage crack overlay
- [x] Greedy meshing / larger render distance (radius 5)

## Phase 2 — Survival body
- [x] survival.js meters + drain formulas
- [x] day/night + ambient temp + weather
- [x] hunger/starvation
- [x] stamina sprint
- [x] sleep/fatigue debt
- [x] cold damage without warmth; campfire heat helps
- [x] HUD meters live
- [x] Homeostasis fix (mild weather no longer freezes you)
- [x] Sleep action / pass-out recovery at bed or camp
- [x] Clothing warmth slots
- [x] Difficulty modes wired to UI

## Phase 3 — Shelter & craft
- [x] inventory + recipes (planks, sticks, torches, campfire, tools)
- [x] Mine drops into inventory; place consumes stacks
- [x] Tool mine speed (wood/stone pick, wood axe)
- [x] E opens Pack & Craft UI
- [x] localStorage save/load
- [x] campfire cook meat
- [x] clothing craft
- [x] bed craft + sleep
- [x] death drops optional by mode

## Phase 4 — Ecology
- [x] passive animals + meat (hare, deer)
- [x] predators (wolves, night aggro)
- [x] hunting via melee (LMB)
- [x] hunting tools (spear; bow later)
- [ ] breeding / herds depth

## Phase 5+
See docs/SCM.md

## Phase polish — v1.1 (docs/improvements-20.md)
- [x] 20 QoL / mode / combat / HUD polishes shipped

## Phase polish — v1.2 (docs/improvements-v1.2.md)
- [x] 20 content / systems polishes (farm, iron, bow, spoilage, FX)

# Frontier Survival — Competitive Master Plan (permanent)

**Status:** ACTIVE until genre-competitive  
**Live:** https://wdavidpence.github.io/frontier-survival/  
**Backlog source of truth:** `docs/roadmap/competitive-backlog.json` (~2000+ atomic items; +250 split-screen/competitive 2026-07-31)
**Bugs:** `docs/bugs/BUGLOG.md`  
**Mint state:** `docs/roadmap/mint-state.json`  
**Board:** `frontier-survival`  
**Workers:** `qwen27s` (strongest shared 27B), `qwen35` (shared 35B), `local35` (local gpt-oss-20b)

### Near-term priority lock (2026-07-31 evening orchestrator)

1. **Primary:** Minecraft-breadth — building expressiveness, tool tiers, stations, mining/smelting loop
2. **Co-op P0 (all three configs this month):** PC KBM+pad, PC dual pad, PS5 dual DualSense local split-screen
3. **Feel:** Survivalcraft-depth systems may mirror closely; original IP only (no trademarked names/assets)
4. **Ship cadence:** every ~20 judge turns on any verified green incremental plateau
5. **Ops:** aggressive mint into scheduled buffer (auto-park); depth 4+2+1; workers implement, Hermes judges/publishes

### MC pure / coop modules landed (v1.11.1–v1.12.0)

Additive only (no feature removal):

- Shapes: `building-shapes`, `roof-shapes` (+ corner stairs), `slab-place`, `stair-place`, `bed-facing`, `door-hinge`, `fence-gate`, `trapdoor`
- Progression: `tool-tiers`, `smelting`, `furnace-tick`, `ore-drops`, `mine-tier`, `station-catalog`, `anvil-repair`, `barrel-storage`, `crop-growth`, `bow-draw`, `cauldron-level`, `enchant-cost`, `brewing-step`, `beacon-pyramid`, `noteblock-pitch`
- Stations: `smoker-speed`, `blast-furnace-speed`, `campfire-cook`, `grindstone-repair`, `stonecutter-recipe`, `hopper-buffer`, `piston-push`, `daylight-sensor`
- Redstone-ish: `lever-power`, `pressure-plate`, `torch-falloff`, `water-level`
- Misc pure: `sign-text`, `ladder-climb`, `chest-lock`, `compass-bearing`, `item-frame`, `cauldron`, `enchant`, `brew`, `beacon`, `noteblock`
- Coop: `hotbar-cycle`, `input-coop.cycleHotbar`, pad D-pad scroll via `pad-input` + `player` hotbar
- Game wires: `resolveBlockDrop` P1/P2; furnace-tick use+tick; slab half / stair face / bed face on place; door `toggleDoor`; crop `advanceCropGrowth`; compass spawn bearing HUD; furnace-tick/game speedMult (smoker/blast-ready)

- Newer pure (v1.12.3–1.12.4): `scaffolding`, `honey-slide`, `powder-snow`, `dripstone-fall`, `amethyst-grow`, `copper-oxidize`, `lightning-rod`, `sculk-spread`, `frogspawn`, `mangrove-propagule`

Still open: mesh for slab/stair/bed meta, wire stations into world blocks, SC body-systems depth, more ecology.

---

## North-star definition of “complete”

The game is **done enough** when a cold player who knows Survivalcraft / Minecraft / Valheim can play 10+ hours and say:

1. **Nature is the boss** — temperature, weather, hunger, sleep, injury matter every session.  
2. **World feels alive** — biomes, dense forests, caves, structures, fauna, day/night beauty.  
3. **Progression is deep** — tools → stations → electricity/automation → exploration goals.  
4. **Base building is expressive** — stairs, roofs, stability-ish rules, storage, lighting, defense.  
5. **Juicy and stable** — 60fps target on mid PC, few softlocks, solid save/load, good audio/VFX.  
6. **Original IP** — systems inspired by the genre; no SC assets/names/code.

Competitive references (systems only): Survivalcraft, Minecraft, Valheim, Green Hell, The Forest, Subnautica (systems pacing), Project Zomboid (needs clarity).

---

## Pillars (map 1:1 to backlog)

| Pillar | Competitive bar | Primary worker |
|--------|-----------------|----------------|
| worldgen | Dense beautiful worlds, caves, structures | qwen27s |
| survival | SC-grade body systems + fair early game | qwen27s |
| ecology | Dangerous/useful fauna, taming, livestock | qwen27s |
| crafting | Deep stations + tiered gear | local35 / qwen27s |
| building | Expressive base building | qwen35 |
| electricity | SC-like logic & automation | qwen27s |
| exploration | Travel, map, long goals | local35 |
| audio_art | Juice, UX, a11y | qwen35 |
| qa_perf | Tests, perf, platform | qwen27s (test) |
| multiplayer_future | Stubs/docs only until SP solid | qwen35 |
| narrative_meta | Journal, seasons, weekly packs | qwen35 |

---

## Permanent operating loop (non-negotiable)

```
every 45–90 min (cron) AND whenever Hermes is asked to continue:
  1. Smoke tests + quick browser boot/move/look check
  2. Append new bugs to docs/bugs/BUGLOG.md (P0–P3)
  3. Mint bugs as Kanban cards (P0/P1 first)
  4. Mint next N backlog items from competitive-backlog.json (rolling horizon 15–40 ready)
  5. hermes kanban dispatch — fill qwen27s depth~4, qwen35~2, local35~1
  6. Review done cards: verify claims, reject garbage, commit/push on green
  7. Update docs/session-handoff.md + mint-state.json
```

**Hermes default profile = orchestrator** (assemble cards, test, route).  
**OpenCode workers = implementers** via kanban assignees.  
**qwen27s = preferred verifier** for playtest/regression when Hermes needs a second opinion.

Never leave the board empty while the game is incomplete.

---

## Card quality rules

- One vertical slice or one pure module per card  
- Explicit files + acceptance criteria + `node tests/smoke.mjs`  
- No overlapping file ownership across parallel ready cards  
- Parent-link true dependencies  
- Surgical edits; never git reset --hard  
- Sync `index.html` + `public/index.html` on UI changes  
- Commit only when card says so OR orchestrator publishes a verified batch  

---

## Milestone tracks (years of work collapsed into backlog)

- **M0** Control/render/save reliability (ongoing P0)  
- **M1** Living world (trees, biomes, caves, fauna density)  
- **M2** Survive the month (food chain, clothing, disease light, seasons stub)  
- **M3** Industrial age (metals, stations, electricity)  
- **M4** Kingdom (building expression, defense, livestock)  
- **M5** Expedition (bosses, structures, endgame escape)  
- **M6** Ship polish (perf, a11y, content completeness)

Each milestone is hundreds of backlog rows, not one card.

---

## How to grow past 2k cards

```bash
# regenerate/expand combinatorial generator (scripts/expand-backlog.py) then:
node scripts/mint-kanban-wave.mjs --count 25
```

Weekly: add a new polish pack theme + 20–40 items to JSON.

---

## Legal

Inspired by genre systems only. No Survivalcraft / Mojang / Iron Gate IP.

---

## Platform goals (user mandate) — P0

Locked 2026-07-31:
1. Browser/PC only stack; PS5 via **PS5 web browser** + two DualSense (no native SDK).
2. Competitive bar: **SC systems first**, then MC breadth (phased).
3. **Local split-screen only** (no online until SP+local coop solid).
4. Publish every ~20 judge turns if green+better (smoke + browser).
5. Workers: qwen27s≤4, qwen35≤2, local35≤1 unchanged.
6. Original IP; genre-feel systems OK.
7. Unattended permanent loop (docs/overnight-progress.md).

### PlayStation 5 (browser)
- GH Pages URL in PS5 browser; dual DualSense via Gamepad API
- TV-safe HUD, large text, Console perf preset
- Full UI nav without mouse

### Local split-screen co-op (2P) — **current P0 ship goal**
- Design: `docs/roadmap/splitscreen.md`
- Title: Solo | Local Co-op · shared world · two viewports
- P1: KBM or pad0 · P2: pad1 · same tab, no netcode
- Save/load both players · pure modules first then game wire

Pillars: `Coop P0:*`, `Platform P0:*` priority ≤12 mint first.

---

## Progress log — pure modules landed (v1.11.1–1.11.3)

All additive; no feature removal. Smoke tests green throughout.

### v1.11.1 — MC-breadth pure modules (shapes, tool tiers, smelting)
- **building-shapes** (`js/building-shapes.js`): stairs, slab, door, fence block shapes
- **tool-tiers** (`js/tool-tiers.js`): tiered tool system (wood → stone → iron)
- **smelting** (`js/smelting.js`): fuel + recipe smelting loop
- Smoke: 197 tests PASS

### v1.11.2 — MC pure wave 2 + craft shape recipes
- **ore-drops** (`js/ore-drops.js`): ore-specific drop tables
- **station-catalog** (`js/station-catalog.js`): crafting station registry
- **mine-tier** (`js/mine-tier.js`): mine-tier resolveBlockDrop
- **roof-shapes** (`js/roof-shapes.js`): roof and ramp shape helpers
- **hotbar-cycle** (`js/hotbar-cycle.js`): hotbar cycle select per pad (P1/P2 isolation)
- Crafting wire: stairs/slab/door/fence recipes in RECIPES
- Smoke: 192 tests PASS

### v1.11.3 — furnace-tick, barrel-storage, corner stairs
- **furnace-tick**: furnace progress tick wired into game loop
- **barrel-storage** (`js/barrel-storage.js`): barrel storage module
- **cornerStairs**: pure corner stair shape helpers
- Smoke: 197 tests PASS

Total new JS modules landed: 10 (`building-shapes`, `tool-tiers`, `smelting`,
`ore-drops`, `station-catalog`, `mine-tier`, `roof-shapes`, `hotbar-cycle`,
`furnace-tick`, `barrel-storage`, `cornerStairs`).

### v1.11.5 — MC pure wave 3 (slab half place + stair/bow/crop/door helpers)

- **stair-place** (`js/stair-place.js`): stair facing/orientation in world
- **slab-half** (`js/slab-place.js`): slab half/full place logic
- **bow-draw** (`js/bow-draw.js`): bow draw pure helper
- **crop-growth** (`js/crop-growth.js`): crop growth cycle pure helper
- **door-hinge** (`js/door-hinge.js`): door hinge orientation pure helper
- Smoke: 219 tests PASS

### v1.11.6 — MC pure wave 4 (stair facing wire + sign/fence/ladder helpers)

- **sign-text** (`js/sign-text.js`): sign text display pure helper
- **fence-gate** (`js/fence-gate.js`): fence gate open/close pure helper
- **ladder-climb** (`js/ladder-climb.js`): ladder climb pure helper
- Smoke: 223 tests PASS

### v1.11.7 — MC pure wave 5 (door toggle wire + chest/torch/compass/bed helpers)

- **toggleDoor** (`js/game.js`): door toggle wire (game integration)
- **chest-lock** (`js/chest-lock.js`): chest lock pure helper
- **torch-falloff** (`js/torch-falloff.js`): torch light falloff pure helper
- **compass-bearing** (`js/compass-bearing.js`): compass bearing pure helper
- **bed-facing** (`js/bed-facing.js`): bed facing/sleep pure helper
- Smoke: 228 tests PASS

Total new JS modules landed v1.11.5–v1.11.7: 9
(`stair-place`, `slab-place`, `bow-draw`, `crop-growth`, `door-hinge`,
`sign-text`, `fence-gate`, `ladder-climb`, `chest-lock`, `torch-falloff`,
`compass-bearing`, `bed-facing`).

- Player wires: honey move/jump; powder-snow sink (block name match until ids exist).

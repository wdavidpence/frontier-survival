# SurvivalCraft-Inspired Browser Game (SCM)

**Working title:** Frontier Survival (SurvivalCraft-inspired; original code/art/audio — not Candy Rufus IP)

**Target:** Browser on PC / living-room game systems — **keyboard + mouse for 1.0** (no mobile-first UI)

**Goal:** A truly fun, playable survival sandbox where you must *survive* (temperature, hunger, sleep, wildlife, weather), not only mine and craft like soft Minecraft PE clones.

**Legal:** Inspired by Survivalcraft systems and genre pillars. No Survivalcraft assets, names, logos, or copied code. Original procedural art and SFX.

---

## What makes Survivalcraft different from Minecraft

Research pillars (public descriptions of Survivalcraft / SC2 — used as design goals only):

1. **Nature is the antagonist** — cold, heat, starvation, exhaustion, and predators kill you as often as combat does.
2. **Body systems stack** — health + hunger + stamina + sleep + temperature (+ humidity in later SC). Pass out if you ignore sleep while fleeing.
3. **Clothing matters** — tailor clothes; warmth and protection are loadout decisions, not vanity.
4. **Food is serious** — hunt/grow; cooking matters; raw food is limited; spoilage pressure in deeper versions.
5. **Animals are dangerous and useful** — predators attack; livestock/rideables exist; “eat and avoid being eaten.”
6. **World systems** — infinite-ish terrain, caves, weather, boats, explosives, and eventually **electricity / logic**.
7. **Modes** — Harmless → Challenging → Cruel (permadeath / harsh rules) + Creative/Adventure-like variants.

**1.0 design thesis:** If the player can ignore meters and play pure Minecraft miner, we failed. Every session should force shelter, food, and warmth decisions before deep mining fantasy.

---

## Tech stack (1.0)

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Browser, ES modules, no bundler required for dev | Fast iteration, GitHub Pages deployable |
| 3D | Three.js (CDN or vendor) | First-person voxel + lighting without engine lock-in |
| Audio | Web Audio API + procedural / short buffers | No huge asset packs at start |
| Persistence | localStorage + optional downloadable world JSON | Single-player first |
| Hosting | Static `public/` → GitHub Pages / any static host | Real players can open a URL |
| Tests | Node smoke tests + manual playtest checklist | Automated invariants + human feel |

**Not Unity/Godot for 1.0** — browser-first delivery. Can re-skin/port later if shipping as “real product” on stores.

---

## Architecture

```
public/
  index.html              # shell, HUD, script tags
js/
  main.js                 # boot
  game.js                 # loop, mode, pause
  input.js                # pointer lock, WASD, mouse look
  world/
    blocks.js             # block IDs, properties (solid, hardness, drops)
    chunk.js              # mesh build (greedy later)
    world.js              # chunk map, get/set, raycast
    gen.js                # heightmap + caves + trees
  player/
    player.js             # pos, vel, eye height, inventory hotbar
    survival.js           # HP, hunger, stamina, temp, sleep, wetness
  systems/
    time.js               # day/night, ambient temp curve
    weather.js            # clear/rain/snow pressure on temp
    crafting.js           # recipes
    animals.js            # AI: flee/graze/hunt
    combat.js             # melee, damage events
    audio.js              # footsteps, hit, ambient, UI
  ui/
    hud.js                # meters, hotbar, messages
    menus.js              # title, pause, death, options
  render/
    materials.js          # atlas / vertex colors
    sky.js                # sky color, sun/moon light
assets/                   # optional textures later
docs/
  SCM.md                  # this file
  plan.md                 # phased checklist
  session-handoff.md      # resume state
  playtest.md             # tester notes
tests/
  smoke.mjs               # node-runnable pure logic tests
```

---

## Multi-phase plan (to a real playable product)

### Phase 0 — Project spine ✅ (this session target)
- [ ] Repo layout, README, plan, handoff
- [ ] Three.js boot, pointer lock, FPS camera
- [ ] Crosshair + basic HUD shell
- [ ] Local static server + smoke test runner

### Phase 1 — Voxel world (playable dig/build)
- [ ] Block palette: air, grass, dirt, stone, sand, wood, leaves, water, snow, log, planks, cobble
- [ ] Chunked terrain (16³ or 16×worldH×16), heightmap + dirt/stone layers
- [ ] Raycast break/place (LMB/RMB), tool hardness tiers later
- [ ] Collision + gravity + jump
- [ ] Simple vertex-colored meshes (atlas later)

### Phase 2 — Survival body (the SC differentiator)
- [ ] Meters: Health, Hunger, Stamina, Body Temp, Sleep
- [ ] Day/night cycle drives ambient temperature
- [ ] Hunger drains over time; starvation damages health
- [ ] Sprint costs stamina; empty stamina → slow + vulnerable
- [ ] Sleep debt builds; at night low sleep → blur/sway/pass-out risk
- [ ] Cold nights damage without shelter/clothes/fire
- [ ] Eat from hotbar; simple cooked vs raw rules

### Phase 3 — Shelter, fire, clothing (survive the night)
- [ ] Campfire block: heat radius, light, cook station
- [ ] Craft: planks, sticks, crafting table, basic tools, cloth scraps
- [ ] Clothing slots: head/chest/legs/feet with warmth + armor values
- [ ] Beds / sleep through night when safe and sheltered
- [ ] Death screen + respawn rules per mode

### Phase 4 — Ecology (eat and be eaten)
- [ ] Passive: cow/sheep-like → meat, hide
- [ ] Predator: wolf/bear-like → hunt player when hungry/close
- [ ] Simple flock/avoid AI; night aggression bump
- [ ] Hunting tools: wooden spear, bow (later)
- [ ] Corpse harvest + spoilage timer on raw meat

### Phase 5 — Caves, ores, progression
- [ ] Cave worms in gen; darkness fear (torches)
- [ ] Coal, iron, (later diamond-tier)
- [ ] Tool tiers gate dig speed / ore breaks
- [ ] Underground temp slightly stable; lava heat danger later

### Phase 6 — Weather, water, travel
- [ ] Rain/snow weather states
- [ ] Wetness increases cold damage
- [ ] Swim stamina; drown risk
- [ ] Boat craft + water travel
- [ ] Map/compass craft

### Phase 7 — Depth systems (SC “eventual parity” track)
- [ ] Farming + growth seasons light touch
- [ ] Explosives
- [ ] Electricity / logic gates (SC signature endgame)
- [ ] Rideable animals
- [ ] Multi-biome world (forest, desert, tundra, shore)
- [ ] Adventure structures (shipwrecks, graves) — original designs

### Phase 8 — Product polish (ship to real players)
- [ ] Options: sensitivity, render distance, difficulty mode
- [ ] Soundscape + music stingers (original)
- [ ] Graphics pass: texture atlas, AO, water shader, particles
- [ ] Save slots, seed sharing, settings persistence
- [ ] Performance: greedy meshing, worker gen, LOD
- [ ] Accessibility: colorblind meters, key rebind
- [ ] Legal page, credits, privacy (if accounts ever)
- [ ] Public playtest build + feedback loop

### Modes (config flags)
| Mode | Hunger | Temp | Predators | Death |
|------|--------|------|-----------|-------|
| Harmless | Off/slow | Mild | Passive unless provoked | Respawn |
| Survival | On | On | Normal | Respawn |
| Challenging | Fast | Harsh | Aggressive | Respawn + drop items |
| Cruel | Fast | Harsh | Aggressive | **Permadeath world** |
| Creative | Off | Off | Off | Fly + infinite blocks |

---

## 1.0 acceptance (minimum “fun survival”, not feature-complete SC)

Player can in one sitting (~20–40 min):

1. Spawn on shore/forest seed, learn controls from on-screen hints.
2. Punch wood → craft table → basic tools.
3. Feel **hunger** and **cold** pressure before first night.
4. Build a minimal shelter + place fire to stop freezing.
5. Eat cooked food; manage stamina while exploring.
6. Survive (or die learning from) one predator encounter.
7. See clear day/night lighting and HUD meters that matter.
8. Save/load or at least don’t lose progress on refresh (localStorage).

Polish bar: readable HUD, pointer-lock FPS feel, no softlocks, audio feedback on break/hit/eat/hurt, death is informative not rage-quit spam.

---

## Controls (1.0 PC)

| Input | Action |
|-------|--------|
| W A S D | Move |
| Mouse | Look (pointer lock) |
| Space | Jump |
| Shift | Sprint (stamina) |
| Ctrl / C | Crouch (later) |
| LMB | Break / attack |
| RMB | Place / use |
| 1–9 | Hotbar |
| E | Inventory / craft |
| Q | Drop |
| F | Use / interact (fire, bed, animal) |
| Esc | Pause / release mouse |
| T | Chat/debug (dev) |
| F3 | Debug overlay (dev) |

---

## Non-goals for early phases

- Mobile touch UI as primary
- Multiplayer
- Exact Survivalcraft block IDs or UI clone
- Full logic electricity on day one
- AAA PBR graphics

---

## Verification ladder (every slice)

1. `node --check` on edited JS modules  
2. `node tests/smoke.mjs` pure logic  
3. Static server serves `public/` with 200  
4. Manual playtest checklist items checked in `docs/playtest.md`  
5. Update `docs/session-handoff.md` + plan checkboxes  
6. Commit when a coherent slice is verified  

---

## Session ownership

- **SWE + tester:** Hermes sole implementer (no OpenCode delegation for this project per user directive).
- Resume via: `docs/session-handoff.md` + earliest unchecked item in `docs/plan.md`.

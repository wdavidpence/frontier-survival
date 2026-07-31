# Frontier Survival — Competitive Master Plan (permanent)

**Status:** ACTIVE until genre-competitive  
**Live:** https://wdavidpence.github.io/frontier-survival/  
**Backlog source of truth:** `docs/roadmap/competitive-backlog.json` (~2000+ atomic items; +250 split-screen/competitive 2026-07-31)
**Bugs:** `docs/bugs/BUGLOG.md`  
**Mint state:** `docs/roadmap/mint-state.json`  
**Board:** `frontier-survival`  
**Workers:** `qwen27s` (strongest shared 27B), `qwen35` (shared 35B), `local35` (local 35B-MTP)

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

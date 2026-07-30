# Session Handoff

**Project:** Frontier Survival  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`

## Live
- Repo: https://github.com/wdavidpence/frontier-survival  
- Pages: https://wdavidpence.github.io/frontier-survival/

## Local
Serve repo root → http://127.0.0.1:8765/  
Tests: `node tests/smoke.mjs` — **72 passing** (as of 2026-07-30, v1.5 + pure modules: animals feed/tame, logic/electricity, biomes)

## Latest
**v1.5** — doors, glass, clay/bricks, bear, bleed/bandage, wooden sword, furnace, shift-click split stacks, sleep fade overlay, drink water.

Prior: v1.4 exposure · v1.3 depth · v1.2 content · v1.1 QoL

## Tooling
OpenCode allowed for implementation tasks.

## Kanban Routing
See [docs/kanban-routing.md](kanban-routing.md) for worker assignment, file ownership, and verify rules.

## Next
v1.6 plan → `docs/improvements-v1.6.md` (20 items: biomes, breeding, boats placeable, logic/electricity lite, map/compass, farming, etc.).

## Latest
**v1.6 planning** — kanban board `frontier-survival` active with three hardware-ranked workers:
- **qwen27s** (rank 1, fastest) — primary implementer, up to 4 parallel cards.
- **qwen35** (rank 2) — second lane, 1–2 cards.
- **local27** (rank 3, slowest) — overflow/tiny leftovers only.

See `docs/kanban-routing.md` for full routing contract and file ownership rules.

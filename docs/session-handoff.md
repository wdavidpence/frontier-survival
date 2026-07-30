# Session handoff — Frontier Survival

**Permanent mode ACTIVE** until genre-competitive / polished / bug-free.

**v1.8.7** (a4ad31b+) — judge-verified batch: difficulty explain, grace 30m, atlas 7x7+lava, audio voice cap, chunk-worker stub (IDs match blocks), lava tubes + deep clay, ?v=187
**Live:** https://wdavidpence.github.io/frontier-survival/ — hard refresh
**Local verify:** http://127.0.0.1:8767/ — browser boot showed forest terrain + HUD + hotbar (seed 429562)

## Hermes role (permanent)
SWE manager + orchestrator + **code judge**. Workers implement; Hermes independently tests and is the only ship gate. File locks prevent concurrent writers destroying good code. See docs/kanban-routing.md.

## Permanent pipeline
MASTER_PLAN + competitive-backlog → mint → local workers → Hermes judge (smoke+browser+diff) → commit at green plateaus → BUGLOG → cards
Cron: FS permanent kanban loop every 45m (04f1c4c224d7)
Depth: qwen27s≤4, qwen35≤2, local35≤1, global≤7
Hot locks: world/game/atlas/blocks/smoke.mjs — one owner

## Board lanes
- qwen27s @100.71.141.123:1234
- qwen35 @100.122.149.120:8000
- local35 @100.90.123.54:8000

## Verify
node tests/smoke.mjs
browser New World: terrain+HUD+controls

## Open process notes
- mesh-pool.js stub present, not wired (card scheduled)
- Tree species + ore veins serial behind world.js lock
- Smoke tests serial behind tests/smoke.mjs lock

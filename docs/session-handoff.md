# Session handoff — Frontier Survival

**Permanent mode ACTIVE** until genre-competitive.

**v1.8.7** — verified batch: difficulty explain, grace 30m, atlas minify 7x7 + lava tile, audio voice cap 8, chunk-worker stub (BLOCK IDs matched to blocks.js; sync path default), lava tubes + deep clay ore IDs, beep stop fix. cache ?v=187
**Prior v1.8.6** (d4dc98f) — opaque DoubleSide solids + atlas fill
**Live:** https://wdavidpence.github.io/frontier-survival/ — hard refresh

## Permanent pipeline
MASTER_PLAN + competitive-backlog (1755+) → mint-kanban-wave → local OpenCode/Hermes workers (qwen27s/qwen35/local35) → verify/smoke → BUGLOG → new cards
Cron: `FS permanent kanban loop` every 45m (job 04f1c4c224d7)
Depth hard cap ~7 running (block park excess as depth_cap_park_until_capacity)
**File contention:** only ONE runner may own js/world.js | js/game.js | js/mesh-greedy.js at a time. Park peers with world_hot_file_contention.

## Board lanes
- qwen27s depth~4 @100.71.141.123:1234 (verify)
- qwen35 depth~2 @100.122.149.120:8000
- local35 depth~1 @100.90.123.54:8000
Frontier tokens: orchestrator/judge only

## Player notes
- Mouse left/right: OK as of 1.8.4+
- Terrain see-through: fixed 1.8.6 — hard refresh
- Early grace: 30 min damage-suppressed (1.8.7)
- PS5 DualSense + split-screen: backlog / depth-parked coop cards

## Verify
node tests/smoke.mjs

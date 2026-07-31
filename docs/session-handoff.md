# Frontier Survival — fresh-session handoff

Date: 2026-07-30 22:06 EDT (post v1.9.0)
Repo: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
Board: `frontier-survival`
Live: https://wdavidpence.github.io/frontier-survival/

## Role
Hermes default = SWE manager + orchestrator + sole judge. Workers implement; never auto-trust summaries.

## Workers
- qwen27s depth≤4 @ qwen27/qwen3.6-27b-mlx
- qwen35 depth≤2 @ qwen35/qwen3.6-35b-a3b-mlx
- local35 depth≤1 gpt-oss-20b via :18000 bridge (tiny pure/docs only)

## Last ship
**v1.9.0** `5a91dc0` — sequoia placer, chicken+seeds, spawn marker HUD/save, dual HTML, full `?v=190`. Smoke 106 PASS. Pushed main.

## Running (locks)
- t_fd069c2f qwen27s hash2_uniformity — **owns tests/smoke.mjs**
- t_a9e70d60 qwen27s spruce — **owns world/atlas/blocks**
- t_e00f012f qwen35 tutorial_tooltips — **owns game/modes/html**
- t_5e1bb100 qwen35 cow — **animals.js only** (no game while tutorial runs)

Parked: entity_cull file_lock_wait world+game; fox file_lock_wait animals; bulk ore/trees/caves scheduled.

## Caps
qwen27s≤4 qwen35≤2 local35≤1 global≤7. Always dispatch --max N. One owner hot paths.

## Next after current wave
1. Unblock next smoke test only when hash2 done.
2. Next tree only when spruce done.
3. Fox when cow done.
4. entity_cull after world+game free.
5. Do not mass-unblock body-system crash pile.

## Verify
node tests/smoke.mjs
Never git reset/clean/checkout --hard. Workers do not commit/push.

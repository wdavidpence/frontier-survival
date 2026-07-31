# Frontier Survival — fresh-session handoff

Date: 2026-07-30 (judge tick post v1.9.0 ship)
Repo: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
Board: `frontier-survival`
Live: https://wdavidpence.github.io/frontier-survival/

## Role
Hermes default is SWE manager + orchestrator + sole code judge. Workers implement; never auto-trust summaries.

## Workers
- `qwen27s` → qwen27/qwen3.6-27b-mlx @100.71.141.123:1234 depth≤4
- `qwen35` → qwen35/qwen3.6-35b-a3b-mlx @100.122.149.120:8000 depth≤2
- `local35` → gpt-oss-20b via WSL bridge :18000 (depth≤1). Prefer tiny pure/docs/reviews only when free.

## Last ship
**v1.9.0** — sequoia worldgen placer + forest rare spawn; chicken fauna + seeds feed; starter spawn-marker HUD/save; dual HTML synced; full ES `?v=190` bust. Smoke: 106 passed.

## Board posture
- Mass `blocked` body-system / multiplayer_future / cave pile = intentional backlog parks + old crash diagnostics (do not mass-unblock).
- Prefer unblocking pure qa tests and non-overlapping pure modules when capacity free.
- Hot locks one owner: world/mesh/atlas/blocks, game/main/player, animals, input, tests/smoke.mjs.
- Caps: qwen27s≤4, qwen35≤2, local35≤1, global≤7. Always `dispatch --max N`.

## Immediate next
1. Pure smoke tests (hash2 uniformity, bleed, boat, etc.) one smoke owner at a time.
2. Early-game balance cards that avoid world.js/game.js thrash if locks free.
3. Next tree species only after sequoia closed; serialize world.js.
4. Browser boot check on :8767 periodically.
5. Do not mint more body-system mega cards until core competitive loop polished.

## Commands
```bash
cd /mnt/c/Users/wdavi/Projects/Frontier-Survival
node tests/smoke.mjs
hermes kanban --board frontier-survival stats
hermes kanban --board frontier-survival dispatch --max 7
```

Never git reset/clean/checkout --hard. Workers do not commit/push.

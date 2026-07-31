# Frontier Survival — fresh-session handoff

Date: 2026-07-30 (judge tick post v1.9.0 ship + folder rename)
Repo: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
Compat junction: `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile` → Frontier-Survival
Board: `frontier-survival`
Live: https://wdavidpence.github.io/frontier-survival/

## Role
Hermes default is SWE manager + orchestrator + sole code judge. Workers implement; never auto-trust summaries.

## Folder rename (done)
Local folder is now **Frontier-Survival** (was SurvivalCraftMobile). Updated:
board.json default_workdir, all kanban workspace_path + card bodies, cron `04f1c4c224d7`, default/qwen27s/qwen35/local35 environment_hints, judge/routing skills, profile memories, mint script, README.
GitHub remote remains `frontier-survival`. Prefer new path in all new work.

## Workers
- `qwen27s` → qwen27/qwen3.6-27b-mlx @100.71.141.123:1234 depth≤4
- `qwen35` → qwen35/qwen3.6-35b-a3b-mlx @100.122.149.120:8000 depth≤2
- `local35` → gpt-oss-20b via WSL bridge :18000 (depth≤1). Prefer tiny pure/docs/reviews only when free.

## Last ship
**v1.9.0** — sequoia worldgen placer + forest rare spawn; chicken fauna + seeds feed; starter spawn-marker HUD/save; dual HTML synced; full ES `?v=190` bust. Smoke: 106 passed. Local boot :8767 boot OK, 0 JS errors.

## Board posture
- Mass `blocked` body-system / multiplayer_future / cave pile = intentional backlog parks (do not mass-unblock).
- Prefer unblocking pure qa tests and non-overlapping pure modules when capacity free.
- Hot locks one owner: world/mesh/atlas/blocks, game/main/player, animals, input, tests/smoke.mjs.
- Caps: qwen27s≤4, qwen35≤2, local35≤1, global≤7. Always `dispatch --max N`.

## Immediate next
1. Pure smoke tests (hash2 uniformity, bleed, boat, etc.) one smoke owner at a time.
2. Early-game balance cards that avoid world.js/game.js thrash if locks free.
3. Next tree species only with exclusive world.js lock.
4. Browser playtest periodically on :8767.
5. Never idle board.

```bash
cd /mnt/c/Users/wdavi/Projects/Frontier-Survival
hermes kanban --board frontier-survival stats
node tests/smoke.mjs
```

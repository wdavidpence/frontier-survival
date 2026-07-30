# Kanban Routing Contract — Frontier Survival

Board: `frontier-survival`  
Workspace: `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`  
Orchestrator: Hermes `default` (Grok) — manages board only; does not implement game code.

## Hardware-ranked workers (authoritative)

| Rank | Profile | Endpoint | Bandwidth | Parallel depth | Role |
|------|---------|----------|-----------|----------------|------|
| 1 STRONGEST | `qwen27s` | http://100.71.141.123:1234/v1 · qwen3.6-27b-mlx | ~818 GB/s | **4** | Default implementer: pure modules, game.js slices, tests, HTML/docs |
| 2 MID | `qwen35` | http://100.122.149.120:8000/v1 · qwen3.6-35b-a3b-mlx | ~400 GB/s | **2** | Second lane: multi-file slices, pure helpers, keep 1–2 cards warm |
| 3 SLOWEST | `local27` | http://100.90.123.54:8000/v1 · qwen3.6-27b-mtp | ~320 GB/s | **1** | Overflow only: tiny single-file leftovers when others saturated |

**Do not** treat local27 as the preferred pure-module worker. Prefer qwen27s first, then qwen35, then local27.

## Card sizing

- **qwen27s**: up to ~4 concurrent ready cards if files don't overlap; vertical slices OK.
- **qwen35**: 1–2 concurrent cards; good for gated integration after pure parents.
- **local27**: at most **1** ready/running card; small docs/tests only.

## File ownership

- Never two ready cards that edit the same path.
- `game.js` integration: one owner at a time (prefer qwen27s; qwen35 if primary busy).
- Pure new modules (`js/biomes.js`, `js/logic.js`, etc.): any of top two ranks.
- `index.html` + `public/index.html` always paired.

## Verify always

```bash
node tests/smoke.mjs
```

- Never `git reset` / `clean` / `checkout` / destructive restore.
- Commit/push only when the card says so and tests pass.

## Operator commands

```bash
hermes kanban --board frontier-survival list
hermes kanban --board frontier-survival stats
hermes kanban --board frontier-survival show <id>
hermes kanban --board frontier-survival reassign <id> <profile> --reclaim
```

## OpenCode (optional inside workers)

If using OpenCode CLI from a worker:

- qwen27s → `opencode run --model qwen27/qwen3.6-27b-mlx '...'`
- qwen35 → `opencode run --model qwen35/qwen3.6-35b-a3b-mlx '...'`
- local27 → `opencode run --model lmstudio/qwen3.6-27b-mtp '...'`

## local27 status
**PAUSED** — endpoint offline; replacement qwen3.6-35b-mtp incoming. Do not assign work to `local27` until orchestrator clears this.

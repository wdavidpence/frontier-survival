# Kanban routing + judge gate (permanent)

Hermes **default profile** = SWE manager + orchestrator + **code judge**.
Workers (`qwen27s`, `qwen35`, `local35`) = implementers only.
`local35` = **gpt-oss-20b** on Windows 127.0.0.1:8000 via WSL bridge :18000.

## Reduced frontier-token protocol

This board follows `docs/frontier-token-protocol.md` permanently:

- qwen27s/qwen35/local35 perform implementation; the frontier model does not do bulk coding.
- Use one compact frontier judge pass per 45-minute loop, with extra passes only for P0s, crash recovery, release plateaus, or blocked dependencies.
- Feed the judge a compact envelope: stats, running card IDs/locks, diff stat/check, smoke result, browser error summary, and next cards. Do not reread unchanged source or full worker transcripts.
- Mechanical checks come before reasoning; batch independent checks.
- A judge pass emits one decision: continue, redirect, recover, block, or ship.
- Keep local35 warm with one bounded non-overlapping pure/docs/review lane when capacity permits; never manufacture a conflicting hot-file task.

## OpenCode workers (live)

| Rank | Profile | OpenCode `--model` | Endpoint (from WSL) | Depth |
|------|---------|--------------------|---------------------|-------|
| 1 STRONGEST | `qwen27s` | `qwen27/qwen3.6-27b-mlx` | http://100.71.141.123:1234/v1 | 4 |
| 2 MID | `qwen35` | `qwen35/qwen3.6-35b-a3b-mlx` | http://100.122.149.120:8000/v1 | 2 |
| 3 LOCAL | `local35` | `localoss/gpt-oss-20b` | http://172.26.128.1:18000/v1 → Win 127.0.0.1:8000 | 1 |

## Absolute rules
1. **Never trust a worker summary.** Diff + smoke + (when UI) browser before ship.
2. **No concurrent writers** on hot files. Preferred files in card body are **exclusive locks**.
3. Hot lock set (one card at a time globally):
   - `js/world.js`, `js/mesh-greedy.js`, `js/chunk-worker.js`, `js/mesh-pool.js`
   - `js/game.js`, `js/main.js`, `js/player.js`
   - `js/atlas.js`, `js/atlas-core.js`, `js/blocks.js`
   - `js/animals.js`, `js/input.js`, `tests/smoke.mjs`
4. If a card needs a locked file: `schedule` with `file_lock_wait:<path>` until owner done.
5. Depth caps: qwen27s≤4, qwen35≤2, local35≤1, global running≤7.
6. Judge may reclaim thrash / heartbeat-only **≥12m** with no artifacts (be patient under 12m). Prefer tiny pure/docs cards — see `docs/worker-24-7-ops.md`.
7. Commit/push only after Hermes judge green (smoke PASS + no known P0).
8. Cache bust **all** `?v=N` on ship (not entry alone).
9. Sync `index.html` + `public/index.html` on UI changes.
10. Never `git reset --hard` / `clean` / destructive checkout.

## 24/7 local workers

- Keep gateways up; run `node scripts/worker-lane-watchdog.mjs` on a timer (no frontier tokens).
- Mint small pure/docs cards when ready queue is thin — never idle healthy capacity.
- Frontier judge is sparse (45m loop); workers burn local tokens continuously.

## Dispatch order (each tick)
1. `node tests/smoke.mjs`
2. Browser boot :8767 or live GH Pages
3. Review done cards; fix judge-found damage
4. Commit+push at green plateaus
5. Mint backlog if thin
6. Unblock `file_lock_wait` when owner done
7. `hermes kanban dispatch --max 7`

## Acceptance
See `docs/roadmap/MASTER_PLAN.md`. Permanent until competitive.

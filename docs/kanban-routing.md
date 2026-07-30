# Kanban routing + judge gate (permanent)

Hermes **default profile** = SWE manager + orchestrator + **code judge**.
Worker profiles (`qwen27s`, `qwen35`, `local35`) = implementers only.

## Absolute rules
1. **Never trust a worker summary.** Diff + smoke + (when UI) browser before ship.
2. **No concurrent writers** on hot files. Preferred files in card body are **exclusive locks**.
3. Hot lock set (one card at a time globally):
   - `js/world.js`, `js/mesh-greedy.js`, `js/chunk-worker.js`, `js/mesh-pool.js`
   - `js/game.js`, `js/main.js`, `js/player.js`
   - `js/atlas.js`, `js/atlas-core.js`, `js/blocks.js`
4. If a card needs a locked file: `schedule` or `block` with `file_lock_wait:<path>` until owner done.
5. Depth caps: qwen27s≤4, qwen35≤2, local35≤1, global running≤7.
6. Judge may reclaim any runner thrashing shared dir workspace.
7. Commit/push only after Hermes judge green (smoke PASS + no known P0).
8. Cache bust **all** `?v=N` on ship (not entry alone).
9. Sync `index.html` + `public/index.html` on UI changes.
10. Never `git reset --hard` / `clean` / destructive checkout.

## Dispatch order (each tick)
1. `node tests/smoke.mjs`
2. Browser boot :8765 or live GH Pages — look/move/HUD sanity
3. Review done cards; revert or fix judge-found damage
4. Commit+push when at next bug-free plateau
5. Mint backlog wave if ready/scheduled thin
6. Unblock `depth_cap_park_*` / `file_lock_wait` only within caps + locks free
7. `hermes kanban dispatch`

## Acceptance for "done enough"
See `docs/roadmap/MASTER_PLAN.md` north-star. Permanent until competitive.

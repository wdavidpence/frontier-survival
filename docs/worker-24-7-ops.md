# Worker 24/7 ops (permanent)

Status: ACTIVE  
Goal: maximize **local/LAN worker tokens** 24/7; minimize **frontier** tokens to sparse judge only.

## Non-negotiables

1. **Workers implement** (`qwen27s`, `qwen35`, `local35`). Frontier/Hermes default **does not** bulk-code.
2. **Small finishable cards only** — one file or pure/docs/tests; body ≤ ~12 lines of constraints.
3. **Patience:** do **not** reclaim under **12 minutes** unless crash loop / wrong files / user cancel.
4. **Depth caps:** qwen27s≤4, qwen35≤2, local35≤1, global≤7.
5. **Hot locks** exclusive (see `docs/kanban-routing.md`).
6. **No idle board:** if `running=0` and gateways up → dispatch or mint **pure/docs** filler, then dispatch.
7. **Watchdog** (no LLM): `node scripts/worker-lane-watchdog.mjs` every ~15m via cron.

## Card recipe (copy shape)

```
Title: FS:<pillar>: <one verb phrase>
Body:
PURE|DOCS|SINGLE-FILE only.
File: <exact path> OR tests only OR docs only.
Do: <one acceptance check>.
Forbidden: game.js+world.js same card; commit/push; multi-module refactors.
Verify: node tests/smoke.mjs
Max-runtime: 12m
```

## Lane fill priority

1. Unblock `file_lock_wait` when owner done  
2. Dispatch ready work to free slots  
3. Mint pure helpers / smoke asserts / docs notes  
4. Single-file surgical features (animals, spoilage, UI CSS only)  
5. Judge-only: browser, ship, thrash >12m  

## Cron

- `worker-lane-watchdog` — every 15m, `no_agent`, local only — dispatch + aged reclaim  
- Frontier judge cron — every 45m, compact envelope only (existing protocol)

## Success metrics

- `running` usually ≥1 when machines healthy  
- Worker done cards accumulate without judge writing most diffs  
- Frontier sessions short: stats → smoke → browser → dispatch/ship

## Next pure card ideas

1. **Pure helper: `clamp()` utility** — single-file `scripts/clamp.mjs` export, used by world gen + UI positioning.
2. **Smoke assert: animal count sanity** — `tests/smoke.mjs` extension that asserts total animals within expected range after world gen.
3. **Docs: worker lane routing decision tree** — flowchart-style markdown for when to mint vs dispatch vs judge.
4. **Pure helper: `debounce()` utility** — single-file `scripts/debounce.mjs` for UI event throttling.
5. **Smoke assert: chunk count verification** — post-world-gen check that spawned chunk count matches expected formula.  

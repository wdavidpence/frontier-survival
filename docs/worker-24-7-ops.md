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
7. **Watchdog** (no LLM): `node scripts/worker-lane-watchdog.mjs` every ~5m via cron.

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

## No-idle (2026-08-02)

1. **Script (no LLM):** `node scripts/fs-noidle-watchdog.mjs` every ~5m  
   - If `oss20b` running=0 → unblock next scheduled `fauna:` card (depth 1)  
   - Reclaim thrash ≥18m → schedule park  
   - `hermes kanban dispatch --max 2`
2. **Judge cron:** every 15m runs watchdog first, then compact judge envelope (no bulk code).
3. **Ornith fauna wave:** parent-linked serial chain so children promote when parent completes.
4. **Luna:** hard cards (ocean place → aquatic fauna → streaming); do not dual-dispatch two Luna hot-file cards.

## No-idle default (2026-08-02) — permanent

User default: **5-minute** low-cost keep-alive + **hourly** higher-burn judge. Survives session reset via Hermes cron.

| Job | ID (example) | Schedule | Mode |
|-----|----------------|----------|------|
| FS noidle 5m (no-agent) | `7160980ee4f3` | every 5m | `fs-noidle-watchdog.sh` → `scripts/fs-noidle-watchdog.mjs` — **0 frontier tokens** |
| FS hourly judge | `04f1c4c224d7` | every 60m | LLM judge; smoke/diff/ship only when needed |

### Watchdog behavior
- If oss20b running=0 → unblock next scheduled title containing `fauna:` (depth 1)
- Reclaim running ≥18m thrash → park
- `hermes kanban dispatch --max 2`
- Writes **`docs/noidle-STATE.json`** + overnight progress row

### Live chat sessions
- Default poll interval when user wants subordinate updates: **5 minutes**, low-burn (STATE + kanban running only).
- ~Hourly or on events (done card, smoke red, ship): higher-burn verify.
- Cron does **not** post into CLI chat; permanence is cron + STATE file.

### Chat vs cron
- **Cron** = always-on pump after `/new` or reboot (if gateway/cron host up).
- **Chat poll** = optional live commentary while a human session is open.


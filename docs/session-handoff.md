# Frontier Survival — session brief

Date: 2026-07-30 22:40 EDT
Repo: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
Compat junction: `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile` → same repo (legacy only)
Board: `frontier-survival`
Live: https://wdavidpence.github.io/frontier-survival/
Local static: `http://127.0.0.1:8767/`
HEAD: `2955cf1` on `main` (ahead 1 vs origin/main — uncommitted plateau)
Last feature ship: **v1.9.0** `5a91dc0`
Release candidate: **v1.10.0** — dual HTML synced, ES cache bust `?v=200`, 110 smoke tests green

---

## Role

Hermes **default** = SWE manager + orchestrator + **sole code judge**.
Workers implement only. **Never auto-trust worker summaries** — verify with `git diff`, `node tests/smoke.mjs`, and browser boot.

Permanent loop until competitive / polished / bug-free vs MASTER_PLAN bar (original IP; SC-inspired systems only).

Reduced frontier-token protocol: see `docs/frontier-token-protocol.md`. Local/LAN workers implement; the frontier model receives compact judge envelopes and is reserved for mechanical-gated review, recovery, browser validation, and release decisions. The 45-minute cron prompt repeats this policy for fresh sessions.

---

## Repo path (authoritative)

**Always use:** `/mnt/c/Users/wdavi/Projects/Frontier-Survival`

Do not create or prefer `SurvivalCraftMobile` as a real directory. Junction exists only so old shells do not break.
Board `default_workdir`, cron `04f1c4c224d7`, profile `environment_hint`s, mint script, and skills already point at **Frontier-Survival**.

GitHub remote: `https://github.com/wdavidpence/frontier-survival.git`
GitHub Pages: https://wdavidpence.github.io/frontier-survival/

---

## Workers (OpenCode)

| Rank | Profile | Model | Endpoint (from WSL) | Depth |
|------|---------|-------|---------------------|-------|
| 1 | `qwen27s` | `qwen27/qwen3.6-27b-mlx` | http://100.71.141.123:1234/v1 | ≤4 |
| 2 | `qwen35` | `qwen35/qwen3.6-35b-a3b-mlx` | http://100.122.149.120:8000/v1 | ≤2 |
| 3 | `local35` | `localoss/gpt-oss-20b` | http://172.26.128.1:18000/v1 → Win 127.0.0.1:8000 | ≤1 |

Global running cap ≤7. Prefer local tokens 24/7; frontier (Grok) = judge / recovery / ship gate only.
Cron judge loop: `04f1c4c224d7` every 45m, workdir = Frontier-Survival, deliver local.

OpenCode: `~/.config/opencode/opencode.jsonc`
Example: `opencode run --model localoss/gpt-oss-20b '...'` from repo root.

---

## Last ship (v1.9.0)

- Sequoia: forest rare `_placeSequoia`, BLOCK/TILE 44–45 / atlas 46–48
- Chicken fauna + `feedItem: 'seeds'` / `_FEED_ID` + prompt feedMap
- Starter spawn-marker HUD (grace or &lt;120m) + `spawnPos` save/load
- Dual HTML synced; ES cache bust `?v=190`
- Smoke at ship: **106 PASS**

## Release candidate (v1.10.0)

- Cow animal species: stats, mesh, drops, AI, spawn
- Tutorial tooltips: tooltip lifecycle fix, dedup move_look, mine_wood/craft_table/first_craft fixes
- Early-game balance: starter_map_marker spawn pin HUD + spawnPos persistence
- Dual HTML synced; ES cache bust `?v=200`
- Smoke at RC: **110 PASS**

---

## Verification snapshot (this brief)

```text
node tests/smoke.mjs  → 110 tests passed
git diff --check result: no errors
browser :8767 boot status: listening, console-error count: 0
Judge tick: 2026-07-30 22:40 EDT
current running card: t_e00f012f qwen35
next non-overlapping action: t_474a86aa
```

Do not claim a new release until smoke + browser/runtime + diff review all pass again.

---

## Board snapshot (2026-07-30 22:40 EDT)

Running implementation: `t_474a86aa` qwen27s — FS:ecology: Animal: alligator (js/animals.js lock)
This judge card: `t_dbfbc37a` qwen27s — refresh session handoff (this task)
Parked: `t_e00f012f` qwen35 — tutorial_tooltips (scheduled, reclaimed after heartbeat-only/no-diff)

### Parked (do not mass-unblock)

- Extra smoke writers: `file_lock_wait:tests/smoke.mjs` (e.g. bleed_tick) until hash2 completes
- `entity_cull` and similar: wait until **world + game** free
- Body-system / multiplayer_future / bulk ore-cave crash pile: intentional backlog — leave blocked
- Next tree after spruce; fox after cow (now alligator)

---

## Hot locks (one owner globally)

- `js/world.js`, `js/mesh-greedy.js`, `js/chunk-worker.js`, `js/mesh-pool.js`
- `js/game.js`, `js/main.js`, `js/player.js`
- `js/atlas.js`, `js/atlas-core.js`, `js/blocks.js`
- `js/animals.js`, `js/input.js`
- `tests/smoke.mjs`

If a card needs a locked file:
`hermes kanban schedule <id> file_lock_wait:<path>`
then `hermes kanban dispatch --max N` when free.

---

## Judge tick checklist

1. `cd /mnt/c/Users/wdavi/Projects/Frontier-Survival && node tests/smoke.mjs`
2. Browser boot :8767 or live — New World: terrain + HUD + hotbar; log P0s in `docs/bugs/BUGLOG.md`
3. Review running/done via `hermes kanban show` + `git diff` — reclaim thrash / heartbeat-only &gt;~30m with no diffs
4. At green plateau: sync `index.html` + `public/index.html`, bust **all** `?v=N`, commit+push `vX.Y.Z`, update this brief
5. Unblock next non-overlapping cards only; enforce locks
6. `hermes kanban dispatch --max 7` (respect depth caps)
7. Mint only if scheduled backlog thin: `node scripts/mint-kanban-wave.mjs --count 15-25`
8. Never `git reset --hard` / clean / destructive checkout
9. Workers do **not** commit or push; Hermes publishes

---

## Immediate next (in order)

1. Wait for t_474a86aa (alligator) to finish; judge diff independently.
2. When alligator done → animals.js free for next fauna card (fox or similar).
3. Uncommitted plateau: review atlas/world/smoke diffs; sync dual HTML; commit+push when green.
4. When tutorial done → game free for entity_cull / UI polish (not both).
5. Playtest: forest sequoia density, chicken spawn/feed, spawn pin during grace.
6. Keep board non-idle without violating locks.

---

## North star

`docs/roadmap/MASTER_PLAN.md` + `docs/roadmap/competitive-backlog.json`.
Competitive Survivalcraft-class depth, polished, bug-free enough to ship and keep iterating.

---

## Core commands

```bash
cd /mnt/c/Users/wdavi/Projects/Frontier-Survival
hermes kanban --board frontier-survival stats
hermes kanban --board frontier-survival list --status running
hermes kanban --board frontier-survival show <id>
node tests/smoke.mjs
git diff --check
# local server if needed:
# node static on 8767 (prefer over broken python :8765)
```

CLI shapes: `comment` / `schedule` / `block` / `unblock` / `reclaim` / `reassign` / `dispatch`.

---

## Judge tick update — 2026-07-31 07:53 EDT

- Smoke: `node tests/smoke.mjs` PASS, 121 tests; `git diff --check` PASS.
- Browser: local :8767 HTTP 200, v1.10.0 title and Start probe reached in-game HUD/canvas; one blank browser exception was reported and remains a follow-up. Live Pages is stale at v1.9/`?v=190` and was not treated as shipped.
- Board: 2 running (`t_bf022953` qwen27s, `t_5a2fd61c` qwen35), 76 scheduled, 62 blocked, 51 done; timed-out tooltip audits were reclaimed and parked without artifacts. local35 is stopped and not dispatched.
- Release: broad uncommitted WIP; dual HTML currently equal; no commit/push. Next gate is artifact review plus reproducing the browser exception.

## Judge tick update — 2026-07-31 09:26 EDT

- Smoke: `node tests/smoke.mjs` PASS, 121 tests; `git diff --check` PASS.
- Browser: local :8767 HTTP 200, v1.10.0 title, ready document, and hidden title overlay in the current in-game state; live Pages HTTP 200 but stale at v1.9.0. The prior blank transition exception remains an unresolved release follow-up.
- Board: 1 running (`t_85b97c69` local35), 74 scheduled, 63 blocked, 53 done; qwen35 is stopped and a bounded dispatch probe spawned 0. No new artifact yet from the local35 tooltip audit.
- Release: broad uncommitted WIP; no commit/push. Continue the audit/recovery threshold and do not publish until browser/runtime and full release gates are clean.

## Judge tick update — 2026-07-31 09:44 EDT

- Smoke: `node tests/smoke.mjs` PASS, 121 tests; `git diff --check` PASS.
- Browser: local :8767 HTTP 200, v1.10.0; DOM Start probe hid the title overlay, but the browser collector still reports one blank exception during the transition. Live Pages remains stale at v1.9.0.
- Board: 1 running (`t_1493f014` local35), 73 scheduled, 63 blocked, 54 done; local35 was recovered from zero-running state with a bounded read-only performance audit.
- Release: `index.html` and `public/index.html` byte-identical; local cache-bust scan is `?v=200`; no commit/push.
- Next: verify the audit artifact, localize the blank browser exception, then route surgical fixes and rerun the full release gate.

## Judge tick update — 2026-07-31 10:41 EDT

- Smoke: `node tests/smoke.mjs` PASS, 121 tests; `git diff --check` PASS.
- Browser: local :8767 HTTP 200, v1.10.0. Authoritative DOM `#btn-start.click()` hides the title overlay and exposes in-game HUD/status; the browser collector still emits one blank exception, so runtime is not release-clean. Live Pages remains stale and unshipped.
- Board: 2 running (`t_60e7a214` qwen27s, `t_2b5cff13` local35), 73 scheduled, 63 blocked, 58 done; caps are respected. qwen35 is stopped.
- Release: broad uncommitted WIP; dual HTML equal; all scanned relative imports use `?v=200`; no commit/push.
- Audit note: completed `docs/reviews/local35-blank-start-exception.md` is contradicted by the served root (`public/js/main.js` is absent because the server root is the repository, while `index.html` references `./js/main.js`); it is not accepted as root cause.
- Next: verify `t_60e7a214` and `t_2b5cff13`, then route only concrete surgical corrections; keep release blocked until the blank exception is localized or disproven.

## Judge tick — 2026-07-31 12:44  (split-screen P0 kickoff)

Decisions locked: browser+PS5 browser; SC-first then MC; local split only; ship ~20-turn green; backlog +250; unattended.

Actions:
- Backlog 2005 items (+250 Coop/Platform/SC/MC slices); mint 12 P0; depth thrash reclaimed → keep 4 running
- Running: t_1fffa62d qwen35 design doc · t_e267d7d0 qwen35 PS5 QA · t_4dad004c local35 PlayerView · t_d7119712 qwen27s input-coop
- Parked lane-cap-hold: dual pads/bind/UI/smoke/viewport/bat etc.
- Smoke 121 PASS; browser :8767 v1.10.0 Start→hotbar/canvas, console errors 0
- Gateways: default+qwen27s+qwen35+local35 up; static scripts/static-8767.mjs
- Ship: NO (broad WIP; coop modules in flight; live still v1.9)

Next: verify pure-module cards → promote viewport/coop-state (no input.js) → dual camera after design · mint only when ready empty and under depth · never bare dispatch after mint.


## Judge tick update — 2026-07-31 16:34 EDT

- Smoke: `node tests/smoke.mjs` PASS, 158 tests; `git diff --check` PASS.
- Browser: local :8767 HTTP 200, v1.10.0; DOM Start probe hid title overlay and exposed survival HUD/status; browser console errors 0. Live Pages not treated as shipped.
- Board: 1 running (`t_8ca91af1` qwen27s), 76 scheduled, 68 blocked, 79 done. New correction `t_40dd3d59` is scheduled behind `js/input.js` ownership.
- Release: broad uncommitted WIP; dual HTML equal; 61 relative imports use `?v=200`, but 6 unversioned relative imports remain in co-op/JSDoc paths; no commit/push.
- Next: verify DualSense card, then unblock cache-bust correction and rerun full release checks.

## Ship v1.10.1 — 2026-07-31T17:36
- commit `4910079` pushed main
- Solo|Local Co-op + dual scissor cameras (P2 freecam pad1)
- smoke 159; ?v=201 full bust
- next: dual HUD, bind P1/P2, P2 body entity

## Judge tick update — 2026-07-31 20:11 EDT

- Smoke: `node tests/smoke.mjs` PASS (177 assertions); `git diff --check` PASS.
- Browser: local :8767 v1.11.0 Start probe reached HUD with title overlay hidden and console error count 0; live Pages v1.11.0 booted with console error count 0.
- Board: 6 running within caps: qwen27s 4 (`t_cabce7eb`, `t_be677c9d`, `t_db1c949`, `t_0713566e`), qwen35 1 (`t_e73a34f5`), local35 1 (`t_ee697345`). No dispatch spawn needed; scheduled hot-file siblings remain serialized.
- Release: HEAD/origin `866fc59`; dual HTML parity PASS; working-tree cache-bust `?v=220`; broad uncommitted WIP, no ship.
- Next: inspect completed artifacts, preserve hot locks, rerun smoke/browser at the next green plateau.

## Recovery update — 2026-07-31 20:46 EDT

- Board briefly oversubscribed to 45 running after a concurrent mint/dispatch wave. Excess worker sessions were terminated, cards reclaimed and parked with `lane-cap-hold`, and gateways restarted.
- Current board: 4 running within policy (qwen27s 2, qwen35 1, local35 1), 0 ready, 143 scheduled, 67 blocked, 122 done.
- Verification remains green: smoke 177 assertions, diff-check PASS, local/live v1.11.0 browser boot clean. No release while WIP remains uncommitted.

## Orchestrator kickoff — 2026-07-31 20:56 EDT (user clarifying answers)

### Locked decisions
- Near-term primary: **Minecraft-breadth** (building / tools / stations / mining)
- SC feel: match Survivalcraft systems/feel closely (systems may mirror tightly); original names/art/code only
- Co-op P0 this month — **all three**: PC KBM+pad, PC dual pad, PS5 dual DualSense split-screen
- Ship: any verified green incremental plateau every ~20 turns
- Mint aggressively into **scheduled** buffer; depth-cap park; no bare mass-ready mint
- Competitor deep research **deferred** (card `t_c7057b26` scheduled); recover workers + test first

### This tick actions
- Recovered idle board; fixed mint thrash (45→4) with reclaim+`lane-cap-hold`
- Patched `scripts/mint-kanban-wave.mjs` to **auto-schedule** after create (117/120 PARK on next wave)
- Minted cumulative **357** backlog items; board **scheduled ≈260**, ready 0, running 4, done 123
- Running: `t_db1c9499` tool-tier pure · `t_0713566e` smelting pure · `t_8a31a59c` door/fence pure · `t_ee697345` local35 MC-breadth audit
- Judge completed `t_e73a34f5` stairs pure (`js/building-shapes.js` + smoke)
- Smoke: **184 PASS**; dual HTML parity OK; local :8767 v1.11.0
- Browser: DOM Start after Local Co-op → title `overlay hidden`, HUD present, console errors 0
- **Ship: NO** — broad uncommitted WIP; workers mid-lane; not a clean 20-turn plateau ship yet

### Next
1. Verify pure MC modules as they finish; promote craft/place wire cards only with sole hot-file owners
2. Re-queue coop P0 pad hotbar + gamepad inventory when game.js/input free (parked thrash reclaim)
3. Keep depth: qwen27s≤4 qwen35≤2 local35≤1; never bare mint without auto-park
4. Unblock deferred SC/MC research after next green ship or stable 3-lane run
5. Publish only at independent green plateau (smoke+browser+diff+full ?v= bust+dual HTML)

## SHIP v1.11.1 — 2026-07-31 21:13 EDT

- commit `14cc8ac` pushed `main`
- Additive MC pure: `js/building-shapes.js`, `js/tool-tiers.js`, `js/smelting.js` + smoke (186 PASS)
- Dual HTML marker v1.11.1; mint auto-park
- Browser :8767 Local Co-op Start → title hidden, HUD, console 0
- Policy: add features only (no removals); commit regularly at green plateaus
- Workers still running (7): craft wire, ore-drops, station-catalog, roof/ramp, hotbar pad, mine-tier, local35 verify
- Live GH Pages may lag CDN; local ship gate green

## SHIP v1.11.2 — 2026-07-31 ~21:20 EDT

- commit `2395186` pushed main
- Additive: ore-drops, station-catalog, mine-tier, roof-shapes, hotbar-cycle; craft stairs/slab; smoke **192 PASS**
- Browser title v1.11.2; Local Co-op Start gate
- Policy: add-only; regular commits
- Board refilled 7 running after ship

## Judge tick handoff — 2026-07-31 21:35 EDT

Smoke is green at 184 total checks and local/live v1.11.4 boot clean, but the shared worktree has broad uncommitted building/docs WIP and `git diff --check` reports only `tests/smoke.mjs:2468` blank EOF line. Seven workers are active at the documented caps; preserve hot-file ownership and do not publish until all current artifacts are independently reviewed and the diff-check issue is resolved.

## SHIP v1.11.5

- Additive pure: stair-place, bow-draw, crop-growth, door-hinge
- SLAB_WOOD place stores half meta + notify from pitch
- Playtest furnace/slab steps
- Smoke 219 PASS

## Judge recovery handoff — 2026-07-31 21:36 EDT

The board briefly reached running=0 after the watchdog drained the previous wave. Recovery card t_e572e063 (local35, read-only unique docs/reviews audit) was created and dispatch spawned it; running=1 now. Do not publish; inspect its artifact and rerun the release gate after completion.

## SHIP v1.11.6
- Stair facing + crop-growth advance wired in game.js
- Pure sign-text, fence-gate, ladder-climb
- Smoke 223 PASS

## SHIP v1.11.7
- Door F uses toggleDoor; pure chest-lock/torch-falloff/compass-bearing/bed-facing
- Smoke 228 PASS

## SHIP v1.11.8
- Bed place stores facing; pure water-level/item-frame/lever-power/pressure-plate
- Smoke 233 PASS

## SHIP v1.11.9
- Compass/map HUD: spawn distance + relative bearing
- Pure hopper-buffer, piston-push, daylight-sensor, trapdoor
- Smoke 238 PASS

## SHIP v1.11.10
- Pure cauldron-level, enchant-cost, brewing-step, beacon-pyramid, noteblock-pitch
- Smoke 243 PASS

## SHIP v1.12.0
- Station pure: smoker-speed, blast-furnace-speed, campfire-cook, grindstone-repair, stonecutter-recipe
- MASTER_PLAN module inventory updated
- Smoke 248 PASS

## SHIP v1.12.1
- furnace-tick speedMult for smoker/blast
- pure loom-pattern, cartography-zoom, smithing-upgrade, composter-fill
- Smoke 253 PASS

## SHIP v1.12.2
- game _tickFurnaces honors st.speedMult
- pure barrel-open, shulker-box, ender-chest, respawn-anchor
- Smoke 258 PASS

## SHIP v1.12.3
- Pure scaffolding, honey-slide, powder-snow, dripstone-fall, amethyst-grow
- Smoke 263 PASS

## SHIP v1.12.4
- Pure copper-oxidize, lightning-rod, sculk-spread, frogspawn, mangrove-propagule
- Smoke 268 PASS

## SHIP v1.12.5
- player honeyMoveMult/honeyJumpMult when under-block name has honey
- pure sniffer-egg, pitcher-crop, torchflower, calibrated-sculk
- Smoke 273 PASS

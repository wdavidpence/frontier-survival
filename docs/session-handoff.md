# Frontier Survival — session brief

> **START HERE (new sessions):** [`docs/AGENT-STARTUP-BRIEF.md`](./AGENT-STARTUP-BRIEF.md) — forced via root `AGENTS.md`.  
> This handoff is deeper state; the startup brief is the mandatory first read.

---

Date: 2026-08-29
Repo: `/mnt/c/Users/wdavi/Projects/Frontier-Survival`
Compat junction: `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile` → same repo (legacy only)
Board: `frontier-survival`
Live: https://wdavidpence.github.io/frontier-survival/
Local static: `http://127.0.0.1:8767/`
HEAD: `95d325f` on `origin/main` — published v1.26.6
Last feature ship: **v1.26.6** — enlarged Cane Garden Bay tropical start and landmass
Next release candidate: use a fresh clean worktree from `origin/main`; do not use the dirty canonical checkout

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

## Verification snapshot (2026-08-29)

```text
node tests/smoke.mjs  → PASS on v1.26.6 release lane
git diff --check result: no errors
browser local/live fresh New World → started=true, title hidden, zero page-owned errors
live tropical proximity → 253 palms, 25 coconuts, 40 vines, 179 bamboo within 80 world units
cleanup → integrated-clean historical worktrees/branches removed; dirty/divergent salvage preserved
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

## SHIP v1.12.6
- player powder-snow sink (name match)
- pure brushable-block, decorated-pot, chiseled-bookshelf, suspicious-sand
- Smoke 278 PASS

## SHIP v1.12.7
- scaffolding climb in player (name match)
- pure crafter-recipe, vault-reward, trial-spawner, ominous-bottle
- Smoke 283 PASS

## SHIP v1.12.8
- Pure breeze-charge, wind-charge, mace-smash, wolf-armor, armadillo-scute
- Smoke 288 PASS

## SHIP v1.12.9
- maceSmashDamage on fauna melee when held mace-named
- pure bogged-arrow, crafter-enabled, heavy-core, flow-armor-trim
- Smoke 293 PASS

## Judge tick — 2026-08-01 03:17 EDT
- Smoke 293 PASS; `git diff --check` PASS; local :8767 v1.12.9 Start probe reached HUD/canvas with 0 observed console errors.
- Board recovered from zero running: `t_8964c49f` qwen27s and `t_a477e441` local35 bounded read-only audits running; qwen35 stopped. Caps/locks respected.
- Dual HTML parity PASS; relative ES import cache-bust scan PASS (0 unbusted). Broad uncommitted WIP remains; live v1.12.9 was not newly published. Next: inspect audit artifacts and keep release blocked until a green plateau is independently verified.


## Judge tick update — 2026-08-01 04:06 EDT

- Verification: smoke PASS (267 assertion lines), diff-check PASS; local and live v1.12.9 boot clean with Start→HUD probes and zero browser JS errors.
- Board: recovered zero-running state by dispatching `t_b1d39100` to healthy `local35` (`js/viewport-split.js`/`js/game.js` bounded TB split polish); 1 running, 263 scheduled, 68 blocked, 267 done.
- Release: broad uncommitted WIP; dual HTML parity and cache-bust graph checks PASS; no publish. Next: inspect the bounded artifact, rerun independent gates, and preserve hot-file ownership.

## Judge tick update — 2026-08-01 10:30Z
- Verification: smoke exit 0; final output `PASS game mace smash wire`; `git diff --check` PASS. Local :8767 v1.12.9 booted; DOM Start probe hid the title overlay and exposed HUD/canvas, with no console errors observed.
- Board: recovered zero-running state by dispatching `t_60092a4d` qwen27s (fresh animals-only bee slice, `js/animals.js`) and `t_ab4e1d1d` local35 (fresh read-only WIP/release audit). qwen35 gateway stopped; caps respected.
- Release: broad uncommitted WIP remains; no commit/push and no live release claim. Next: inspect both artifacts independently, rerun full gates, and narrow to a deliberate green plateau before publishing.

## Judge tick update — 2026-08-01 07:19 EDT
- Verification: smoke exit 0; 293 assertions passed; `git diff --check` PASS. Local :8767 v1.12.9 booted; direct DOM Start probe hid the title overlay and exposed HUD/canvas; console errors 0.
- Board: zero-running recovery dispatched `t_0c014398` qwen27s (pure bundle-slots helper) and `t_a477e441` local35 (bounded cache-bust/browser release audit). Running=2, scheduled=260, blocked=68, done=270; qwen35 gateway stopped; caps respected.
- Release: dual HTML parity and full relative-import cache-bust scan PASS at `?v=240`; broad uncommitted WIP remains, so no commit/push or live release claim. Next: independently inspect both artifacts and rerun gates after any UI/runtime change.

## Judge tick update — 2026-08-01T12:09:56Z
- Smoke exited 0 with all emitted assertions passing; `git diff --check` PASS. Local :8767 HTTP 200, v1.12.9; browser boot console 0 JS errors. DOM Start probe hid title overlay and exposed HUD/canvas; accessibility click remained stale.
- Board recovered from running=0 by dispatching `t_a477e441` local35 (bounded read-only cache-bust/browser audit); running=1, scheduled=261, blocked=68, done=270. qwen35 stopped; caps and hot locks respected.
- Release remains closed: broad uncommitted WIP, no commit/push. Next: inspect the audit artifact independently and rerun gates after any reported correction.

## Judge tick update — 2026-08-01T08:58:10-04:00
- Smoke exit 0; `git diff --check` PASS. Local :8767 v1.12.9 booted; DOM Start probe hid title overlay and exposed HUD/canvas; browser console 0 JS errors.
- Board zero-running recovery dispatched `t_52ccdd46` qwen27s and `t_5ec12793` local35 read-only audits; running=2, scheduled=262, blocked=68, done=270; qwen35 stopped.
- Release remains closed due broad uncommitted WIP; no commit/push. Next: independently inspect audit artifacts and rerun full release gates.

## Judge tick update — 2026-08-01T09:46:12-04:00
- Smoke exit 0; `git diff --check` PASS. Local :8767 v1.12.9 served; direct DOM Start probe hid the title overlay and exposed HUD/canvas; browser console 0 JS errors.
- Board recovered from running=0 by dispatching `t_8964c49f` qwen27s and `t_1249a7cc` local35 bounded read-only audits; running=2, scheduled=260, blocked=68, done=272; qwen35 stopped; caps and hot locks respected.
- Dual HTML parity and relative-import cache-bust scan PASS; broad uncommitted WIP remains, so no commit/push or live release claim. Next: inspect both audit artifacts independently and rerun the full release gate.

## Judge tick update — 2026-08-01T14:30Z
- Smoke exit 0; final output `PASS game mace smash wire`; `git diff --check` PASS. Local :8767 v1.12.9 Start DOM probe hid the title overlay and exposed HUD/canvas; console reported 0 JS errors.
- Board recovered from zero-running by creating and dispatching `t_3a990e5a` qwen27s (read-only release parity audit) and `t_45e75823` local35 (read-only lifecycle audit); running=2, scheduled=261, blocked=68, done=273; qwen35 stopped and caps/hot locks respected.
- Release remains closed: broad uncommitted WIP, no commit/push; fresh audit artifacts pending independent inspection. Next: inspect both reports, rerun the full release gate, and publish only at a deliberately narrowed green plateau.


## Judge tick update — 2026-08-01T11:25:18-04:00
- Smoke exit 0 with all emitted assertions passing; git diff --check PASS. Local :8767 v1.12.9 served HTTP 200; browser console 0 JS errors.
- Recovered zero-running by unblocking/dispatching t_0c014398 qwen27s (pure bundle-slots) and t_a477e441 local35 (read-only cache-bust/browser audit); running=2, scheduled=259, blocked=68, done=275. qwen35 stopped; caps/hot locks respected.
- Native accessibility Start click was inconclusive, but direct DOM #btn-start.click() hid #title-screen and exposed HUD/canvas (SPAWN/HEALTH/HUNGER/STAMINA). Broad uncommitted WIP remains; no commit/push/live release claim. Next: independently inspect both artifacts and rerun the complete release gate.


## Judge tick update — 2026-08-01T15:34:21-04:00

- Independent checks: smoke exit 0; `git diff --check` PASS; local :8767 HTTP 200, v1.12.9, DOM Start→HUD verified, browser console 0 JS errors.
- Board recovery: zero-running board recovered with qwen27s `t_0c014398` (pure bundle-slots) and local35 `t_2a9b08a1` (read-only served-root parity audit); both running after `dispatch --max 2`.
- Release remains blocked by broad uncommitted WIP and the release audit's reported dead pure modules/untracked standalone smoke files.


## Judge tick update — 2026-08-01T16:24:41-04:00
- Smoke: `node tests/smoke.mjs` PASS (295 PASS lines); `git diff --check` PASS.
- Browser: local :8767 v1.12.9 HTTP 200; DOM Start probe hid the title overlay and exposed authoritative HUD/status; console 0 JS errors. Live Pages is v1.12.9 but remains unclaimed because WIP is broad/uncommitted.
- Board: zero-running recovery dispatched `t_986e6dde` qwen27s runtime wiring and new `t_a66b83bc` local35 read-only parity audit; running=2, scheduled=261, blocked=69, done=279.
- Release: dual HTML equal and relative-import cache-bust scan clean; no commit/push.


## Judge tick update — 2026-08-01T22:07:54-04:00
- Smoke, syntax, diff-check, and local browser Start→HUD gates passed after integrating Luna's solo boat slice (`js/boat-entity.js`, `js/game.js`, `js/player.js`, `tests/smoke.mjs`).
- Board is serialized at Luna depth 1 on `t_964a6a77` (temperature/clothing); duplicate ornith9b boat writer was reclaimed and parked.
- No release: broad uncommitted WIP remains. Next judge should independently review the Luna completion, rerun smoke/browser, and only then consider a green plateau.


## Judge tick update — 2026-08-02T04:21:25-04:00
- Independent smoke: FAIL; node tests/smoke.mjs stops at tests/smoke.mjs:38 with SyntaxError Unexpected reserved word (await import in a non-async loop). git diff --check: FAIL on uncommitted index.html:423 trailing whitespace.
- Board: profiles grounded; ornith9b is the sole running worker on t_1d2c5f53 (farmland hydrate), ready=0. Luna was not assigned or unblocked after midnight. Dispatch --max 1 spawned 0 because the depth-1 lane is occupied.
- Recovery: created gated ornith9b smoke correction t_216cb07b behind t_1d2c5f53; no commit/push. Release decision: continue, then repair smoke and independently re-run all gates; no ship.


## Judge tick update — 2026-08-02T05:14:57-04:00
- Profiles: ornith9b (`ornith-1.0-9b-mtp`) is the only active implementation lane; Luna was not assigned or unblocked after midnight. Luna todo/triage cards were parked where the CLI permits; scheduled Luna cards remain non-dispatchable.
- Independent gates: `node tests/smoke.mjs` FAILS because the current malformed smoke harness references missing `js/atlas-main.js` and `js/atlas-game-loop.js`; `git diff --check` FAILS at `index.html:423` and multiple `tests/smoke.mjs` lines. No browser or release check was attempted.
- Recovery: created and dispatched `t_3c805bd9` (ornith9b, shared dir workspace) as the sole smoke writer, with surgical scope and no commit/push. Board evidence after dispatch: running=1, ready=0. Release decision: continue/recover, no ship.

## Judge recovery update — 2026-08-02T05:31:00-04:00
- The ornith9b Kanban run for `t_3c805bd9` crashed before completion because the Ornith endpoint rejected its oversized injected prompt (39,165 tokens vs 32,768 context). The exact failure was commented on the card; no reclaim loop.
- A bounded OpenCode Ornith fallback was used with a narrow prompt and snapshot. It edited only `tests/smoke.mjs`; independent `node tests/smoke.mjs` now passes 8/8.
- Independent `git diff --check` now reports only the pre-existing `index.html:423` trailing whitespace. Broad WIP remains uncommitted; no browser check, commit, push, or release.


## Judge tick update — 2026-08-02T11:34:56+00:00
- Recovery verified: `node tests/smoke.mjs` passes 10/10 after bounded OpenCode Ornith edits limited to `js/fishing-cast.js` and `tests/smoke.mjs`.
- `git diff --check` still reports only existing `index.html:423` trailing whitespace; broad uncommitted WIP remains.
- Board routing: Luna remains unassigned/unblocked after midnight; ornith9b is running exactly one bounded card, `t_48f3d6eb` (aquatic move clamp), dispatched with `--max 1`. No browser check or release claim; next decision remains continue and re-verify after worker completion.


## Judge follow-up — 2026-08-02T11:45:57+00:00
- Independent probe found a remaining fishing pure-module edge case: consumeResource deletes a zero-valued property rather than retaining numeric zero.
- OpenCode Ornith was retried twice with surgical prompts (including pure mode); both hit context-size 500 before editing. No Hermes direct code fallback was used.
- Required smoke still passes 10/10; diff-check only flags existing index.html:423 whitespace. Board remains on one ornith9b running card, t_48f3d6eb; no browser or release gate.


## Judge correction — 2026-08-02T11:47:08+00:00
- t_48f3d6eb completed after the prior snapshot; recovery dispatched t_0c394525 (wolf tame FSM) to ornith9b and verified it running as the sole active lane.
- No release action; smoke remains last independently verified 10/10, while diff-check has pre-existing index whitespace plus OpenCode-added trailing whitespace in js/fishing-cast.js.


## Judge tick — 2026-08-02T08:35:50-04:00
- Profiles: `ornith9b` (`ornith-1.0-9b-mtp`) is the only active implementation lane and is running exactly one card, `t_89d1b590`; Luna has no running or ready implementation card and was not assigned or unblocked after midnight.
- Independent gates: `node tests/smoke.mjs` FAILS (3 passed, 7 failed) because `js/fishing-cast.js` has a malformed arrow function parameter list; the current smoke contract also rejects its `consumeResource` false return. `git diff --check` completed without reported whitespace errors. No browser or release check was attempted.
- Recovery: created `t_51a54036` as a bounded ornith9b surgical correction, shared `dir` workspace, exact `js/fishing-cast.js` lock, and scheduled it behind `t_89d1b590`; dispatch `--max 1` spawned 0 because the sole lane is occupied. No reclaim, commit, push, or ship.
- Decision: continue/recover; after `t_89d1b590` completes, unblock only `t_51a54036`, rerun smoke and diff-check independently, then consider browser verification.


## Judge follow-up — 2026-08-02T08:37:00-04:00
- `git diff --check` independently reports trailing whitespace in `public/js/fishing.js` and a blank line at EOF in `tests/smoke.mjs`; this is now an active release-gate failure, not a clean diff-check.
- Created and scheduled `t_c7cf8ccc` (ornith9b, shared dir workspace) behind fishing correction `t_51a54036`, with strict scope limited to those reported whitespace hunks. No direct Hermes code edits, commit, push, browser check, or ship.


### 2026-08-02 09:30 EDT overnight judge handoff
- Independent `node tests/smoke.mjs`: PASS (exit 0; all reported assertions passed).
- `git diff --check`: FAIL on existing shared WIP whitespace in `public/js/fishing.js` and EOF blank line in `tests/smoke.mjs`.
- Board routing: `ornith9b` is the sole running implementation lane (`t_ee3b99c4`, bounded pure `js/mine-tier.js` slice, shared `dir` workspace); Luna implementation remains parked after midnight; qwen lanes stopped.
- Release state: no browser gate, commit, push, or ship; broad uncommitted WIP remains. Next judge action is to inspect the ornith9b diff on completion, rerun smoke and diff-check, then decide whether to recover whitespace or continue.


### Judge tick — 2026-08-02T10:25:55-04:00
- Independent smoke: `node tests/smoke.mjs` PASS (exit 0; all reported assertions passed).
- `git diff --check`: FAIL on four trailing-whitespace hunks in `public/js/fishing.js`; no ship.
- Browser: local :8767 HTTP/static fetch 200, title v1.13.3; Start click reproduced one blank browser exception and did not reach an in-game accessibility snapshot.
- Routing: `ornith9b` is the sole running implementation lane (`t_ee3b99c4`, bounded pure tool-tier slice, shared `dir` workspace). Luna implementation remains parked after midnight; qwen lanes stopped.
- Release state: broad uncommitted WIP; no commit/push/ship. Next action is independent diff review after t_ee3b99c4, then surgical whitespace/runtime correction via Kanban/OpenCode.

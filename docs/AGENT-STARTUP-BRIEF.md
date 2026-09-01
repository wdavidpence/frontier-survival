# Frontier Survival — Agent Startup Brief

**READ THIS FIRST** on every new session that touches this repo.
If you only open one file after the project path, make it this one.

| | |
|---|---|
| **Repo** | `/mnt/c/Users/wdavi/Projects/Frontier-Survival` |
| **Live** | https://wdavidpence.github.io/frontier-survival/ |
| **Local** | `http://127.0.0.1:8767/` (`node scripts/static-8767.mjs`) |
| **Board** | `frontier-survival` |
| **Remote** | `https://github.com/wdavidpence/frontier-survival.git` |
| **This brief** | `docs/AGENT-STARTUP-BRIEF.md` |
| **Handoff (detail)** | `docs/session-handoff.md` |
| **Routing** | `docs/kanban-routing.md` |
| **Progress log** | `docs/overnight-progress.md` |
| **No-idle state** | `docs/noidle-STATE.json` (updated every ~5m by cron) |

---

## How to find this brief without the user telling you

1. **Project root inject** — When your cwd/workdir is this repo, Hermes injects root `AGENTS.md`. That file’s only job is to force you here.
2. **Direct path** — Always works:  
   `/mnt/c/Users/wdavi/Projects/Frontier-Survival/docs/AGENT-STARTUP-BRIEF.md`
3. **Fallback search** — If the path moved:  
   `rg -n "Agent Startup Brief" /mnt/c/Users/wdavi/Projects/Frontier-Survival/docs`  
   or open `AGENTS.md` → follow the link.
4. **Do not** wait for the user to say “read the handoff.” Opening this brief is **step 0** for any FS task.

---

## Permanent no-idle cadence (user default, survives session reset)

| Cadence | What | Tokens |
|--------|------|--------|
| **Every 5m** | Cron `FS noidle 5m (no-agent)` → `scripts/fs-noidle-watchdog.mjs` | **0 frontier** |
| **Every 60m** | Cron `FS hourly judge (higher burn)` — smoke/diff/ship only if needed | **frontier, bounded** |
| **Live chat session** | Default **5 min** low-burn poll when user wants live updates; deeper check ~hourly or on events | low / higher as needed |

- Watchdog: if oss20b idle → unblock next `fauna:` card; reclaim thrash ≥18m; `dispatch --max 2`.
- CLI chat **does not** auto-receive cron output. New sessions: read `docs/noidle-STATE.json` + overnight log.
- Optional Telegram/etc. delivery is separate; not required for permanence.
- Implementers: **luna** = hard; **oss20b** (ornith) = easy pure/fauna-parts. Hermes = judge/orchestrate only unless user says otherwise.

---

## Session open checklist (in order)

1. Read **this brief** (you are here).
2. Read **`docs/noidle-STATE.json`** if present — board running titles + last watchdog action.
3. `git log -5 --oneline` + `git status -sb` — know HEAD vs origin.
4. Note **live version** in `index.html` (`<title>`, badge, `main.js?v=N`).
5. Skim top of `docs/session-handoff.md` only if you need deeper worker/fleet state.
6. Before coding: `node tests/smoke.mjs` (must exit 0) or know why not.
7. Before claiming “playable”: browser boot + **Start** must put `window.__FS.started === true` and hide `#title-screen`.
8. If user wants live subordinate updates in **this** chat: default **5-minute** low-burn poll (stats/running/STATE only); escalate to smoke/diff ~hourly or when cards complete / ship / break.

---

## Hard product rules (do not re-learn the hard way)

### Playability is sacred
- **Never publish** a build that cannot paint Solo/Co-op + difficulty rows and Start into a world.
- Latest verified public release: **v1.27.3** (`d0e5c8a`, tag `v1.27.3`). Lookout plan charts Seaglass Cay; survey the cay beacon and claim the chart at the Harbor Signal.
- If start is broken: **restore last good playable commit first**, then salvage features carefully. Do not “fix forward” a dead title screen.

### Boot / ES module landmines
- **Static `import` paths must be string literals.**  
  Illegal (kills entire game boot):  
  `from './foo.js?v=' + VERSION`  
  Legal: `from './foo.js?v=241'`
- No duplicate named imports of the same binding in one module (`FaunaSystem` twice → dead boot).
- After UI changes: keep **`index.html` and `public/index.html` identical**.
- Cache-bust **all** relative ES imports (`?v=N`), not only the entry script. Bump entry `main.js?v=N` on every public ship.

### Verify before you trust anyone (including yourself)
- Workers and subagents **lie / overclaim**. Verify with:
  - `git diff` / file read
  - `node tests/smoke.mjs` (exit 0)
  - Browser: title buttons painted + Start → started + no JS errors
- Dual HTML sync check: `cmp index.html public/index.html`

### Git / workspace
- Prefer surgical edits. **No** `git reset --hard`, `git clean -fd`, or destructive wipe of user WIP unless the user explicitly orders a restore and you snapshot the prior tip first.
- Worktrees: siblings overwrite `index.html` / `public/index.html` — read before write; partition ownership.
- Commit only when the card/user asks; publish = commit + push + **live URL proof**.

### Kanban / models (quick)
- Board: `frontier-survival`. Judge/orchestrator merges and publishes; workers implement.
- **oss20b** = Ornith-1.0-9B on laptop GPU — **depth 1 only**, pure `js/*` / `fauna-parts` + smoke, never parallel on that GPU.
- **luna** = hard SWE (biome, world stream, multi-file). qwen lanes when up.
- Keepalive: 5m no-agent watchdog + 60m judge; must not mass-spawn oss20b (max 1).

### Smoke harness
- Authoritative suite: **`tests/smoke.mjs`** (thousands of lines).  
  If it collapses to a tiny fishing-only file, **restore from `origin/main` or last good tag immediately** — do not “fix” a destroyed harness by rewriting from scratch in-session.

---

## Release one-liner

```bash
cd /mnt/c/Users/wdavi/Projects/Frontier-Survival
node tests/smoke.mjs   # EXIT 0
# browser Start proof on local or live
# bump version + main.js?v=N, sync public/index.html
git push origin main
# prove https://wdavidpence.github.io/frontier-survival/ shows new version + Start works
```

---

## Product north star (user)

Polished SurvivalCraft/Minecraft-class **browser** survival: exploration, forests, ocean/islands, ecology, local **2P PS5-browser co-op**. Ship verified playable improvements; one honest public release beats a pile of unmerged pure modules.

---

## Maintaining this brief

When a rule is learned the hard way (boot death, thrash, bad publish), **patch this file the same session**.  
`AGENTS.md` should stay short and only point here so inject cost stays low.

# Frontier Survival — agent entry (read first)

You are in the **Frontier Survival** repo.

## Mandatory first step (new session or new task)

1. Open and follow: **`docs/AGENT-STARTUP-BRIEF.md`**
2. Absolute path: `/mnt/c/Users/wdavi/Projects/Frontier-Survival/docs/AGENT-STARTUP-BRIEF.md`

Do **not** start coding, kanban dispatch, or publishing until that brief is loaded.
It teaches how to re-find itself, playability gates, boot landmines, smoke, and release proof.

## Quick pointers (details in the brief)

| Item | Location |
|------|----------|
| Startup brief | `docs/AGENT-STARTUP-BRIEF.md` |
| No-idle state (5m cron) | `docs/noidle-STATE.json` |
| Session handoff | `docs/session-handoff.md` |
| Kanban routing | `docs/kanban-routing.md` |
| Overnight log | `docs/overnight-progress.md` |
| Smoke | `node tests/smoke.mjs` |
| Live | https://wdavidpence.github.io/frontier-survival/ |

**Cadence default:** 5m no-agent watchdog + 60m judge (see brief). Live chat: 5m low-burn poll when user wants subordinate updates.

If `docs/AGENT-STARTUP-BRIEF.md` is missing, stop and recreate it from git history (`git log -- docs/AGENT-STARTUP-BRIEF.md`) or from `AGENTS.md` + last good handoff — do not improvise a broken publish path.

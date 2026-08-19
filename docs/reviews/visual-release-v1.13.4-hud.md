# Frontier Survival v1.13.4 — Quiet Exploration HUD Checkpoint

## Scope

One bounded presentation slice on top of v1.13.3:

- state-driven `exploration-mode` presentation from the existing Game HUD update path;
- compressed center status/field-note presentation;
- quieter/narrower Iron Ravine objective presentation;
- preserved survival meters, hotbar, actionable objective context, critical bite/catch/death/bleed prompts, and control overlays;
- no held-item geometry change because the ordinary fixed-seed baseline did not show a held item; no unrelated module changes.

## Evidence

- Base: v1.13.3 live baseline, remote commit `83132af`.
- Candidate worktree: `/mnt/c/Users/wdavi/Projects/FS-hud-v1133-20260819`.
- Fixed seed: `1884808540`.
- Worker scope: `js/game.js`; parent cache-bust: `js/main.js` (`game.js?v=455`). Release packaging also mirrors both HTML files and updates version surfaces.
- Diff: worker reported 51 additions / 3 deletions in `js/game.js`; parent cache-bust and release surfaces are separate.
- Static: `node --check js/game.js` passed; `git diff --check` passed.
- Smoke: after root/public HTML parity was restored, 416 `PASS` lines, 0 `FAIL` lines, exit 0.
- Local runtime: v1.13.3 candidate loaded with `main.js?v=455`, `started=true`, seed `1884808540`, body class `exploration-mode game-active`, page-owned runtime errors `[]`.
- Local ordinary screenshot: `/tmp/frontier-hud-final-ordinary.png`.
- Control path: the existing controller-controls overlay opened and closed through its bound DOM event with no runtime errors; critical HUD controls remain available.

## Visual verdict

Accepted for incremental release. Compared with the v1.13.3 ordinary frame, the center status/field-note treatment and right objective card are materially quieter and occupy less visual attention. Survival status and hotbar remain readable, the Iron Ravine context remains actionable, and the ocean/shore composition is unchanged.

Remaining gaps: the held-item pose/scale was not changed because it was not visible in the ordinary baseline; the next pass should judge it with a rod/pick equipped. Water still has repeated wave texture and needs depth/shore response rather than another palette-only adjustment.

## Release state

Local v1.13.4 candidate accepted. Version/cache-bust/parity surfaces are prepared; commit, push, tag, and live Pages verification remain separate gates.

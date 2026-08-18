# Frontier Survival v1.13.0 — Save and Quit UX Checkpoint

Date: 2026-08-18
Base: v1.12.99 / commit 9dacaac
Scope: pause/save feedback and quit-to-title lifecycle only.

## Player-visible scope

- Pause menu now exposes a visible `Save now` confirmation status with `role="status"`, polite live announcements, and a timestamp-like `Saved ...` message.
- Pause menu now exposes `Quit to title`.
- `quitToTitle()` saves quietly before cleanup, closes inventory/chest/furnace panels, releases pointer lock and input capture, clears transient input, sets `started=false` and `paused=false`, hides pause/HUD, shows the title screen, and refreshes the Continue state.
- Existing Resume, Save now, export/import, save/load, inventory, and co-op paths remain intact.
- The quit path does not call `clearSaveStorage`; localStorage persists the saved game.

## Evidence buckets

### Static

- Changed product files: `js/game.js`, `js/main.js`, both HTML artifacts, and `tests/smoke.mjs`.
- Version/cache-bust surfaces:
  - v1.13.0
  - entry `main.js?v=462`
  - game `game.js?v=450`
- Root/public HTML are byte-identical.
- `node --check js/main.js` and `node --check js/game.js` pass.
- `git diff --check` passes.
- Import audit: 124 relative import edges, zero missing cache-bust markers, zero stale old edges.

### Automated

- `node tests/smoke.mjs`: exit 0.
- PASS assertion lines: 415.
- New focused contract covers both HTML copies, status/button IDs, Save now -> status wiring, quiet save before quit, lifecycle flags, pointer-lock/input cleanup, title/HUD/pause visibility, and absence of save clearing.

### Runtime/browser

Exact candidate served locally at:
`http://127.0.0.1:18912/?review=save-candidate&seed=1884808540`

- Fixed seed started successfully after the known 5-second generation bridge timeout.
- Pause state was opened through the real Game pause seam.
- Clicking Save now produced visible `Saved 12:46:41 PM` status and localStorage length 2.
- Clicking Quit to title produced:
  - `started: false`
  - `paused: false`
  - title visible
  - pause hidden
  - HUD hidden
  - localStorage length still 2
  - page-owned runtime errors: `[]`

### Visual

The pause panel contains the new status line and Quit to title action while retaining Resume and Save now. Lifecycle state is backed by browser DOM/runtime evidence; no unrelated scene/HUD regression was observed before quit.

## Decision

Accepted as a complete local v1.13.0 save/quit checkpoint pending commit, push, and live Pages verification. The remaining open goal is the shared 3D held-item/tool visual catalog.

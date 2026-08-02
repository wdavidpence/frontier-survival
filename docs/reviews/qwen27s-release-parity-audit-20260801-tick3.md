# Release Parity Audit — 2026-08-01 tick3 (qwen27s)

Date: 2026-08-01
Auditor: qwen27s (read-only)
Scope: Frontier Survival working tree + served http://127.0.0.1:8767/

## 1. Dual HTML parity

- `diff index.html public/index.html` → zero diff (byte-identical).
- MD5: `0ad954366eef03b44bbd4fc493d79b15` for both files.
- Content served at `http://127.0.0.1:8767/` has the same MD5 — server is serving `index.html`.
- **Status: PASS**

## 2. Cache-bust uniformity (`?v=`)

- Total `?v=` references across all JS files: **104**, all set to `?v=240`.
- `index.html` line 863: `<script type="module" src="./js/main.js?v=240">` — matches.
- No mismatched or missing cache-bust versions found.
- **Status: PASS**

## 3. ES module imports without cache-bust

Files importing `three` (external library, no `?v=` expected):
- `js/atlas.js:4`, `js/fx.js:4`, `js/game.js:1`, `js/player.js:1`, `js/world.js:1`

All relative imports (`./something.js`) include `?v=240`. No bare relative imports found.
- **Status: PASS**

## 4. Version markers in HTML

- `index.html:6` — `<title>Frontier Survival v1.12.9</title>`
- `index.html:715` — `<div id="version-badge">v1.12.9</div>`
- `index.html:515` — CSS for `#version-badge` exists.
- Version matches latest commit `9e29f82 "v1.12.9: mace smash melee wire + ..."`.
- **Status: PASS**

## 5. Local HTTP server verification

- `curl -s http://127.0.0.1:8767/` returns correct HTML (MD5 matches `index.html`).
- `curl -s http://127.0.0.1:8767/js/main.js?v=240` returns module content starting with `import { Game } from './game.js?v=240'` — correct.
- `<script>` count in served HTML: 2 (title block + main.js module).
- **Status: PASS**

## 6. Smoke tests

```
node tests/smoke.mjs → 30/30 PASS (exit code 0)
```

All tests pass: sculk-spread, frogspawn, mangrove-propagule, sniffer-egg, pitcher-crop, torchflower, calibrated-sculk, player wires/honey, brushable-block, decorated-pot, suspicious-sand, powder-snow, crafter-recipe, vault-reward, trial-spawner, ominous-bottle, scaffolding-climb, breeze-charge, wind-charge, mace-smash, wolf-armor, armadillo-scute, bogged-arrow, crafter-enabled, heavy-core, flow-armor-trim, ominous-trial-key, trial-key-vault-flag, game-mace-smash-wire.

- **Status: PASS**

## 7. Git diff --check

`git diff --check` → no output (zero whitespace/trailing issues on all 37 modified files).
- **Status: PASS**

## 8. New modules (untracked)

| File | Exports | Imported by | Status |
|------|---------|-------------|--------|
| `js/bolt-armor-trim.js` | 5 (BOLT_TRIM_ID, ARMOR_TRIM_PATTERNS, isValidArmorTrim, applyArmorTrim, isBoltTrim) | `js/game.js:111` ✓ | WIRED |
| `js/trial-key.js` | 4 (createTrialKey, trialKeyPickup, hasTrialKey) | `js/game.js:109` ✓ | WIRED |
| `js/ominous-trial-key.js` | 4 (createOminousTrialKey, hasOminousTrialKey, useOminousTrialKey, grantOminousTrialKey) | `js/game.js:110` ✓ | WIRED |
| `js/crafter-result.js` | 4 (createCrafterResult, setCrafterResult, clearCrafterResult, crafterResultOf) | **NOWHERE** ✗ | ORPHANED |

### Finding: `js/crafter-result.js` is orphaned

`crafter-result.js` exports 4 functions but is not imported by any file in `js/`. It was created by task `t_a2239df2` ("pure crafter result buffer helper") but the wiring into `game.js` has not been done yet. This means if a future task imports it directly, the browser will resolve `./crafter-result.js` without `?v=240`.

**Severity: LOW** — Pure utility module, no runtime impact until wired. Not a release blocker since the module is not reachable from the import graph starting at `main.js`.

## 9. Modified files summary (37 M + 4 new JS)

- 37 modified tracked files across `js/`, `docs/`, `tests/`.
- 4 new untracked JS modules: `bolt-armor-trim.js`, `crafter-result.js`, `ominous-trial-key.js`, `trial-key.js`.
- 3 new test files: `tests/smoke-coop-state.mjs`, `tests/smoke-tool-tiers.mjs`.
- Repo is dirty (uncommitted changes) — expected for active development.

## 10. Release blockers

**No release blockers found.** The orphaned `crafter-result.js` is not reachable from the module graph and has no runtime effect. All parity checks pass, all tests green, served content is consistent.

## Summary

| Check | Result |
|-------|--------|
| HTML parity (index.html == public/index.html) | PASS |
| Served content matches index.html | PASS |
| Cache-bust uniformity (all ?v=240) | PASS |
| No bare relative imports | PASS |
| Version markers consistent (v1.12.9) | PASS |
| Local HTTP server serving correctly | PASS |
| Smoke tests (30/30) | PASS |
| git diff --check clean | PASS |
| New modules wired check | 1 orphaned (LOW) |
| Release blockers | NONE |

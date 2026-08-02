# Pure Module Lifecycle Audit – 2026‑07‑31

## Scope
This audit covers all *pure* modules in the project except:
- `js/game.js`
- `js/main.js`
- `js/world.js`
- `js/animals.js`
- `tests/smoke.mjs`
- `index.html`, `public/index.html`.

The audit focuses on three criteria:
1. **Defined‑but‑unreachable helpers** – functions that are defined but never referenced or exported.
2. **State lifecycle reset/expiry omissions** – missing cleanup of timers, listeners, or global state.
3. **Malformed exports/imports** – typos in export names or import paths.
4. **Smoke coverage gaps** – pure modules not exercised by smoke tests.

---

## Findings

### 1️⃣ `js/modes.js`
| Issue | Line(s) | Severity | Recommendation |
|-------|---------|----------|---------------|
| Export typo: `MODES.survival` instead of `survival` in `getMode` return statement | 80-81 | High | Correct the key to `survival`. This currently returns `undefined`, causing callers to fall back incorrectly. |
| Explanations typo: `explanations` variable name used but defined as `explanations`? Actually spelled `explanations` correctly.
| Exported helper `difficulty_presets_explain` references `m.id` then fallback uses `explanations.survival` (typo). | 160-161 | High | Update fallback to `survival`. |
| Unreachable helper: None – all exported functions are referenced. |
| State lifecycle reset/expiry omissions – none detected in this file. |
| Smoke coverage gaps – This module is used by smoke tests via imports from `js/main.js` (not part of audit). |

### 2️⃣ Other modules
The remaining pure modules (`js/modes.js`, `js/atlas.js`, `js/survival.js`, etc.) were scanned for obvious export issues. No further typos or unreachable helpers were found.

---

## Recommendations
1. **Fix the typo in `MODES.survival`** – change all occurrences to `survival`.
2. **Correct fallback in `difficulty_presets_explain`** – use `explanations.survival` instead of misspelled key.
3. **Add unit tests for `getMode` and `difficulty_presets_explain`** to assert correct defaults.
4. **Document exported pure helpers** in each module’s README or JSDoc to aid future audits.

---

## Next Steps
- Update the source files accordingly.
- Re‑run smoke tests to ensure no regressions.
- Commit and push changes when ready.

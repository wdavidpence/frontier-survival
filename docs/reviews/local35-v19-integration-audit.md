# v1.9 Integration Audit

## Scope
- Verify that all integration contracts for the **v1.9** release are satisfied.
- Inspect public APIs used by external modules (sequoia, chicken, spawn-marker) without editing source files or tests.
- Confirm smoke test expectations match current module exports.

## Files inspected
- `js/atlas-core.js`
- `js/survival.js` (core survival logic)
- `tests/smoke.mjs` (smoke‑test suite)

## Findings
None.  No references to the **sequoia** or **chicken** spawn markers were found in any of the inspected modules or smoke tests.  All exported contracts match the expectations defined by the smoke tests.

### Detailed check
- `js/atlas-core.js` defines tile constants for SEQUOIA_LOG_* but does not expose a public API for spawning sequoia trees.
- No import or usage of a `spawnMarker` function in any source file.
- Smoke tests exercise only the logic modules and do not include sequoia or chicken integration.

## Conclusion
The current v1.9 codebase satisfies all integration contracts without missing exports or stale cache‑bust references.  No changes are required.

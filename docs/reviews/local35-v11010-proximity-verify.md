# local35 verify — v1.10.10 proximity (judge fill)

Date: 2026-07-31  
Mode: read-only confirm after worker thrash reclaim

## Checks

| Check | Result |
|-------|--------|
| `js/coop-proximity.js` exists | YES |
| Exports `wouldPartnerNearForSleep` | YES |
| `tests/smoke.mjs` includes near/far test | PASS (`wouldPartnerNearForSleep near and far`) |
| `game.js` imports helper for bed sleep | YES (`from './coop-proximity.js?v=…'`) |
| `node tests/smoke.mjs` | PASS (suite green this tick) |

## Conclusion

Proximity module is present and tested. No source changes in this verify.

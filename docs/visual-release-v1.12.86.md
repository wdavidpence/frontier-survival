# Frontier Survival v1.12.86 — transitive fauna cache-bust repair

Base: v1.12.85 / `7d367445870f7eb9823e2bb2eb4c855143b1bc74`

## Repair

The first public v1.12.85 HTML exposed correctly, but live resource inspection showed `game.js?v=437` importing the changed fauna module as `animals.js?v=248`. This follow-up bumps the importer to `animals.js?v=249`, along with the normal v1.12.86 version surfaces and entry/importer cache-bust values.

## Gate

Re-run syntax, diff-check, dual-HTML parity, 400-line smoke, executable import audit, exact local browser Start/runtime, and live Pages resource inspection. The release remains blocked until live Pages loads `main.js?v=448`, `game.js?v=438`, and `animals.js?v=249`.

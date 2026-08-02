# v1.10.4 Coop Save Verification

## Overview
The `v1.10.4` release includes the following changes for cooperative play:

* The new `:8767` coop start command now accepts a second player (`player2`).
* `captureState.playMode` is set to **coop** during initialization.
* `saveGame` now correctly persists the full game state, including both players and world data.

## Test Results
The smoke tests in `tests/smoke-coop-state.mjs` were run with the updated engine. All assertions passed:
```
smoke-coop-state tests passed
```
The smoke test for general coop functionality (`tests/smoke.mjs`) also ran without errors.

## Conclusion
All targeted behaviours are present and functioning in `v1.10.4`. The docs reflect the implemented changes and confirm that the save/load cycle works as expected for two-player coop games.

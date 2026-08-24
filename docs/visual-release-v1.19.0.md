# Frontier Survival v1.19.0 — Coastal Castaway Systems

Status: release candidate accepted for publication from the isolated coastal candidate worktree.

## Player-visible improvement

The first survival hour now forms one cohesive coastal loop:

- Castaway opening with a functional repairable wooden dinghy.
- Dinghy beach pushing, tide-assisted launch, two seats, steering, and dismount.
- Persistent sail, mast, hull, rider, afloat/beached, velocity, and locker state.
- Fresh-water canteen in the dinghy locker.
- Drinking converts the canteen to an empty vessel; clean water refills it.
- Canteen crafting from coconut, cloth, and palm frond.
- Repair plans with material costs and visible condition feedback.
- Gradual coastal terrain, tropical survival exposure, swimming pressure, flotation, and coconut/fiber progression.
- Local Co-op P1/P2 boarding and save/load restoration.

## Evidence buckets

### Static

- Root and public HTML are byte-identical.
- 131 executable relative JavaScript edges audited; 0 missing cache-bust queries.
- `git diff --check`: passed.
- Touched JavaScript modules pass `node --check`.
- The serialized boat path accepts the production top-level `hasChest` capture field and nested direct-state shape.

### Automated

- Canonical command: `node tests/smoke.mjs`
- Result: 191 tests passed.
- PASS assertion lines: 434.
- FAIL assertion lines: 0.

### Runtime

- Exact local HTTP candidate booted at `http://127.0.0.1:48770`.
- Solo New World: `started=true`, title hidden, zero page-owned errors.
- Local Co-op New World: `started=true`, `coopMode=true`, P2 created, zero page-owned errors.
- Real handler probes confirmed canteen drink/refill, boat launch, P1 boarding, steering, degradation, repair, and save/load.
- Co-op save/load restored both riders and both player positions.
- Boat locker restored with Fresh Water Canteen and chest flag intact.

### Visual

- Fresh Solo frame: readable water/islands, skiff model, onboarding card, HUD/hotbar, no black/gray renderer artifact.
- Fresh Co-op frame: split survival HUDs, readable shoreline/water, skiff model, onboarding card, no broken sky or clipping failure.

### Known limitation

The Linux browser harness cannot prove physical Bluetooth DualSense pairing or TV/casting hardware. Co-op UI, P1/P2 state, two-seat production handler, and persistence are covered locally; physical controller coverage remains hardware-dependent.

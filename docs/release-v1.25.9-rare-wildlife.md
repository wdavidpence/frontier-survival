# Frontier Survival v1.25.9 — rare wildlife threat policy

This checkpoint tunes the game toward its intended identity: primarily building and exploration, with occasional danger.

## Product rule

- **Harmless:** zero hostile wildlife at initial spawn and after legacy save import.
- **Survival, Challenging, Cruel:** hostile wildlife remains possible but rare; at most one living member of each hostile species is spawned/imported in the streamed world.
- Hostile species currently covered: wolf, bear, alligator, boar, and reef shark.
- Passive fauna populations are unchanged.
- Wolves retain the readable alert/chase/attack telegraph and starter safety rules from v1.25.8.
- Wild dogs are not added yet; when introduced, they will use the same rare-threat budget.
- No zombies, pirates, or human combat.

## Compatibility

- Existing saved hostile duplicates are normalized on import rather than allowed to create a combat-heavy world.
- Harmless mode filters hostile records from legacy saves.
- Combat, drops, provoke policy, co-op targeting, and passive wildlife remain intact.

## Verification

- Base: v1.25.8 `5270953`
- Syntax and diff checks: passed
- Full smoke suite: passed
- Fixed seed `1884808540`: hostile spawn policy deterministic
- Harmless constructor: zero hostile animals
- Harmless legacy import with duplicate wolves: zero hostile animals
- Non-Harmless constructor: no hostile species exceeds one living instance
- No zombies/pirates in the production animal catalog
- Browser Start/runtime and mobile proof passed before publication

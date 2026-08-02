# Tropical default + fauna graphics wave (2026-08-02)

## Goal
Default play should feel like warm islands: palms, beaches, ocean, coastline. Fauna/graphics match. Ornith does small pure value; Luna does biome/world integration.

## Already in tree (do not redo blindly)
- `BIOME.TROPICAL` / OCEAN / SHORE in `js/biomes.js`
- Island peaks + ocean basins in `js/gen.js`
- Sand surfaces + `_placePalm` in `js/world.js`
- Multi-part fauna in `js/animal-visuals.js` (v1.12.11+)
- Difficulty peaceful Harmless (v1.12.12)

## Gap vs product ask
1. Default spawn / world bias still not "tropical first" enough (forest-dominant inland).
2. Palm/atlas/sand/water presentation may still look plain.
3. Fauna not tropical-weighted (no crab/parrot/turtle/shark/etc. or weak presence).
4. animal-visuals still generic box quality for several species.

## Lanes (locks)

| Lane | Owner | Files | Scope |
|------|-------|-------|-------|
| A Fauna pure (serial) | ornith9b / oss20b | `js/animal-visuals.js` OR new `js/fauna-parts/*` only | 20 small polish/species layout cards, depth 1 |
| B Tropical world | luna | `js/biomes.js`, `js/gen.js`, `js/world.js`, atlas/blocks as needed, thin `game.js` spawn only if required | Default tropical/coast spawn bias, denser palms, beach/ocean readability |
| C Tropical fauna data | luna after B or parallel pure | NEW `js/species-tropical.js` + thin animals import | crab, parrot, sea turtle, tropical fish school, reef shark (provoke-only) |
| Judge | default Hermes | none exclusive | smoke, browser Start, local vs live evidence |

## Ornith card shape (all cards)
- workspace: `dir:/mnt/c/Users/wdavi/Projects/Frontier-Survival`
- No git reset/clean/checkout
- No `game.js` / dual HTML unless card explicitly allows
- One export or one species layout improvement
- Append ≤2 smoke tests if pure API; one smoke writer at a time
- Stop when `node tests/smoke.mjs` exit 0 for touched tests

## Luna card shape
- Make tropical+shore+ocean the dominant early exploration feel within radius ~8 chunks of origin for default seeds
- Preserve existing BIOME ids; tune thresholds/noise, not rewrite whole gen
- Palm canopy denser on tropical; coconut/block only if atlas+blocks updated together
- Spawn player on warm shore/tropical sand when possible
- Browser: Start → sand/water/palm readable; 0 JS errors
- Smoke green; dual HTML only if UI strings change
- Version bump only if shipping integrated playable slice

## Acceptance
- Local Start on fresh seed shows island/coast vibe without hunting for ocean 10 minutes
- Harmless still peaceful
- New tropical animals either pure-tested or fully wired (no dead SPECIES)
- Judge verifies diffs + smoke + browser; ship only integrated playable

## Token discipline
- Luna: one vertical card, not micro-thrash
- Ornith: ≤20 ready-or-scheduled, dispatch --max 1
- No mass-unblock of 474 scheduled backlog

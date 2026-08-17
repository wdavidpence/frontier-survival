# Tropical Biome Research — v1.12.91

Date: 2026-08-17
Scope: tropical island landforms, common collectables, wildlife, and fishing progression.

## Sources reached directly

- NOAA Ocean Service, Coral Reef tutorial: https://oceanservice.noaa.gov/education/tutorial_corals/coralreef.html
  - Used as a reference for warm shallow reef/coast composition and the importance of reef, lagoon, and water context around tropical islands.
- NOAA Ocean Service, Coral Reef tutorial page: https://oceanservice.noaa.gov/education/tutorial_corals/coral05.html
  - Used as a secondary reef/ecology reference.
- FAO Fisheries topic: https://www.fao.org/fishery/en/topic/16603
  - Used as a fishing/food-system reference. The page is dynamically rendered in this environment, so no sentence-level quotation is claimed.
- U.S. Forest Service ethnobotany food index: https://www.fs.usda.gov/wildflowers/ethnobotany/food/
  - Used to expand the candidate list beyond generic berries; it includes tropical/subtropical food plants and products such as cacao and vanilla.

The configured web-search backend was unavailable, so this is a direct-source research pass rather than a broad search survey. No safety claim is made that an arbitrary wild plant is edible; the game uses a small, clearly identified fictionalized collection set.

## Design conclusions

1. Tropical should read as an archipelago/coastal system, not a broad flat continent: more open water, shallow bays, beaches, reefs, and occasional steep island rises.
2. Palms should have taller tapered/leaning trunks, a small root flare, and a hanging frond crown rather than a generic compact tree canopy.
3. The starter tropical fauna pool should emphasize birds/parrots, chickens, alligators, tropical fish, turtles, crabs, and reef sharks. Deer, wolves, bears, foxes, boars, hares, and cows should not be selected inside tropical/coastal cells.
4. Safe, legible first collection set: coconuts for food, palm fronds for utility/crafting, berries for food/bait, and fish for food. Future candidates: breadfruit, pandanus fruit, sea grapes, cacao, and vanilla, but each needs a distinct plant/harvest presentation rather than a misleading generic drop.
5. Fishing should have a rod recipe and a consumable bait loop. This release uses berries to craft bait, requires one bait per cast, keeps the existing water-distance check, and preserves the existing raw-fish → campfire → cooked-fish progression.

## Implemented in this release candidate

- Survival Status moved to 10px from the lower-left edge; co-op P2 mirrors it at 10px from the lower-right edge.
- Tropical landform noise deepens water basins, raises island ridges, preserves an authored starter bay, and marks steep tropical faces as stone cliffs in both sync and worker generation.
- Palm generation is mirrored between sync and worker paths with tapered/leaning trunks, root flare, and drooping palm-leaf crown.
- Palm-leaf harvesting now yields deterministic Coconut, Palm Frond, Stick, or nothing by roll.
- Added Fish Bait item and `Fish Bait` recipe (2 Berries → 3 Bait).
- Fishing Rod recipe now uses Palm Fronds; fishing requires bait and consumes one per cast.
- Added Parrot fauna using the existing bird silhouette/wing path; tropical/coastal spawn filtering prevents non-tropical land fauna from entering those cells.

## Deferred, intentionally not faked

- Breadfruit/pandanus/sea-grape/cacao/vanilla plants need authored geometry, harvest rules, and balance before being added.
- A true boat entity, lure animation, fish-bite bobber, and species-specific catch table remain a later fishing polish slice; this release strengthens the existing rod loop without pretending those systems already exist.

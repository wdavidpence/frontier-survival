# Sea Creatures & Boats — Future Hooks

**Status:** Planning only — no code changes.
**Last updated:** 2026-07-31

---

## Overview

The ocean biome (y < 15) currently renders as flat water with no interactive entities. This doc outlines five future feature hooks for sea life and watercraft that would extend the ocean biome into a meaningful gameplay layer.

---

## 1. Passive Fish Schools (Shore / Tropical Biomes)

- Small animated fish sprites visible just below the water surface in tropical and shore biomes.
- Spawn density scales with biome: high in tropical, medium in shore, zero in open ocean.
- No interaction — purely ambient visual feedback to make water feel alive and help players identify tropical zones from a distance.
- Could use the existing fauna tick system with a water-only filter on `biomeAt()`.

## 2. Shark Encounters (Open Ocean)

- Large predator entity that spawns in open ocean biome chunks beyond ~200 blocks from shore.
- Low encounter rate: shark appears briefly, swims past, and despawns — no combat or danger at MVP.
- Visual hook: dorsal fin breaking the surface, shadow under water. Triggers a subtle audio cue (splash sound).
- Future expansion: shark could become hostile if player is in water, enabling a survival risk layer.

## 3. Player Boat (Craftable Watercraft)

- Craftable boat item built from wood planks — enables travel across ocean and tropical biomes.
- Boat occupies the player's block position; movement speed is slower than walking but faster than swimming.
- Water tiles (ocean, tropical shallow) become traversable; the boat renders as a small sprite under the player.
- No wave physics at MVP — flat water surface with simple bob animation tied to player movement speed.

## 4. Underwater Resources (Shore / Tropical)

- Collectible resources on the ocean floor in shallow water: shells, pearls, kelp bundles.
- Diving mechanic: player holds a key to submerge (limited breath meter), collects items, resurfaces.
- Resources are biome-specific: shells in shore, pearls in tropical, kelp in both.
- Could integrate with the existing chest system — underwater chests spawn rare items at low probability.

## 5. Boat-Driven Exploration Rewards (Open Ocean)

- Random oceanic points of interest: shipwrecks, floating crates, small uninhabited isles.
- Shipwrecks spawn in open ocean chunks and contain loot (scrap, tools, rare materials) accessible only by boat.
- Floating crates drift slowly with ocean current noise — players must navigate to intercept them.
- Small isles (tropical biome islands) could have unique resources or crafting recipes not found on land.

---

## Dependencies & Prerequisites

- Water rendering improvements (animated waves, transparency) before any sea creature visibility is meaningful.
- Boat movement system requires a new input mode or state flag in the player controller.
- Breath meter (for diving) would need a new player stat tracked alongside health and hunger.

## Non-Goals (MVP)

- Multiplayer boat racing or PvP on water.
- Sea weather events (storms, tsunamis).
- Fish AI pathfinding or schooling behavior beyond simple animation.
- Underwater lighting or refraction effects.

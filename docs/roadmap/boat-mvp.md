# Boat MVP — Specification

**Status:** Planning only — no code changes.
**Last updated:** 2026-07-31

---

## Overview

This doc defines the minimum viable boat feature set for Frontier Survival: a craftable watercraft that lets the player travel across ocean and tropical biomes. Scope is intentionally narrow — no combat, no wave physics, no resource gathering on water.

---

## 1. Craft Boat

- Recipe: 5 wood planks in a U-shape on the crafting grid (3 bottom row, 2 middle row sides).
- Produces 1 boat item stored in inventory.
- Boat is a single-item stack, not placeable — it occupies the player's block position when equipped.
- No special materials at MVP (no iron, no sails).

## 2. Mount Boat

- Player right-clicks while holding the boat item to mount.
- Camera shifts slightly lower and wider to simulate sitting in the waterline.
- Player movement controls switch from walking to boating mode (new input state flag).
- Mounting is instant — no animation at MVP.

## 3. Move on Water

- WASD / gamepad sticks control boat direction and speed in boating mode.
- Boat moves slower than walking (~60% speed) but faster than swimming through water tiles.
- Boat can traverse ocean, tropical shallow, and shore water tiles; solid land blocks movement (boat stops at shoreline).
- Simple bob animation tied to movement speed — no wave physics or collision response.
- Turning radius is wider than walking to simulate water inertia.

## 4. Exit Boat

- Player presses a dedicated key (e.g., "X" or right-click empty air) to dismount.
- Player appears on the nearest traversable tile (water or shore edge).
- Boat item returns to inventory automatically.
- Exiting on land pushes the boat onto shore — no damage or despawn at MVP.

## 5. Boat Rendering

- Small sprite rendered beneath the player character when mounted.
- Sprite is a top-down or slight-angle view of a wooden hull — no rotation animation needed.
- Bob offset synced to movement speed; idle bob at a slow constant rate.
- No shadow or reflection effects at MVP.

## 6. Collision & Boundaries

- Boat stops when it hits a solid block (trees, terrain edges, structures).
- No push-through or climbing behavior — hard stop on collision.
- Player cannot mount a boat while adjacent to an impassable wall (prevents getting stuck).
- No water current or drift mechanics at MVP.

---

## Dependencies & Prerequisites

- Existing player input system must support a second movement mode (boating).
- Water tile detection via `biomeAt()` already in place from ocean biome work.
- Sprite rendering pipeline must support a second under-player layer.

## Non-Goals (MVP)

- Boat combat or ramming.
- Shipwrecks, ocean loot, or exploration rewards (covered in sea-creatures-plan.md).
- Multiplayer co-op boat riding.
- Boat repair, durability, or damage.
- Sailing mechanics (wind, sails, tacking).
- Underwater diving from boat.

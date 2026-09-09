# v1.28.5 — 20 Minecraft-class upgrades

Baseline: live / `origin/main` **v1.28.4** (`b000fe3`). Canonical checkout was dirty and 40 commits behind; this pack was built in a clean worktree.

Status labels vs Minecraft Java/Bedrock first-hour + Vibrant Visuals direction:

| # | Minecraft capability | v1.28.4 status | v1.28.5 upgrade |
|---:|---|---|---|
| 1 | Connected cave networks | Rare 1-block potholes only | Worm caves + rooms, starter pad protected |
| 2 | Authored starter sea cave | Missing | Walk-in Cane Garden west-bank cave, mouth torch, chest |
| 3 | Cave darkness + torch light | Uniform terrain lighting | Buried-column darkening + nearest-torch shader fill |
| 4 | Diamond ore in deep stone | Block id existed, almost never generated | Deep veins y2–6 in sync + worker gen |
| 5 | Diamond tools | Missing | Diamond, pick, axe, sword + recipes |
| 6 | Water source spread | Static water blocks | Bucket empty floods downhill/sideways (budgeted) |
| 7 | Hydrated farmland | Helper unwired | Crops on farmland near water grow ~1.85× |
| 8 | Villager trading | Buildings without people | Role-sashed traders + F-to-barter |
| 9 | Adaptive music | Ambient pads only | Explore / ocean / cave / storm crossfade director |
| 10 | Structure loot | Landmarks without loot tables | Ruin/wreck/cellar caches with deterministic loot |
| 11 | Hoppers | Buffer helper unwired | Place hopper between chests; pulls/pushes items |
| 12 | Enchanting + XP | Cost helper unwired | Mine XP + enchanting table → Sharpness II |
| 13 | Elytra-like glide | Missing | Palm glider: hold jump while falling to slow-fall |
| 14 | World share code | JSON export only | `FS1.` seed/mode code copied on export |
| 15 | Favor Visuals / Performance | Distance/DPR only | PBR, fog, water reflect, shafts, SSS, voxel-light knobs applied to the atlas shader |
| 16 | Leaf subsurface scattering | Opaque foliage | Back-lit foliage transmission in the greedy shader |
| 17 | Water sky reflections | Wave tint only | Fresnel sky reflection mixed into water tops |
| 18 | Trapdoors | Helper unwired | Craft + F toggle open/closed |
| 19 | Editable signs | Helper unwired | Craft + F to set up to 48 chars |
| 20 | Mount jump + biome fog identity | Flat jump / generic fog | Mounted jump 8.2; biome fog tint into height fog |

Not claimed: full PBR texture-sets, deferred lighting, infinite volumetric clouds, or Minecraft’s entire redstone/dimension set. Those remain later campaign items.

## Player-visible first-hour route

1. Fresh New World at Cane Garden.
2. Two arrival traders on the beach (Fisher / Chandler) — F to trade.
3. West-bank sea cave (`x=-21`) with torch-lit mouth and a starter chest (coal, diamond, torches).
4. Place a water bucket on dirt: water runs. Hoe farmland next to it: crops grow faster.
5. Hold a palm glider and jump off a ledge: sink rate caps.
6. Graphics Visual vs Performance changes water spec, fog, and leaf glow.

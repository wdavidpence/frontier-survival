# Frontier Survival — Next-Level Program (v1.27+)

**Base:** `v1.26.11` / `110b788`
**Scope:** Original tropical-survival systems inspired by the *fun* of Minecraft—never copied names, assets, characters, dimensions, or combat factions.
**Release rule:** Every slice must be reachable in a fresh world, smoke-tested, browser-tested, visually reviewed, and kept local until explicitly approved for publication.

## Product loop

> Notice a distant opportunity → prepare at home → travel through risk → discover a story and a tangible reward → return stronger → make the harbor/home more personal and capable.

## Ranked 20-feature program

| # | Feature | Player promise | First shippable slice | Status |
|---:|---|---|---|---|
| 1 | Island ruins and treasure rooms | Every voyage can uncover a memorable place | Deterministic ruin/shipwreck site + reward cache | In progress |
| 2 | Shipwreck and buried-treasure routes | Ocean travel creates concrete treasure stories | Map fragment + marked cache | Queued |
| 3 | Discovery journal | Discoveries become permanent goals | Journal cards and completion counters | In progress |
| 4 | Chart table, island maps, and pins | Plan and remember routes from home | Craftable chart + landmark pin UI | Queued |
| 5 | Landmark naming and navigation | Distant places have identity and direction | Landmark discovery notification + bearing | In progress |
| 6 | Relic excavation and collections | Quiet exploration has its own reward loop | Brushable dig site + first relic | Queued |
| 7 | Rare world events | Occasional surprises pull players into the world | Drift-cargo/tide event | Queued |
| 8 | Gear specialization | Tools support distinct play styles | One choice-based upgrade station | Queued |
| 9 | Tropical tonics | Foraging supports adventurous preparation | Three useful brewed tonics | Queued |
| 10 | Powered harbor automation | Building can solve practical problems | Switch + sorter + powered lantern loop | Queued |
| 11 | Island hauling transport | Long builds and mining gain practical movement | Hand-cart/tram prototype | Queued |
| 12 | Lighthouse progression | A visible endgame harbor achievement | Build stages + safe-harbor beacon | Queued |
| 13 | Settlers and trade | Islands feel socially alive | One friendly trader and rotating trade | Queued |
| 14 | Deep husbandry | Companions and pens feel rewarding | Feeding, baby growth, produce/companion benefit | Queued |
| 15 | Co-op expedition roles | Two players have complementary jobs | Navigator/crew route rewards | Queued |
| 16 | Reef glider / sail traversal | Late-game movement feels liberating | Safe launch, glide, land loop | Queued |
| 17 | Adaptive original music | Travel has emotional pacing | Exploration/discovery/harbor score states | Queued |
| 18 | Spatial biome and weather audio | The world can be heard before it is seen | Surf/wind/fauna direction and shelter/underwater filtering | Queued |
| 19 | Personal harbor customization | Home visibly tells a player story | Signs, banners, display cases, furniture set | Queued |
| 20 | Accessibility and couch presentation | More players can comfortably enjoy it | UI scale, high contrast, reduced-motion, visual presets | Queued |

## Slice 1 — Expedition Discovery: acceptance contract

- A fresh world produces deterministic, named offshore discovery sites reachable by boat.
- At least one **shipwreck/ruin** site contains a visibly authored reward cache.
- Reaching and interacting with the cache grants a deterministic exploration reward and a persistent journal discovery.
- The HUD provides a clear navigation cue without hiding ordinary survival information.
- The site is a player-visible authored prop, not a helper-only data record.
- Existing saves, animal behavior, world generation parity, solo play, and local co-op remain intact.

## Evidence per slice

1. Static: changed-file inspection, syntax, dual HTML parity, cache-bust audit.
2. Automated: canonical `node tests/smoke.mjs` plus deterministic feature contracts.
3. Runtime: exact-worktree HTTP Start/New World, authoritative runtime state, page/console errors.
4. Visual: ordinary in-world screenshot with the feature actually visible.
5. Mobile: portrait/menu and touch-safe review when UI is changed.

## Explicit exclusions

- No zombies, pirates, human-versus-human combat, literal Minecraft dimensions, copied art, copied sound, or copied text.
- Hostile wildlife remains rare, telegraphed, optional where practical, and absent on Harmless.

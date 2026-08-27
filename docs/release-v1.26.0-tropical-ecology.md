# Frontier Survival v1.26.0 — tropical ecology and root foods

This release implements the tropical plant-life sprint from the v1.25.9 lineage.

## Implemented tropical additions

- Bromeliad rosettes: rare humid forest/tree-edge accents.
- Heliconia: orange-red flowering understory clumps.
- Taro leaves: broad-leaf wet understory plants.
- Pandanus: coastal strap-leaf plants for exposed beach margins.
- Mangrove pneumatophores: specialized breathing-root silhouettes in low mangrove ground.
- Banyan/strangler-fig roots: rare dramatic root forms near tropical trees.
- Existing palms now remain part of the ecology field, with existing coconut props preserved.

## Edible tropical roots

Natural tropical/shore soil can now contain rare underground patches of:

- Yuca/cassava
- Yautía/malanga
- Ñame/yam
- Batata/sweet potato

Raw roots are modest food with a small eating risk and can be cooked at heat into stronger food. Each chunk is capped at two root patches so exploration and digging are rewarded without creating a food carpet.

## Mushroom rebalance

- Synchronous and worker mushroom thresholds now agree at `roll > 0.997`.
- Visual-only understory mushrooms are capped to one per chunk, spaced widely, and use a `0.995` roll.
- Mushrooms remain forest-floor discoveries instead of repeating red objects across ordinary tropical terrain.

## Ecology implementation

- `js/tropical-ecology.js` is a deterministic post-process applied to both sync-generated and worker-returned chunk data.
- All six plant families use authored atlas silhouettes and the existing bounded plant geometry path.
- New plant blocks are visual/harvestable and preserve the voxel collision model.
- Root blocks are solid underground blocks with item drops through the normal mining/drop path.
- Root/public HTML remains byte-identical.

## Research basis

Directly consulted reference pages for tropical structure and plant adaptations:

- Tropical rainforest layers and canopy/forest-floor structure: https://en.wikipedia.org/wiki/Tropical_rainforest
- Epiphytes, orchids, and bromeliads: https://en.wikipedia.org/wiki/Epiphyte and https://en.wikipedia.org/wiki/Bromeliaceae
- Woody tropical vines: https://en.wikipedia.org/wiki/Liana
- Mangrove prop roots and pneumatophores: https://en.wikipedia.org/wiki/Mangrove
- Coastal Pandanus prop roots and salt exposure: https://en.wikipedia.org/wiki/Pandanus
- Heliconia understory flowers: https://en.wikipedia.org/wiki/Heliconia
- Buttress roots: https://en.wikipedia.org/wiki/Buttress_root
- Tropical/Caribbean root foods: https://en.wikipedia.org/wiki/Cassava, https://en.wikipedia.org/wiki/Taro, https://en.wikipedia.org/wiki/Xanthosoma_sagittifolium, https://en.wikipedia.org/wiki/Yam_(vegetable), and https://en.wikipedia.org/wiki/Sweet_potato

The reference pattern is layered ecology: dense canopy, selective understory, sparse low-light forest floor, specialized wetland roots, coastal wind/salt forms, and edible roots beneath suitable soil.

## Verification

- Base: v1.25.9 `ad16a3b`
- Focused ecology tests: 4 passed
- Full smoke suite: passed
- Syntax checks: passed
- Import audit: 147 executable relative edges, 0 uncached
- HTML parity: passed
- Fixed seed `1884808540`: original spawn preserved at `(26.5, 18.0001, 15.5)`
- Fixed-seed loaded-world content: 110 coconuts, 3,934 tall grass blocks, 876 bamboo blocks, 704 wildflowers, 107 ferns, 52 Heliconia blocks, 32 Pandanus blocks, 20 taro blocks, 4 pneumatophore blocks, 2 bromeliads, 1 banyan-root block, 2 mushrooms, plus all four tuber variants
- Desktop Balanced: queue/pending `0`, 7 workers, CPU median 6.1 ms, P95 8.1 ms, zero runtime errors
- Mobile 390×844 Performance: queue/pending `0`, CPU median 3.8 ms, P95 5.8 ms, zero runtime errors
- Ordinary desktop and portrait frames visually accepted: beach, water, palms/coconuts, Tidewatch, HUD, and horizon preserved without foliage clutter or black artifacts

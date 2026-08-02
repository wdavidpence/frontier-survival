#!/usr/bin/env python3
"""Mint 100 high-value Luna cards for SurvivalCraft/MC competitive depth.
Creates as ready then immediately schedules behind luna_depth_4_queue so only
the existing 4 runners continue; dispatcher refills when slots free.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path("/mnt/c/Users/wdavi/Projects/Frontier-Survival")
WORK = "worktree"

# Curated playable value — not bughunt spam. Each card is one finishable vertical or pure+wire slice.
CARDS: list[tuple[str, str, int, bool, int]] = [
    # title, body, priority, goal_mode, goal_turns
    ("FS:luna: fishing rod cast catch cook", "Playable fishing: rod item+craft, cast near water, catch table (fish), cook on campfire/furnace. Pure js/fishing-cast.js + game wire. Smoke seeded catch table + wire asserts. VERIFY node tests/smoke.mjs. No push.", 990, True, 12),
    ("FS:luna: pig fauna species pack", "Add pig species: mesh silhouette, wander AI, plains/forest spawn, pork drops, optional breed stub. animals.js surgical. Smoke species register. VERIFY node tests/smoke.mjs.", 989, True, 10),
    ("FS:luna: sheep wool shear pack", "Sheep species + wool/mutton drops + shear with shears/tool. animals.js+items. Smoke shear helper. VERIFY node tests/smoke.mjs.", 988, True, 10),
    ("FS:luna: horse mount ride pack", "Steppe horse/mount: species, mount/dismount pure js/mount.js, speed while mounted, game/player wire. Smoke mount transitions. VERIFY node tests/smoke.mjs.", 987, True, 12),
    ("FS:luna: ocean fish schools + squid", "Aquatic fauna: fish school + squid, water-only move clamp js/aquatic-move.js, coastal spawn. Smoke clamp+species. VERIFY node tests/smoke.mjs.", 986, True, 10),
    ("FS:luna: wolf tame sit follow", "Wolf tame/feed/sit/follow pure js/wolf-tame.js + animals AI hooks. Keep combat. Smoke tame FSM. VERIFY node tests/smoke.mjs.", 985, True, 10),
    ("FS:luna: bee nest harvest anger", "Honey harvest from nest/hive, anger bees if no calm, campfire calm optional. honey-harvest.js + animals/game. Smoke anger flags. VERIFY node tests/smoke.mjs.", 984, True, 10),
    ("FS:luna: furnace smoker blast UI", "Station UI panel open on F-use: input/fuel/output, progress, close. furnace-ui.js + game + dual HTML if DOM. Smoke UI state. VERIFY node tests/smoke.mjs.", 983, True, 12),
    ("FS:luna: chest barrel container UI", "Open chest/barrel grid, transfer with player inv. container-ui.js + chests/barrel + dual HTML. Smoke transfer helpers. VERIFY node tests/smoke.mjs.", 982, True, 12),
    ("FS:luna: crafting table 3x3 UI polish", "Full 3x3 craft grid UI if missing/partial; recipe match; dual HTML. Smoke recipe match. VERIFY node tests/smoke.mjs.", 981, True, 10),
    ("FS:luna: stonecutter variants UI", "Stonecutter use: stone family → stairs/slabs/walls recipes. Wire stonecutter-recipe. Smoke recipes. VERIFY node tests/smoke.mjs.", 980, True, 10),
    ("FS:luna: grindstone repair disenchant", "Grindstone station: repair cost / strip enchant. grindstone-repair + UI/wire. Smoke. VERIFY node tests/smoke.mjs.", 979, True, 10),
    ("FS:luna: anvil rename repair UI", "Anvil UI: repair two tools, optional rename stub, XP/level cost via anvil-repair. Dual HTML if needed. Smoke. VERIFY node tests/smoke.mjs.", 978, True, 10),
    ("FS:luna: enchanting table flow", "Enchant table: spend levels+lapis-eq, apply from enchant-cost. enchant-ui optional. Smoke cost/apply. VERIFY node tests/smoke.mjs.", 977, True, 12),
    ("FS:luna: brewing stand potions", "Brewing: bottle+ingredient → swiftness or healing potion effect. brewing-step wire. Smoke. VERIFY node tests/smoke.mjs.", 976, True, 12),
    ("FS:luna: campfire cook station", "Campfire cooks food over time; smoke + game wire campfire-cook. VERIFY node tests/smoke.mjs.", 975, True, 8),
    ("FS:luna: smoker food fast cook wire", "Ensure smoker block use applies food speedMult end-to-end with UI or F-use. Smoke+source assert. VERIFY node tests/smoke.mjs.", 974, True, 8),
    ("FS:luna: blast furnace ore fast wire", "Blast furnace ore speedMult end-to-end playable. Smoke+source. VERIFY node tests/smoke.mjs.", 973, True, 8),
    ("FS:luna: tool tier ore gate complete", "Wrong tier no diamond/iron-eq ore drops; slow mine. mine-tier+ore-drops+game. Smoke table. VERIFY node tests/smoke.mjs.", 972, True, 10),
    ("FS:luna: armor 4-slot defense", "Head/chest/legs/boots slots, defense mult on damage. equipment+items+game. Smoke. VERIFY node tests/smoke.mjs.", 971, True, 10),
    ("FS:luna: shield block hold", "Shield item hold-to-block damage mult, no sprint. shield-block.js + wire. Smoke. VERIFY node tests/smoke.mjs.", 970, True, 10),
    ("FS:luna: bow full draw release", "Bow draw charge, release projectile, ammo, damage scale bow-draw. P1 wire P2 if easy. Smoke. VERIFY node tests/smoke.mjs.", 969, True, 10),
    ("FS:luna: mace smash combat juice", "Mace smash fall bonus wired to real hits + FX. mace-smash+game. Smoke. VERIFY node tests/smoke.mjs.", 968, True, 8),
    ("FS:luna: axe disable shield stub", "Axe hit disables blocking briefly. Pure+wire. Smoke. VERIFY node tests/smoke.mjs.", 967, True, 8),
    ("FS:luna: food nutrition hunger sat", "Hunger + saturation split; protein/fat light buffs optional. nutrition.js + survival tick. Smoke. VERIFY node tests/smoke.mjs.", 966, True, 10),
    ("FS:luna: hydration thirst meter", "Separate thirst; water bottles/cauldron fill; desert drain. hydration.js. Smoke. VERIFY node tests/smoke.mjs.", 965, True, 10),
    ("FS:luna: temperature clothing biome", "Biome temp + clothing insulation + frost/heat HUD. exposure+equipment+game. Smoke. VERIFY node tests/smoke.mjs.", 964, True, 10),
    ("FS:luna: wetness rain dry by fire", "Rain raises wetness; wet cold penalty; dry near fire/shelter. weather-survival.js. Smoke. VERIFY node tests/smoke.mjs.", 963, True, 10),
    ("FS:luna: sleep bed solo monsters", "Bed skip night if no monsters nearby; set spawn. sleep-bed.js. Smoke. VERIFY node tests/smoke.mjs.", 962, True, 10),
    ("FS:luna: sleep coop both required", "Coop: both players must sleep to skip night. sleep-bed+coop. Smoke. VERIFY node tests/smoke.mjs.", 961, True, 10),
    ("FS:luna: bandage stop bleed wire", "Bandage item stops bleed tick; craft recipe. bleed+items+game. Smoke. VERIFY node tests/smoke.mjs.", 960, True, 8),
    ("FS:luna: splint leg speed restore", "Splint cures leg injury speed penalty. Smoke. VERIFY node tests/smoke.mjs.", 959, True, 8),
    ("FS:luna: infection wound tick light", "Untreated wounds risk infection DoT; antiseptic/herb cure. Smoke. VERIFY node tests/smoke.mjs.", 958, True, 10),
    ("FS:luna: food poisoning spoil", "Spoiled/raw meat chance poison; cook reduces. Smoke. VERIFY node tests/smoke.mjs.", 957, True, 8),
    ("FS:luna: farmland hydrate crops", "Farmland hydrate near water; crop multi-stage; bone meal boost. crop-growth+farmland. Smoke. VERIFY node tests/smoke.mjs.", 956, True, 12),
    ("FS:luna: wheat potato carrot crops", "At least wheat+potato/carrot plant/grow/harvest loop playable. Smoke. VERIFY node tests/smoke.mjs.", 955, True, 10),
    ("FS:luna: tree sapling replant grow", "Saplings place and grow into trees over time. Smoke. VERIFY node tests/smoke.mjs.", 954, True, 10),
    ("FS:luna: compost bin bone meal", "Composter fill → bone meal. composter modules wire. Smoke. VERIFY node tests/smoke.mjs.", 953, True, 8),
    ("FS:luna: animal breed wheat lure", "Breed pairs with wheat/seeds; baby grow timer. animals. Smoke. VERIFY node tests/smoke.mjs.", 952, True, 10),
    ("FS:luna: lead rope animal tie", "Lead item ties animal to fence/post. Smoke. VERIFY node tests/smoke.mjs.", 951, True, 8),
    ("FS:luna: boat chest inventory", "Chest boat or boat chest storage slots. boat-chest wire. Smoke. VERIFY node tests/smoke.mjs.", 950, True, 8),
    ("FS:luna: map explore fog reveal", "Craft map; explored chunks reveal minimap fog. map-explore.js. Dual HTML if UI. Smoke. VERIFY node tests/smoke.mjs.", 949, True, 10),
    ("FS:luna: compass spawn bed bearing", "Compass HUD points spawn/bed. compass-bearing wire. Smoke. VERIFY node tests/smoke.mjs.", 948, True, 8),
    ("FS:luna: spyglass zoom use", "Spyglass zoom FOV while use. Smoke. VERIFY node tests/smoke.mjs.", 947, True, 8),
    ("FS:luna: lodestone compass link", "Lodestone links compass target. Smoke. VERIFY node tests/smoke.mjs.", 946, True, 8),
    ("FS:luna: stairs slabs collision mesh", "Stairs/slabs meta drive collision+mesh correctly. mesh/world/game. Smoke meta. VERIFY node tests/smoke.mjs.", 945, True, 12),
    ("FS:luna: doors windows open close", "Door toggle open/close collision; window glass panes. Smoke. VERIFY node tests/smoke.mjs.", 944, True, 10),
    ("FS:luna: fence gate trapdoor", "Fence gate + trapdoor open state collision. Smoke. VERIFY node tests/smoke.mjs.", 943, True, 8),
    ("FS:luna: ladder climb polish", "Reliable ladder climb up/down. ladder-climb wire. Smoke. VERIFY node tests/smoke.mjs.", 942, True, 8),
    ("FS:luna: scaffolding climb place", "Scaffolding place/climb/break fast. Smoke. VERIFY node tests/smoke.mjs.", 941, True, 8),
    ("FS:luna: torch lantern lighting place", "Place torches/lanterns affect light if system exists; else pure light + place. Smoke. VERIFY node tests/smoke.mjs.", 940, True, 8),
    ("FS:luna: chest lock key item", "Optional chest lock with key item. chest-lock wire. Smoke. VERIFY node tests/smoke.mjs.", 939, True, 8),
    ("FS:luna: sign text edit", "Place sign edit text display. sign-text wire. Dual HTML. Smoke. VERIFY node tests/smoke.mjs.", 938, True, 8),
    ("FS:luna: item frame display", "Item frame shows held item on wall. Smoke. VERIFY node tests/smoke.mjs.", 937, True, 8),
    ("FS:luna: cauldron water bottle dye", "Cauldron fill/empty bottles, extinguish, dye stub. Smoke. VERIFY node tests/smoke.mjs.", 936, True, 8),
    ("FS:luna: hopper pipe transfer", "Hopper pulls/pushes items containers. hopper-buffer wire. Smoke. VERIFY node tests/smoke.mjs.", 935, True, 10),
    ("FS:luna: dropper dispenser shoot", "Dispenser/dropper eject items on pulse. Smoke. VERIFY node tests/smoke.mjs.", 934, True, 10),
    ("FS:luna: piston push pull", "Piston extends with power pushes blocks. piston-push+world. Smoke. VERIFY node tests/smoke.mjs.", 933, True, 12),
    ("FS:luna: sticky piston pull", "Sticky piston pulls on retract. Smoke. VERIFY node tests/smoke.mjs.", 932, True, 8),
    ("FS:luna: lever pressure plate power", "Lever toggle + pressure plate entity detect power. Smoke. VERIFY node tests/smoke.mjs.", 931, True, 10),
    ("FS:luna: redstone dust line stub", "Simple power propagation along dust line limited. Smoke. VERIFY node tests/smoke.mjs.", 930, True, 12),
    ("FS:luna: daylight sensor night output", "Daylight sensor outputs day/night. Smoke. VERIFY node tests/smoke.mjs.", 929, True, 8),
    ("FS:luna: noteblock instrument pitch", "Noteblock play pitch on hit. noteblock-pitch wire+audio. Smoke. VERIFY node tests/smoke.mjs.", 928, True, 8),
    ("FS:luna: jukebox disc play", "Jukebox plays disc item loop stub. Smoke. VERIFY node tests/smoke.mjs.", 927, True, 8),
    ("FS:luna: lightning rod protect strike", "Thunder strike damage unless rod nearby. lightning-rod+weather. Smoke. VERIFY node tests/smoke.mjs.", 926, True, 10),
    ("FS:luna: copper oxidize scrape", "Copper oxidize stages + scrape wax. copper-oxidize wire. Smoke. VERIFY node tests/smoke.mjs.", 925, True, 8),
    ("FS:luna: amethyst grow buds", "Amethyst bud growth stages. Smoke. VERIFY node tests/smoke.mjs.", 924, True, 8),
    ("FS:luna: dripstone fall hazard", "Pointed dripstone fall damage. Smoke. VERIFY node tests/smoke.mjs.", 923, True, 8),
    ("FS:luna: powder snow sink freeze", "Powder snow sink+freeze. Smoke. VERIFY node tests/smoke.mjs.", 922, True, 8),
    ("FS:luna: honey block slide", "Honey slide slow+no jump. Smoke. VERIFY node tests/smoke.mjs.", 921, True, 8),
    ("FS:luna: slime block bounce", "Slime bounce on land. Smoke. VERIFY node tests/smoke.mjs.", 920, True, 8),
    ("FS:luna: coop inventory isolation", "P1/P2 inventories fully isolated. inventory+coop-state+game. Smoke. VERIFY node tests/smoke.mjs.", 919, True, 12),
    ("FS:luna: coop shared block edits", "P2 mine/place same world mutators. game+player. Smoke source asserts. VERIFY node tests/smoke.mjs.", 918, True, 10),
    ("FS:luna: coop pause freeze both", "Pause freezes world+P1+P2+fauna. Smoke. VERIFY node tests/smoke.mjs.", 917, True, 8),
    ("FS:luna: coop death per player", "Death rules independent; one dead other continues. Smoke. VERIFY node tests/smoke.mjs.", 916, True, 10),
    ("FS:luna: coop split HUD polish", "Readable dual HUD half-screen no bleed. dual HTML CSS. Smoke not required if visual; still run smoke. VERIFY node tests/smoke.mjs.", 915, True, 10),
    ("FS:luna: coop drop-in pad2", "Second pad drop-in spawns P2 without restart. Smoke. VERIFY node tests/smoke.mjs.", 914, True, 10),
    ("FS:luna: scissor clear no bleed", "Split scissor/clear no viewport bleed. Smoke/runtime note. VERIFY node tests/smoke.mjs.", 913, True, 8),
    ("FS:luna: hotbar per pad select", "Each player hotbar select independent. Smoke. VERIFY node tests/smoke.mjs.", 912, True, 8),
    ("FS:luna: shared chest coop access", "Both can open same chest sequentially. Smoke. VERIFY node tests/smoke.mjs.", 911, True, 8),
    ("FS:luna: village structure loot stub", "Generate simple village-like structure with loot chest. worldgen surgical. Smoke gen helper. VERIFY node tests/smoke.mjs.", 910, True, 12),
    ("FS:luna: abandoned mineshaft stub", "Mineshaft corridor+rails stub gen. Smoke. VERIFY node tests/smoke.mjs.", 909, True, 10),
    ("FS:luna: ocean ruins stub", "Underwater ruin chunks with loot. Smoke. VERIFY node tests/smoke.mjs.", 908, True, 10),
    ("FS:luna: shipwreck loot stub", "Shipwreck structure + map chest. Smoke. VERIFY node tests/smoke.mjs.", 907, True, 10),
    ("FS:luna: buried treasure map", "Treasure map leads to chest. Smoke. VERIFY node tests/smoke.mjs.", 906, True, 10),
    ("FS:luna: cave spider den hazard", "Cave dens with hostile pack stub. Smoke. VERIFY node tests/smoke.mjs.", 905, True, 8),
    ("FS:luna: bear dens forest ecology", "Bear den spawn points forest. animals+gen. Smoke. VERIFY node tests/smoke.mjs.", 904, True, 8),
    ("FS:luna: deer herd flee AI", "Deer herd flee from player. Smoke. VERIFY node tests/smoke.mjs.", 903, True, 8),
    ("FS:luna: alligator water ambush", "Alligator ambush near water if species exists; polish AI. Smoke. VERIFY node tests/smoke.mjs.", 902, True, 8),
    ("FS:luna: bird flock ambient", "Ambient bird flocks non-combat. Smoke. VERIFY node tests/smoke.mjs.", 901, True, 8),
    ("FS:luna: fishable treasure junk table", "Fishing treasure/junk weighted table. Smoke. VERIFY node tests/smoke.mjs.", 900, True, 8),
    ("FS:luna: durability UI break warn", "Tool durability bar + break sound/warn. Smoke. VERIFY node tests/smoke.mjs.", 899, True, 8),
    ("FS:luna: inventory armor HUD icons", "Armor icons on HUD when equipped. dual HTML. Smoke. VERIFY node tests/smoke.mjs.", 898, True, 8),
    ("FS:luna: death keep inventory toggle", "Gamerule-like keepInventory option. Smoke. VERIFY node tests/smoke.mjs.", 897, True, 8),
    ("FS:luna: difficulty peaceful-hard", "Difficulty scales hunger/damage/spawns. Smoke. VERIFY node tests/smoke.mjs.", 896, True, 10),
    ("FS:luna: creative fly build mode", "Creative mode fly + instant break toggle for building. Smoke. VERIFY node tests/smoke.mjs.", 895, True, 10),
    ("FS:luna: adventure mode block protect", "Adventure can't break unless tool. Smoke. VERIFY node tests/smoke.mjs.", 894, True, 8),
    ("FS:luna: achievements first night", "Achievement: survive first night. achievements.js. Smoke. VERIFY node tests/smoke.mjs.", 893, True, 8),
    ("FS:luna: achievement first iron tools", "Achievement smelt iron + craft pick. Smoke. VERIFY node tests/smoke.mjs.", 892, True, 8),
    ("FS:luna: tutorial tooltip first boat", "Tooltip when near water with boat recipe unlocked. Smoke. VERIFY node tests/smoke.mjs.", 891, True, 8),
    ("FS:luna: audio stingers craft smelt", "Juicy craft/smelt/levelup stingers via audio.js. Smoke no-fail. VERIFY node tests/smoke.mjs.", 890, True, 8),
    ("FS:luna: footstep surface sounds", "Dirt/stone/wood/water footstep variants. Smoke. VERIFY node tests/smoke.mjs.", 889, True, 8),
    ("FS:luna: ambient biome loops", "Biome soft ambient bed volumes. Smoke. VERIFY node tests/smoke.mjs.", 888, True, 8),
    ("FS:luna: rain splash particles", "Rain splash FX when raining. fx.js. Smoke. VERIFY node tests/smoke.mjs.", 887, True, 8),
    ("FS:luna: block break particles juice", "Break particles by block color. Smoke. VERIFY node tests/smoke.mjs.", 886, True, 8),
    ("FS:luna: water caustics shore feel", "Shore foam/caustics light visual improve without perf break. Smoke. VERIFY node tests/smoke.mjs.", 885, True, 10),
    ("FS:luna: cloud shadows day cycle", "Soft cloud shadow pulse day. Smoke. VERIFY node tests/smoke.mjs.", 884, True, 8),
    ("FS:luna: save autosave interval", "Autosave every N minutes + indicator. Smoke. VERIFY node tests/smoke.mjs.", 883, True, 8),
    ("FS:luna: multi-slot save worlds", "3 world save slots UI. dual HTML. Smoke. VERIFY node tests/smoke.mjs.", 882, True, 10),
]


def create(title: str, body: str, pri: int, goal: bool, turns: int, idx: int) -> str | None:
    key = f"luna-100-20260801-{idx:03d}"
    full = (
        body
        + "\n\nCONSTRAINTS:\n- Repo worktree workspace; surgical edits; never git reset/clean/checkout --hard.\n"
        "- Do NOT push; orchestrator merges/publishes.\n- Original IP only.\n- Provenance: luna.\n"
        "- If feature already exists, improve playability + tests then complete with evidence.\n"
        f"FILES preferred: listed in goal; avoid unrelated hot-file thrash.\nIDEMPOTENCY: {key}\n"
    )
    cmd = [
        "hermes",
        "kanban",
        "create",
        "--json",
        "--assignee",
        "luna",
        "--workspace",
        WORK,
        "--priority",
        str(pri),
        "--max-runtime",
        "75m",
        "--max-retries",
        "2",
        "--created-by",
        "orchestrator-luna-100",
        "--idempotency-key",
        key,
        "--body",
        full,
    ]
    if goal:
        cmd.extend(["--goal", "--goal-max-turns", str(turns)])
    cmd.append(title)
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True)
    out = (r.stdout or "") + (r.stderr or "")
    tid = None
    try:
        tid = json.loads(r.stdout or "{}").get("task_id")
    except Exception:
        pass
    if not tid:
        m = re.search(r"t_[a-f0-9]+", out)
        tid = m.group(0) if m else None
    return tid


def main() -> int:
    # Ensure exactly 100
    cards = CARDS[:100]
    if len(cards) < 100:
        print("NEED more card defs", len(cards), file=sys.stderr)
        return 2
    created = []
    for i, (title, body, pri, goal, turns) in enumerate(cards):
        tid = create(title, body, pri, goal, turns, i)
        print(f"{i:03d} {tid or 'FAIL'} {title}")
        if tid:
            # park behind depth-4 queue so we don't oversubscribe
            subprocess.run(
                ["hermes", "kanban", "schedule", tid, "lane-cap-hold:luna_depth_4_queue"],
                cwd=str(REPO),
                capture_output=True,
                text=True,
            )
            created.append({"i": i, "id": tid, "title": title})
    Path("/tmp/luna-100.json").write_text(json.dumps(created, indent=2))
    print(f"CREATED {len(created)}/100 scheduled in luna_depth_4_queue")
    return 0 if len(created) == 100 else 1


if __name__ == "__main__":
    raise SystemExit(main())

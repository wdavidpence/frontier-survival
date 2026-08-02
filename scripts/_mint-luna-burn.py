#!/usr/bin/env python3
"""Mint tonight's Luna credit-burn wave (worktree-isolated vertical slices)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/mnt/c/Users/wdavi/Projects/Frontier-Survival")

CARDS = [
    {
        "title": "FS:luna: pig species fauna pack",
        "priority": 980,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Add playable pig fauna competitive with Survivalcraft/Minecraft animal loop.

ACCEPTANCE:
1. New pig species in js/animals.js (or additive module imported by animals) with stats, mesh silhouette, drops (raw pork/meat), wander AI, spawn in plains/forest.
2. Deterministic smoke coverage for pig species registration/spawn/drop helpers.
3. node tests/smoke.mjs PASS.
4. No regressions to cow/chicken/wolf/fox/alligator/bear/deer/bee.
5. If worktree: leave clear file list in summary for judge merge.

FILES (preferred): js/animals.js, js/atlas.js or atlas-core if tiles needed, tests/smoke.mjs
CONSTRAINTS: surgical; never git reset/clean/checkout --hard; do not push; original IP names only; provenance luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: sheep species + wool shear pack",
        "priority": 979,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Add sheep fauna + wool drop/shear gameplay toward SC/MC breadth.

ACCEPTANCE:
1. Sheep species with mesh, AI, spawn, wool/mutton drops.
2. Shear interaction path (tool or use) wired or pure+smoke if full wire blocked.
3. Smoke tests for species + shear helper.
4. node tests/smoke.mjs PASS.

FILES: js/animals.js, js/items.js, js/game.js only if needed, tests/smoke.mjs
CONSTRAINTS: surgical; no hard reset; no push; luna provenance.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: fishing rod catch loop",
        "priority": 978,
        "goal": True,
        "goal_turns": 14,
        "workspace": "worktree",
        "body": """GOAL: Playable fishing loop: craft/use fishing rod near water, catch fish items, hunger value.

ACCEPTANCE:
1. Fishing rod item + craft recipe if items/crafting patterns exist.
2. Use/cast state machine pure module preferred (js/fishing-cast.js) + game/player wire if feasible.
3. Catch table yields fish item(s); smoke covers RNG table with seeded/pure function.
4. node tests/smoke.mjs PASS.
5. Dual HTML sync only if UI strings added.

FILES: js/fishing-cast.js (new), js/items.js, js/crafting.js, js/game.js or player.js as needed, tests/smoke.mjs
CONSTRAINTS: additive; original IP; no push; luna provenance.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: boat place ride watercraft",
        "priority": 977,
        "goal": True,
        "goal_turns": 14,
        "workspace": "worktree",
        "body": """GOAL: Playable boat: craft, place on water, mount, move on water surface, dismount.

ACCEPTANCE:
1. Boat item/entity module; water buoyancy/move helpers pure where possible.
2. Runtime wire for place/mount/move/dismount with smoke on pure math + source wire asserts.
3. node tests/smoke.mjs PASS.
4. Works in solo; note coop dual-seat follow-up if not done.

FILES: js/boat-entity.js (new) or existing boat modules, js/items.js, js/game.js, js/player.js, tests/smoke.mjs
CONSTRAINTS: surgical; no push; luna provenance.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: horse rideable mount pack",
        "priority": 976,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Horse (or steppe mount) species + mount/dismount + speed boost while mounted.

ACCEPTANCE:
1. Species in animals with mesh/AI/spawn.
2. Mount state helpers pure + player/game wire if possible.
3. Smoke for mount helpers + species.
4. node tests/smoke.mjs PASS.

FILES: js/animals.js, js/mount.js (new), js/player.js/game.js as needed, tests/smoke.mjs
CONSTRAINTS: additive original IP; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: ocean fish + squid fauna",
        "priority": 975,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Ocean ecology: fish school + squid/cuttle aquatic fauna with swim AI and drops.

ACCEPTANCE:
1. Aquatic species with water-constrained movement helpers.
2. Spawn rules coastal/ocean biomes if biome hooks exist.
3. Smoke for aquatic movement clamp + species register.
4. node tests/smoke.mjs PASS.

FILES: js/animals.js, js/aquatic-move.js (new optional), tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: wolf tame feed sit pack",
        "priority": 974,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Deepen wolf: feed/tame, sit/follow, defend owner stub.

ACCEPTANCE:
1. Tame/feed state machine pure helpers + animal AI hooks.
2. Smoke for tame transitions.
3. node tests/smoke.mjs PASS.
4. Preserve existing wolf combat.

FILES: js/animals.js, js/wolf-tame.js (new), tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: stairs slabs mesh meta wire",
        "priority": 973,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Make stairs/slabs visually and collision-correct using existing pure helpers (stair-place/slab-place).

ACCEPTANCE:
1. Mesh or collision path respects half/facing meta for stairs+slabs.
2. Place path sets meta; smoke asserts meta encode/decode and any mesh selector.
3. node tests/smoke.mjs PASS.

FILES: js/mesh-greedy.js and/or js/world.js, js/game.js place path, existing slab/stair modules, tests/smoke.mjs
CONSTRAINTS: surgical; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: furnace station UI panel",
        "priority": 972,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Playable furnace/smoker/blast UI: open on use, input/fuel/output slots, progress, close.

ACCEPTANCE:
1. Station panel UI for furnace family using existing furnace-tick/smelting pure modules.
2. Wire F-use open/close; process ticks while open or always.
3. Smoke for UI state helpers + existing smelt math.
4. Sync index.html + public/index.html if DOM added.
5. node tests/smoke.mjs PASS.

FILES: js/game.js, js/furnace-ui.js (new), index.html, public/index.html, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: chest barrel storage UI",
        "priority": 971,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Openable chest/barrel container UI with transfer to player inventory.

ACCEPTANCE:
1. Container open state + slot grid helpers.
2. Wire to chest/barrel blocks if present; else pure+smoke + minimal game hook.
3. Dual HTML sync if DOM.
4. node tests/smoke.mjs PASS.

FILES: js/container-ui.js (new), js/chests.js, js/barrel-storage.js, js/game.js, index.html, public/index.html, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: farming crop stages + water hydrate",
        "priority": 970,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Deeper farming: multi-stage crops, farmland hydrate near water, bone meal or equivalent growth boost.

ACCEPTANCE:
1. Extend crop-growth pure module + world/game wire.
2. Hydration check helper + smoke.
3. At least 2 crop types if items exist.
4. node tests/smoke.mjs PASS.

FILES: js/crop-growth.js, js/farmland.js (new optional), js/game.js/world.js as needed, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: weather rain wet cold survival",
        "priority": 969,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Rain/weather deepens survival: wetness up in rain, cold penalty when wet, dry by fire/shelter.

ACCEPTANCE:
1. Weather→survival coupling pure helpers + wire into existing weather/survival ticks.
2. Smoke for wet/cold transitions.
3. node tests/smoke.mjs PASS.
4. Mirror P1/P2 survival if easy.

FILES: js/weather-survival.js (new), js/game.js, existing exposure/bleed/survival modules, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: coop inventory isolation P0",
        "priority": 968,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Local co-op P0: P1 and P2 inventories fully isolated (hotbar, bag, craft in/out).

ACCEPTANCE:
1. Actor-owned inventory fields; no shared mutation bugs.
2. Smoke tests for isolation helpers / coop-state.
3. node tests/smoke.mjs PASS.
4. Document any remaining shared containers.

FILES: js/inventory.js, js/coop-state.js, js/game.js, js/input-coop.js, tests/smoke.mjs, tests/smoke-coop-state.mjs if present
CONSTRAINTS: surgical; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: coop shared world block edits P0",
        "priority": 967,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Local co-op P0: both players can mine/place in shared world without block desync.

ACCEPTANCE:
1. P2 mine/place paths hit same world mutators as P1.
2. Smoke/source asserts for P2 block edit call sites.
3. node tests/smoke.mjs PASS.

FILES: js/game.js, js/player.js, js/world.js as needed, tests/smoke.mjs
CONSTRAINTS: surgical; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: coop pause both freeze P0",
        "priority": 966,
        "goal": True,
        "goal_turns": 8,
        "workspace": "worktree",
        "body": """GOAL: Co-op pause freezes world + both players; resume restores.

ACCEPTANCE:
1. Pause flag gates ticks for P1/P2/fauna/weather.
2. Smoke for pause gate helper.
3. node tests/smoke.mjs PASS.

FILES: js/game.js, js/coop-state.js, js/input.js, tests/smoke.mjs
CONSTRAINTS: surgical; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: sleep bed multiplayer both required",
        "priority": 965,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Bed sleep: solo works; coop requires both players sleeping to skip night.

ACCEPTANCE:
1. Sleep state helpers for solo/coop.
2. Wire bed use; smoke covers both-required logic.
3. node tests/smoke.mjs PASS.

FILES: js/sleep-bed.js (new), js/game.js, js/bed-facing.js, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: lightning rod + thunder damage wire",
        "priority": 964,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Thunderstorm strikes: damage/fire risk unless lightning rod nearby; use existing lightning-rod pure if present.

ACCEPTANCE:
1. Strike picker + rod protection pure helpers wired to weather tick.
2. Smoke for protection radius.
3. node tests/smoke.mjs PASS.

FILES: js/lightning-rod.js, js/weather-strike.js (new optional), js/game.js, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: tool tier mining gate polish",
        "priority": 963,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Enforce tool tiers for ore drops (wood/stone/iron/diamond-equivalent): wrong tier no ore drop / slow mine.

ACCEPTANCE:
1. mine-tier/ore-drops integration complete for common ores.
2. Smoke table for tier gates.
3. node tests/smoke.mjs PASS.

FILES: js/mine-tier.js, js/ore-drops.js, js/game.js, js/items.js, tests/smoke.mjs
CONSTRAINTS: surgical; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: enchanting table usable flow",
        "priority": 962,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Enchanting table station: spend levels/lapis-equivalent, apply enchant from enchant-cost pure module.

ACCEPTANCE:
1. Use flow + pure cost application on tool/weapon.
2. Smoke for cost + apply.
3. node tests/smoke.mjs PASS.
4. Dual HTML if UI.

FILES: js/enchant-cost.js, js/enchant-ui.js (new optional), js/game.js, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: brewing stand potion craft",
        "priority": 961,
        "goal": True,
        "goal_turns": 12,
        "workspace": "worktree",
        "body": """GOAL: Brewing stand: water bottle + ingredients via brewing-step pure → drinkable potion with effect.

ACCEPTANCE:
1. Station use + at least 1 potion effect (swiftness or healing).
2. Smoke for brew steps + effect apply helper.
3. node tests/smoke.mjs PASS.

FILES: js/brewing-step.js, js/brew-ui.js optional, js/game.js, js/items.js, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: bee nest honey harvest wire",
        "priority": 960,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Playable bee nest/hive harvest: get honey items, anger bees if rough harvest, optional campfire calm.

ACCEPTANCE:
1. Harvest helper + animal/bee anger hook if bees exist.
2. Smoke for harvest + anger flags.
3. node tests/smoke.mjs PASS.
4. Wire into game use path if blocks exist.

FILES: js/animals.js, js/honey-harvest.js (new), js/game.js as needed, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: map item explore reveal",
        "priority": 959,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Craftable map item that reveals explored chunks/minimap fog toward SC exploration.

ACCEPTANCE:
1. Map state pure module + HUD/minimap reveal hook if present.
2. Smoke for explore mark/reveal.
3. node tests/smoke.mjs PASS.
4. Dual HTML if UI.

FILES: js/map-explore.js (new), js/game.js, index.html/public as needed, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: bow draw release combat juiciness",
        "priority": 958,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Finish bow gameplay: draw charge, release projectile, damage, ammo consume using bow-draw pure.

ACCEPTANCE:
1. Full use path P1 (P2 if easy).
2. Smoke for draw→release damage scaling.
3. node tests/smoke.mjs PASS.

FILES: js/bow-draw.js, js/game.js, js/player.js, js/fx.js optional, tests/smoke.mjs
CONSTRAINTS: surgical; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
    {
        "title": "FS:luna: shield block combat",
        "priority": 957,
        "goal": True,
        "goal_turns": 10,
        "workspace": "worktree",
        "body": """GOAL: Shield item: hold-to-block reduces damage, disables sprint, cooldown on axe-bash stub optional.

ACCEPTANCE:
1. Pure block mult helper + player damage path wire.
2. Craft recipe if patterns exist.
3. Smoke for block mult.
4. node tests/smoke.mjs PASS.

FILES: js/shield-block.js (new), js/items.js, js/game.js/player.js, tests/smoke.mjs
CONSTRAINTS: additive; no push; luna.
VERIFY: node tests/smoke.mjs
""",
    },
]


def create_card(card: dict, idx: int) -> dict:
    key = f"luna-burn-20260801-{idx:02d}"
    cmd = [
        "hermes",
        "kanban",
        "create",
        "--json",
        "--assignee",
        "luna",
        "--workspace",
        card["workspace"],
        "--priority",
        str(card["priority"]),
        "--max-runtime",
        "90m",
        "--max-retries",
        "2",
        "--created-by",
        "orchestrator-luna-burn",
        "--idempotency-key",
        key,
        "--body",
        card["body"],
        card["title"],
    ]
    if card.get("goal"):
        cmd[cmd.index("--json") + 1 : cmd.index("--json") + 1]  # no-op keep structure
        # insert goal flags before title
        title = cmd.pop()
        cmd.extend(["--goal", "--goal-max-turns", str(card.get("goal_turns", 12)), title])

    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True)
    out = (r.stdout or "") + (r.stderr or "")
    task_id = None
    try:
        j = json.loads(r.stdout or "{}")
        task_id = j.get("task_id") or j.get("id") or (j.get("task") or {}).get("id")
    except Exception:
        pass
    if not task_id:
        import re

        m = re.search(r"t_[a-f0-9]+", out)
        task_id = m.group(0) if m else None
    return {
        "title": card["title"],
        "task_id": task_id,
        "exit": r.returncode,
        "out": out[-500:],
    }


def main() -> int:
    results = []
    for i, card in enumerate(CARDS):
        res = create_card(card, i)
        results.append(res)
        print(f"{res['task_id'] or 'FAIL'}  {res['title']}  exit={res['exit']}")
        if res["exit"] != 0 and not res["task_id"]:
            print(res["out"])
    ok = [r for r in results if r["task_id"]]
    print(f"CREATED {len(ok)}/{len(results)}")
    Path("/tmp/luna-burn-created.json").write_text(json.dumps(results, indent=2))
    return 0 if len(ok) == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())

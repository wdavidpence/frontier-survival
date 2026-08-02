#!/usr/bin/env python3
"""Mint overnight ornith (oss20b) pure-module queue — serial depth 1 all night."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path("/mnt/c/Users/wdavi/Projects/Frontier-Survival")

# Pure/disjoint modules — ornith-friendly, high SurvivalCraft/MC value, low hot-file thrash.
CARDS = [
    ("FS:ornith: pure nutrition hunger-sat split", "Create/extend js/nutrition.js: hunger+saturation tick helpers, clamp, eat restore. Smoke deterministic. NO game.js/world.js/animals.js edits unless import-only one line. VERIFY: node tests/smoke.mjs. No push. provenance ornith."),
    ("FS:ornith: pure hydration thirst", "js/hydration.js: thirst drain/restore, desert mult, clamp. Smoke. No hot multi-owner files. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure wetness rain dry", "js/wetness.js: wetness from rain flag, dry-by-fire helper. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure sleep gate solo/coop", "js/sleep-bed.js: canSleepAlone, canSleepCoop(both), monsterNear block. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure bandage bleed stop", "js/bandage.js or extend bleed.js: applyBandage stops bleed. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure splint speed", "js/splint.js: leg injury speed mult restore. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure infection wound", "js/infection.js: wound infection chance/tick/cure. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure food poison", "js/food-poison.js: spoil/raw poison chance. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure farmland hydrate", "js/farmland.js: hydrateNearWater, moisture clamp. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure crop stage advance", "Extend js/crop-growth.js multi-stage + bone meal. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure fishing treasure junk", "Extend js/fishing-cast.js treasure/junk weighted table. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure mount state", "js/mount.js: mount/dismount/speedWhileMounted. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure aquatic move clamp", "js/aquatic-move.js: water-only velocity clamp. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure wolf tame fsm", "js/wolf-tame.js: wild/tame/sit/follow transitions. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure shield block mult", "js/shield-block.js: hold block damage mult, sprint lock. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure bow charge damage", "Extend js/bow-draw.js charge→damage scale. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure tool tier gate table", "Extend js/mine-tier.js ore tier gates table. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure armor defense slots", "Extend js/equipment.js 4-slot defense sum. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure enchant apply cost", "Extend js/enchant-cost.js applyEnchant. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure brew step potion", "Extend js/brewing-step.js one potion effect id. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure hopper transfer", "Extend js/hopper-buffer.js pull/push one item. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure piston push rules", "Extend js/piston-push.js push list rules. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure lever power toggle", "Extend js/lever-power.js toggle. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure pressure plate detect", "Extend js/pressure-plate.js entity detect. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure redstone dust falloff", "js/redstone-dust.js limited line power falloff. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure daylight sensor out", "Extend daylight-sensor day/night output. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure noteblock pitch map", "Extend noteblock-pitch instrument map. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure lightning rod radius", "Extend lightning-rod protection radius. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure copper oxidize stage", "Extend copper-oxidize stages scrape/wax. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure amethyst grow", "Extend amethyst-grow stages. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure dripstone fall dmg", "Extend dripstone-fall damage. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure powder snow sink", "Extend powder-snow sink/freeze. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure honey slide", "Extend honey-slide slow. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure slime bounce", "js/slime-bounce.js bounce vel. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure scaffold climb", "Extend scaffolding climb rules. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure ladder climb", "Extend ladder-climb. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure door toggle state", "Extend door-hinge open state. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure trapdoor state", "js/trapdoor-state.js open/close. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure fence gate state", "Extend fence-gate open. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure slab meta half", "Extend slab-place half encode. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure stair meta face", "Extend stair-place facing encode. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure bed facing meta", "Extend bed-facing. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure cauldron level", "Extend cauldron-level fill/empty. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure compass bearing", "Extend compass-bearing to target. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure map explore mark", "js/map-explore.js markExplored/reveal. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure container transfer", "js/container-transfer.js moveStack between grids. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure furnace ui state", "js/furnace-ui-state.js open slots progress. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure craft 3x3 match", "Extend crafting recipe match helper if pure path exists. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure durability warn", "Extend durability.js warn threshold. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure keep inventory flag", "js/gamerules.js keepInventory + difficulty enum. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure achievement first night", "Extend achievements.js firstNight. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure achievement iron age", "achievements firstIronTools. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure coop pause gate", "Extend coop-state.js pause freezes both. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure coop inv isolate", "Extend coop-state/inventory isolation helpers. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure coop sleep both", "sleep both-required coop helper. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure death keep vs drop", "js/death-rules.js drop vs keep. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure temp clothing insul", "Extend exposure clothing insulation. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure biome temp table", "js/biome-temp.js biome→base temp. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure wind charge knock", "Extend wind-charge knockback. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure mace smash bonus", "Extend mace-smash fall bonus. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure breeze charge", "Extend breeze-charge. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure vault reward once", "Extend vault-reward once flag. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure trial spawner wave", "Extend trial-spawner waves. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure ominous bottle", "Extend ominous-bottle amp. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure wolf armor dur", "Extend wolf-armor durability. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure armadillo scute", "Extend armadillo-scute drop. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure sniffer seed", "Extend sniffer-seed. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure camel dash", "Extend camel-dash cooldown. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure warden anger", "Extend warden-anger 0-150. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure allay duplicate", "Extend allay-duplication. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure boat buoyancy step", "Extend boat-entity buoyancy/step pure. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure shear wool count", "Ensure shearAnimal/woolDropCount pure tests extended. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure breed pair timer", "js/breed.js pair+baby timer. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure lead tie fence", "js/lead-tie.js tie/untie. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure village loot table", "js/structure-loot.js village chest table. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure shipwreck loot", "structure-loot shipwreck table. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure mineshaft rail stub", "js/mineshaft-gen.js corridor stub pure. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure treasure map offset", "js/treasure-map.js chest offset from map. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure difficulty scales", "js/difficulty.js peaceful-hard mults. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure creative fly flags", "js/gamemode.js creative fly/instant break flags. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure adventure protect", "gamemode adventure cannot break without tool. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure autosave interval", "js/autosave.js due check. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure save slot index", "js/save-slots.js 3 slots pick. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure hotbar cycle pad", "Extend hotbar-cycle coop. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure scissor viewport", "js/scissor-view.js half rects no bleed. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure audio stinger ids", "js/audio-cues.js craft/smelt/level stinger ids. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure footstep surface", "js/footstep.js surface→sample id. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure particle break color", "js/break-particles.js block→rgb. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure rain splash rate", "js/rain-fx.js splash rate. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure cloud shadow pulse", "js/cloud-shadow.js day pulse 0-1. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure sign text sanitize", "Extend sign-text sanitize length. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure item frame slot", "Extend item-frame held id. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure chest lock key", "Extend chest-lock key match. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure composter chance", "Extend composter-chance table. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure stonecutter recipes", "Extend stonecutter-recipe stone family. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure grindstone cost", "Extend grindstone-repair cost. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure anvil repair cost", "Extend anvil-repair cost. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure smoker speed mult", "Extend smoker-speed. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure blast speed mult", "Extend blast-furnace-speed. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure campfire cook tick", "Extend campfire-cook. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure bee harvest anger", "js/honey-harvest.js harvest/anger flags. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure axe shield disable", "js/axe-disable-shield.js stun ticks. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure spyglass fov", "Extend spyglass zoom scale. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: pure lodestone link", "lodestone compass link id. Smoke. VERIFY node tests/smoke.mjs."),
    ("FS:ornith: review unique overnight health", "READ-ONLY: write docs/reviews/ornith-overnight-health.md with board stats recipe, running ids, smoke command, no source edits. VERIFY file non-empty. No push."),
]


def create(title: str, body: str, idx: int) -> str | None:
    key = f"ornith-night-20260801-{idx:03d}"
    full = body + (
        "\n\nCONSTRAINTS:\n- Assignee oss20b = ornith-1.0-9b-mtp.\n"
        "- Workspace dir shared repo; ONLY touch listed pure module + tests/smoke.mjs (or unique review path).\n"
        "- NEVER git reset/clean/checkout --hard. No commit/push.\n"
        "- Prefer additive pure helpers; if already exists, strengthen tests + edge cases then complete.\n"
        f"- Provenance ornith. IDEMPOTENCY {key}\n"
    )
    cmd = [
        "hermes",
        "kanban",
        "create",
        "--json",
        "--assignee",
        "oss20b",
        "--workspace",
        f"dir:{REPO}",
        "--priority",
        str(800 - idx),
        "--max-runtime",
        "40m",
        "--max-retries",
        "3",
        "--created-by",
        "orchestrator-ornith-night",
        "--idempotency-key",
        key,
        "--body",
        full,
        title,
    ]
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
    if tid:
        # park serial queue depth1
        subprocess.run(
            ["hermes", "kanban", "schedule", tid, "ornith_serial_overnight_queue"],
            cwd=str(REPO),
            capture_output=True,
            text=True,
        )
    return tid


def main() -> int:
    created = []
    for i, (title, body) in enumerate(CARDS):
        tid = create(title, body, i)
        print(f"{i:03d} {tid or 'FAIL'} {title}")
        if tid:
            created.append({"id": tid, "title": title})
    Path("/tmp/ornith-night.json").write_text(json.dumps(created, indent=2))
    print(f"CREATED {len(created)}/{len(CARDS)} ornith overnight cards")
    return 0 if len(created) == len(CARDS) else 1


if __name__ == "__main__":
    raise SystemExit(main())

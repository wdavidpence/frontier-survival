/**
 * Campaign B — build expression helpers (items 22–35).
 * Pure module: deterministic, no DOM, no Three.js.
 */

/** Item 22: ghost-preview explanation for a placement hit. */
export function ghostPreviewInfo(hit, blockId) {
  if (!hit) return null;
  const face = hit.face || 'side';
  return {
    cell: [hit.x, hit.y, hit.z],
    face,
    half: face === 'top' && /slab/i.test(String(blockId || '')),
    stair: /stair/i.test(String(blockId || '')),
    hinge: /door|gate|trapdoor/i.test(String(blockId || '')) ? (hit.face === 'west' ? 'left' : 'right') : null,
    collides: !!hit.collides,
    text: face === 'top' ? 'Rests on top face' : face === 'bottom' ? 'Hangs from underside' : `Attaches to ${face} face`,
  };
}

/** Item 23: rotate/flip orientation state with compass letter. */
export function orientationState(rotation) {
  const steps = Math.round(Number(rotation) || 0) % 4;
  const labels = ['N', 'E', 'S', 'W'];
  return { steps, label: labels[(steps + 4) % 4], compass: (steps + 4) % 4 * 90 };
}

/** Item 24: safe replace mode — the exact cell that would be replaced. */
export function replaceTarget(hit, currentBlocks) {
  if (!hit) return null;
  const key = `${hit.x},${hit.y},${hit.z}`;
  const cur = currentBlocks?.get?.(key) ?? currentBlocks?.[key] ?? null;
  return { key, cell: [hit.x, hit.y, hit.z], willReplace: !!cur, current: cur };
}

/** Item 25/26: blueprint capture and paste (material cost = block counts). */
export function captureBlueprint(edits, origin, radius = 8) {
  const blocks = [];
  for (const [key, id] of Object.entries(edits ?? {})) {
    const [x, y, z] = String(key).split(',').map(Number);
    if (Math.abs(x - origin.x) <= radius && Math.abs(z - origin.z) <= radius) {
      blocks.push({ dx: x - origin.x, dy: y - origin.y, dz: z - origin.z, id });
    }
  }
  const cost = {};
  blocks.forEach((b) => { cost[b.id] = (cost[b.id] || 0) + 1; });
  return { origin: { ...origin }, blocks, cost, size: blocks.length };
}

export function pasteBlueprint(blueprint, anchor, available) {
  if (!blueprint?.blocks?.length) return { ok: false, reason: 'empty blueprint' };
  const avail = { ...(available || {}) };
  const placements = [];
  const missing = {};
  for (const b of blueprint.blocks) {
    if ((avail[b.id] ?? 0) > 0) {
      avail[b.id] -= 1;
      placements.push({ x: anchor.x + b.dx, y: anchor.y + b.dy, z: anchor.z + b.dz, id: b.id });
    } else {
      missing[b.id] = (missing[b.id] || 0) + 1;
    }
  }
  return { ok: Object.keys(missing).length === 0, placements, missing };
}

/** Item 27/28: trim families and material variants from a shared recipe id. */
export const TRIM_FAMILIES = Object.freeze({
  railing: Object.freeze(['railing_oak', 'railing_stone', 'railing_coral']),
  post: Object.freeze(['post_oak', 'post_stone', 'post_basalt']),
  beam: Object.freeze(['beam_oak', 'beam_stone']),
  shutter: Object.freeze(['shutter_oak', 'shutter_white']),
  ladder: Object.freeze(['ladder_rope', 'ladder_wood']),
});

export function variantOf(baseId, material) {
  const mat = String(material || 'oak').toLowerCase();
  return `${String(baseId || 'trim')}_${mat}`;
}

/** Item 29: functional decoration registry (station id -> player effect). */
export const DECOR_STATIONS = Object.freeze({
  bench: Object.freeze({ label: 'Fishing Bench', effect: 'speeds bait prep' }),
  shelf: Object.freeze({ label: 'Supply Shelf', effect: 'dry storage display' }),
  drying_rack: Object.freeze({ label: 'Drying Rack', effect: 'slows spoilage nearby' }),
  planter: Object.freeze({ label: 'Planter', effect: 'grows herbs' }),
  sign: Object.freeze({ label: 'Painted Sign', effect: 'labels your camp' }),
  table: Object.freeze({ label: 'Camp Table', effect: 'meal prep surface' }),
});

/** Item 30: snap-point suggestions for stairs/slabs/roofs/docks. */
export function snapPoints(origin, facingSteps) {
  const dir = [[0, 1], [1, 0], [0, -1], [-1, 0]][((Number(facingSteps) || 0) % 4 + 4) % 4];
  const out = [];
  for (let i = 1; i <= 3; i++) {
    out.push({
      cell: [origin.x + dir[0] * i, origin.y + (i - 1), origin.z + dir[1] * i],
      kind: i === 1 ? 'stair' : i === 2 ? 'slab' : 'roof',
    });
  }
  return out;
}

/** Item 31: structural shelter validation. */
export function shelterValidation({ roofCells, wallCells, hasDoor, lightCells, rain }) {
  const roof = Math.max(0, Number(roofCells) || 0);
  const walls = Math.max(0, Number(wallCells) || 0);
  const coverage = Math.min(1, roof / 9);
  const enclosure = Math.min(1, walls / 12);
  const dry = rain ? coverage : 1;
  const score = coverage * 0.4 + enclosure * 0.3 + (hasDoor ? 0.15 : 0) + (lightCells > 0 ? 0.15 : 0);
  return {
    coverage, enclosure, dry, hasDoor: !!hasDoor, lit: Number(lightCells) > 0,
    score: Math.min(1, score),
    verdict: score >= 0.8 ? 'Storm-ready' : score >= 0.5 ? 'Fair shelter' : 'Exposed',
  };
}

/** Item 32: building-mode camera aid — keeps world visible, only nudges pitch. */
export function buildCameraAid(pitchDeg) {
  const p = Math.max(-80, Math.min(80, Number(pitchDeg) || 0));
  return { pitch: Math.abs(p) > 65 ? Math.sign(p) * 65 : p, neverHidesWorld: true };
}

/** Item 33: bounded undo stack with material refund rules. */
export function createBuildUndo(limit = 16) {
  const stack = [];
  return {
    push(batch) {
      if (!batch?.length) return stack;
      stack.push(batch.slice(0, 64));
      while (stack.length > limit) stack.shift();
      return stack;
    },
    pop() { return stack.pop() || null; },
    depth: () => stack.length,
    refund(batch) {
      const refund = {};
      (batch ?? []).forEach((e) => { if (e?.id != null) refund[e.id] = (refund[e.id] || 0) + 1; });
      return refund;
    },
  };
}

/** Item 34: build-completion milestone card. */
export function buildMilestone(edits, prevEdits) {
  const done = Number(edits) || 0;
  const before = Number(prevEdits) || 0;
  const tiers = [8, 16, 32, 64, 128];
  const crossed = tiers.find((t) => before < t && done >= t) ?? null;
  return crossed == null
    ? null
    : { tier: crossed, title: crossed === 8 ? 'First Lean-to' : crossed === 16 ? 'Solid Walls' : crossed === 32 ? 'Homestead' : crossed === 64 ? 'Hamlet' : 'Settlement', dust: true, sound: 'chime' };
}

/** Item 35: settlement progression unlocks through player projects. */
export function settlementUnlocks(state) {
  const unlocks = [];
  if ((state?.edits ?? 0) >= 32) unlocks.push({ id: 'water_cistern', label: 'Rain cistern blueprint' });
  if (state?.roofed && (state?.campfire ?? false)) unlocks.push({ id: 'smokehouse', label: 'Smokehouse station' });
  if ((state?.voyages ?? 0) >= 2) unlocks.push({ id: 'beacon', label: 'Harbor beacon kit' });
  if ((state?.observedSpecies ?? 0) >= 6) unlocks.push({ id: 'aviary', label: 'Shorebird aviary plan' });
  return unlocks;
}

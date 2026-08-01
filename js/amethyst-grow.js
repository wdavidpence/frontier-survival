/**
 * Pure amethyst cluster growth stages 0..3 (MC-breadth).
 */

export const AMETHYST_STAGE_MAX = 3;
export const AMETHYST_GROW_CHANCE = 0.2;

export function clampAmethystStage(stage) {
  const n = Math.floor(Number(stage) || 0);
  return Math.max(0, Math.min(AMETHYST_STAGE_MAX, n));
}

/**
 * Try grow one stage; returns new stage.
 * @param {number} stage
 * @param {number} [chance=AMETHYST_GROW_CHANCE]
 * @param {() => number} [rng]
 */
export function amethystTryGrow(stage, chance = AMETHYST_GROW_CHANCE, rng = Math.random) {
  const s = clampAmethystStage(stage);
  if (s >= AMETHYST_STAGE_MAX) return s;
  const c = Math.max(0, Math.min(1, Number(chance) || 0));
  const roll = typeof rng === 'function' ? rng() : Math.random();
  if (roll > c) return s;
  return s + 1;
}

export function amethystIsBudding(stage) {
  return clampAmethystStage(stage) < AMETHYST_STAGE_MAX;
}

export function amethystIsCluster(stage) {
  return clampAmethystStage(stage) >= AMETHYST_STAGE_MAX;
}

/** Drop count heuristic by stage. */
export function amethystShardDrops(stage) {
  const s = clampAmethystStage(stage);
  if (s <= 0) return 0;
  if (s === 1) return 1;
  if (s === 2) return 2;
  return 4;
}

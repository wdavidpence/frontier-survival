/**
 * Pure smoker cook-speed multiplier vs furnace (MC-breadth).
 */

export const FURNACE_COOK_TIME = 200;
export const SMOKER_SPEED_MULT = 2;

/** Smoker cook ticks for a recipe that takes furnaceTicks on a furnace. */
export function smokerCookTicks(furnaceTicks = FURNACE_COOK_TIME) {
  const t = Math.max(1, Number(furnaceTicks) || FURNACE_COOK_TIME);
  return Math.max(1, Math.floor(t / SMOKER_SPEED_MULT));
}

/** Progress advance per tick at smoker. */
export function smokerProgressStep(furnaceTicks = FURNACE_COOK_TIME) {
  return 1 / smokerCookTicks(furnaceTicks);
}

/** Whether item is food-like for smoker (name heuristic). */
export function isSmokerFood(itemName) {
  const n = String(itemName || '').toLowerCase();
  return /meat|fish|potato|beef|pork|chicken|mutton|cod|salmon|bread|pie|stew|soup/.test(n);
}

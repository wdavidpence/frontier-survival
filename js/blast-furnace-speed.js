/**
 * Pure blast-furnace ore cook speed (MC-breadth).
 */

export const FURNACE_ORE_COOK_TIME = 200;
export const BLAST_FURNACE_SPEED_MULT = 2;

export function blastFurnaceCookTicks(furnaceTicks = FURNACE_ORE_COOK_TIME) {
  const t = Math.max(1, Number(furnaceTicks) || FURNACE_ORE_COOK_TIME);
  return Math.max(1, Math.floor(t / BLAST_FURNACE_SPEED_MULT));
}

export function blastFurnaceProgressStep(furnaceTicks = FURNACE_ORE_COOK_TIME) {
  return 1 / blastFurnaceCookTicks(furnaceTicks);
}

/** Ore/armor/tool smelting heuristic. */
export function isBlastFurnaceInput(itemName) {
  const n = String(itemName || '').toLowerCase();
  return /ore|raw |iron|gold|copper|ancient|chainmail|scrap/.test(n);
}

/**
 * Pure wolf armor durability / dye stub (MC 1.21).
 */

export const WOLF_ARMOR_MAX_DUR = 64;

/**
 * @typedef {{ dur: number, color: string|null }} WolfArmor
 */

export function createWolfArmor(dur = WOLF_ARMOR_MAX_DUR, color = null) {
  return {
    dur: Math.max(0, Math.min(WOLF_ARMOR_MAX_DUR, Math.floor(Number(dur) || WOLF_ARMOR_MAX_DUR))),
    color: color == null ? null : String(color),
  };
}

export function wolfArmorDamage(armor, amount = 1) {
  const a = armor || createWolfArmor();
  a.dur = Math.max(0, a.dur - Math.max(0, amount | 0));
  return a;
}

export function wolfArmorDye(armor, color) {
  const a = armor || createWolfArmor();
  a.color = color == null ? null : String(color);
  return a;
}

export function wolfArmorBroken(armor) {
  return !armor || (armor.dur | 0) <= 0;
}

export function wolfArmorAbsorb(incomingDamage, armor) {
  if (wolfArmorBroken(armor)) return Math.max(0, Number(incomingDamage) || 0);
  // absorb half while intact
  return Math.max(0, (Number(incomingDamage) || 0) * 0.5);
}

/**
 * Equipment / clothing — warmth loadout (SC differentiator).
 * Pure logic.
 */
import { ITEM, propsOf } from './items.js?v=209';

export const EQUIP_SLOTS = ['head', 'chest', 'feet'];

export function emptyEquipment() {
  return { head: null, chest: null, feet: null };
}

/** Total warmth from equipped items */
export function equipmentWarmth(equipment) {
  if (!equipment) return 0;
  let w = 0;
  for (const slot of EQUIP_SLOTS) {
    const id = equipment[slot];
    if (id == null) continue;
    const p = propsOf(id);
    w += p?.warmth || 0;
  }
  return w;
}

/** Total armor from equipped items (reduces physical damage). */
export function equipmentArmor(equipment) {
  if (!equipment) return 0;
  let a = 0;
  for (const slot of EQUIP_SLOTS) {
    const id = equipment[slot];
    if (id == null) continue;
    const p = propsOf(id);
    a += p?.armor || 0;
  }
  return a;
}

/**
 * Reduce incoming physical damage by armor points (soft cap).
 * 1 armor ≈ 4% reduction, max 60%.
 */
export function mitigatePhysicalDamage(amount, armor) {
  if (!(amount > 0)) return 0;
  const a = Math.max(0, armor || 0);
  const factor = Math.max(0.4, 1 - Math.min(0.6, a * 0.04));
  return amount * factor;
}

/**
 * Equip item into its slot. Returns { ok, equipment, previousId }
 * Unequip if same item type already in slot and id matches held? 
 * Simple: put item into slot, return previous for inventory refund.
 */
export function equipItem(equipment, itemId) {
  const p = propsOf(itemId);
  if (!p?.equipSlot) return { ok: false, equipment, error: 'not clothing' };
  const slot = p.equipSlot;
  if (!EQUIP_SLOTS.includes(slot)) return { ok: false, equipment, error: 'bad slot' };
  const next = { ...equipment };
  const previousId = next[slot];
  next[slot] = itemId;
  return { ok: true, equipment: next, previousId, slot };
}

export function unequipSlot(equipment, slot) {
  if (!EQUIP_SLOTS.includes(slot)) return { ok: false, equipment };
  const next = { ...equipment };
  const previousId = next[slot];
  next[slot] = null;
  return { ok: true, equipment: next, previousId };
}

/**
 * Can the player sleep?
 * @returns {{ ok: boolean, error?: string }}
 */
export function canSleep(state, opts = {}) {
  if (state.dead) return { ok: false, error: 'dead' };
  if (!opts.atBed) return { ok: false, error: 'need a bed' };
  if (opts.inWater) return { ok: false, error: 'too wet' };
  if (state.hunger < 12) return { ok: false, error: 'too hungry' };
  if (state.bodyTemp < 33) return { ok: false, error: 'too cold — warm up first' };
  if (opts.stormNoRoof) return { ok: false, error: 'storm — need a roof over the bed' };
  // allow day nap if exhausted, else prefer night
  const night = opts.isNight;
  if (!night && state.sleep < 55) return { ok: false, error: 'not tired enough (wait for night)' };
  return { ok: true };
}

/**
 * Apply sleep rest results (call after time skip).
 */
export function applySleepRest(state, hours = 8) {
  const next = { ...state };
  const t = Math.min(12, Math.max(1, hours));
  next.sleep = Math.max(0, next.sleep - 12 * t);
  next.stamina = next.maxStamina;
  // slight hunger cost for sleeping
  next.hunger = Math.max(0, next.hunger - 3 * t);
  if (next.health < next.maxHealth && next.hunger > 25) {
    next.health = Math.min(next.maxHealth, next.health + 4 * t);
  }
  return next;
}

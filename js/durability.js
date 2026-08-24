/**
 * Tool durability helpers — pure.
 */
import { propsOf } from './items.js?v=250';
import { tierForItem, TIER_DURABILITY } from './tool-tiers.js?v=222';
import { cloneSlots } from './inventory.js?v=222';

export function maxDurability(id) {
  const tier = tierForItem(id);
  if (tier) return TIER_DURABILITY[tier] ?? 0;

  const p = propsOf(id);
  if (!p) return 0;
  // Rod and shield keep their explicit, item-specific durability values.
  if (p.durability != null) return p.durability;
  // Preserve the legacy name-based fallback for older pick/axe/weapon/bow data.
  if (p.tool === 'pick' || p.tool === 'axe' || p.tool === 'weapon' || p.tool === 'bow') {
    if (String(p.name || '').toLowerCase().includes('iron')) return 180;
    if (String(p.name || '').toLowerCase().includes('stone')) return 100;
    return 60;
  }
  return 0;
}

/**
 * Apply wear to hotbar tool. Returns { slots, broken, remaining }
 */
export function wearTool(slots, hotbarIndex, amount = 1) {
  const next = cloneSlots(slots);
  const s = next[hotbarIndex];
  if (!s || s.id == null) return { slots: next, broken: false, remaining: 0 };
  const max = maxDurability(s.id);
  if (!max) return { slots: next, broken: false, remaining: 0 };
  const cur = s.dur != null ? s.dur : max;
  const left = cur - amount;
  if (left <= 0) {
    next[hotbarIndex] = { id: null, count: 0 };
    return { slots: next, broken: true, remaining: 0 };
  }
  s.dur = left;
  return { slots: next, broken: false, remaining: left };
}

export function durabilityRatio(stack) {
  if (!stack || stack.id == null) return 1;
  const max = maxDurability(stack.id);
  if (!max) return 1;
  const cur = stack.dur != null ? stack.dur : max;
  return Math.max(0, Math.min(1, cur / max));
}

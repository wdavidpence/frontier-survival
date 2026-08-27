/**
 * Pure anvil repair helper (MC-breadth). Combines two tool stacks' durability.
 * Additive — no world/anvil block required for pure tests.
 */
import { maxDurability } from './durability.js?v=221';
import { propsOf } from './items.js?v=255';

/**
 * @typedef {{ id: number, count: number, dur?: number }} ToolStack
 */

/**
 * Whether two stacks can be combined on an anvil (same tool id, both tools).
 * @param {ToolStack|null|undefined} a
 * @param {ToolStack|null|undefined} b
 */
export function canAnvilRepair(a, b) {
  if (!a || !b || a.id == null || b.id == null) return false;
  if (a.id !== b.id) return false;
  if ((a.count | 0) < 1 || (b.count | 0) < 1) return false;
  const max = maxDurability(a.id);
  if (!max) return false;
  const p = propsOf(a.id);
  if (!p?.tool) return false;
  return true;
}

/**
 * Combine durability: min(max, durA + durB + floor(max*0.05)).
 * Consumes one unit from each input conceptually; returns single repaired stack.
 * @param {ToolStack} a
 * @param {ToolStack} b
 * @returns {{ ok: boolean, result?: ToolStack, error?: string }}
 */
export function anvilRepair(a, b) {
  if (!canAnvilRepair(a, b)) {
    return { ok: false, error: 'cannot repair' };
  }
  const max = maxDurability(a.id);
  const da = a.dur != null ? a.dur : max;
  const db = b.dur != null ? b.dur : max;
  const bonus = Math.floor(max * 0.05);
  const next = Math.min(max, da + db + bonus);
  return {
    ok: true,
    result: { id: a.id, count: 1, dur: next },
  };
}

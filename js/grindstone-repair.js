/**
 * Pure grindstone repair: combine durability, strip enchants (MC-breadth).
 */

/**
 * @typedef {{ id: number, count: number, dur?: number, enchants?: unknown }} ToolStack
 */

/**
 * @param {ToolStack} a
 * @param {ToolStack} b
 * @param {(id:number)=>number} maxDurFn
 */
export function canGrindstoneCombine(a, b, maxDurFn) {
  if (!a || !b || a.id == null || b.id == null) return false;
  if (a.id !== b.id) return false;
  if ((a.count | 0) < 1 || (b.count | 0) < 1) return false;
  const max = typeof maxDurFn === 'function' ? maxDurFn(a.id) : 0;
  return max > 0;
}

/**
 * Combine two tools: min(max, durA+durB), enchants cleared.
 * @returns {{ ok: boolean, result?: ToolStack, error?: string }}
 */
export function grindstoneCombine(a, b, maxDurFn) {
  if (!canGrindstoneCombine(a, b, maxDurFn)) {
    return { ok: false, error: 'cannot combine' };
  }
  const max = maxDurFn(a.id);
  const da = a.dur != null ? a.dur : max;
  const db = b.dur != null ? b.dur : max;
  return {
    ok: true,
    result: { id: a.id, count: 1, dur: Math.min(max, da + db), enchants: undefined },
  };
}

/**
 * Disenchant single tool (durability unchanged).
 */
export function grindstoneDisenchant(stack) {
  if (!stack || stack.id == null) return { ok: false, error: 'empty' };
  return {
    ok: true,
    result: { id: stack.id, count: stack.count || 1, dur: stack.dur, enchants: undefined },
  };
}

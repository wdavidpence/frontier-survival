/**
 * Pure flow armor trim pattern id (MC 1.21).
 */

export const FLOW_TRIM_ID = 'flow';
export const BOLT_TRIM_ID = 'bolt';

export const ARMOR_TRIM_PATTERNS = [
  'coast', 'dune', 'eye', 'host', 'raiser', 'rib', 'sentry', 'shaper',
  'silence', 'snout', 'spire', 'tide', 'vex', 'ward', 'wayfinder', 'wild',
  FLOW_TRIM_ID, BOLT_TRIM_ID,
];

export function isValidArmorTrim(patternId) {
  const p = String(patternId || '').toLowerCase();
  return ARMOR_TRIM_PATTERNS.includes(p);
}

/**
 * Apply trim to armor item stub.
 * @param {{ id: number, trim?: string }} item
 * @param {string} patternId
 * @param {string} [material='iron']
 */
export function applyArmorTrim(item, patternId, material = 'iron') {
  if (!item || item.id == null) return { ok: false, error: 'no item' };
  const p = String(patternId || '').toLowerCase();
  if (!isValidArmorTrim(p)) return { ok: false, error: 'bad pattern' };
  return {
    ok: true,
    result: {
      ...item,
      trim: p,
      trimMaterial: String(material || 'iron'),
    },
  };
}

export function isFlowTrim(patternId) {
  return String(patternId || '').toLowerCase() === FLOW_TRIM_ID;
}

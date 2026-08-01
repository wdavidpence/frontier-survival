/**
 * Pure smithing table upgrade stub (MC-breadth).
 */

/**
 * @typedef {{ id: number, count: number, material?: string }} GearStack
 */

/**
 * Apply template + material to base gear (ids stay; material tag upgrades).
 * @param {GearStack} base
 * @param {string} templateId
 * @param {string} materialId
 * @param {Record<string, string>} [upgradeMap] template_material -> resultMaterial
 */
export function smithingUpgrade(base, templateId, materialId, upgradeMap = {}) {
  if (!base || base.id == null) return { ok: false, error: 'no base' };
  const t = String(templateId || '');
  const m = String(materialId || '');
  if (!t || !m) return { ok: false, error: 'need template and material' };
  const key = `${t}_${m}`;
  const map = upgradeMap && typeof upgradeMap === 'object' ? upgradeMap : {};
  const resultMaterial = map[key] || m;
  return {
    ok: true,
    result: {
      id: base.id,
      count: 1,
      material: resultMaterial,
      template: t,
    },
  };
}

/** Default netherite-ish map stub. */
export const DEFAULT_SMITHING_MAP = {
  netherite_upgrade_diamond: 'netherite',
};

export function canSmithingUpgrade(base, templateId, materialId, upgradeMap = DEFAULT_SMITHING_MAP) {
  return smithingUpgrade(base, templateId, materialId, upgradeMap).ok;
}

/**
 * Pure axolotl color variants.
 */
export const AXOLOTL_VARIANTS = ['lucy', 'wild', 'gold', 'cyan', 'blue'];
export function axolotlVariant(index) {
  const i = ((index | 0) % AXOLOTL_VARIANTS.length + AXOLOTL_VARIANTS.length) % AXOLOTL_VARIANTS.length;
  return AXOLOTL_VARIANTS[i];
}
export function axolotlIsBlue(name) {
  return String(name || '').toLowerCase() === 'blue';
}
export function axolotlBlueChance() {
  return 1 / 1200;
}

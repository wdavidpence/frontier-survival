/**
 * Pure decorated pot sherds (MC archaeology).
 */

export const POT_SIDES = 4;

/**
 * @typedef {{ sides: (string|null)[] }} DecoratedPot
 */

export function createDecoratedPot(sides = null) {
  const s = Array.isArray(sides) ? sides.slice(0, POT_SIDES) : [];
  while (s.length < POT_SIDES) s.push(null);
  return { sides: s };
}

export function setPotSherd(pot, sideIndex, sherdId) {
  const p = pot || createDecoratedPot();
  const i = ((sideIndex | 0) % POT_SIDES + POT_SIDES) % POT_SIDES;
  p.sides[i] = sherdId == null ? null : String(sherdId);
  return p;
}

export function potSherdCount(pot) {
  return (pot?.sides || []).filter((x) => x != null && x !== '').length;
}

export function potIsBlank(pot) {
  return potSherdCount(pot) === 0;
}

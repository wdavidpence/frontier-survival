/**
 * Shared coconut-palm lean. Caribbean trades come from the east, so lined
 * coastal palms all curve west toward open water — never a random axis.
 */

export const PALM_WIND_DX = -1;
export const PALM_WIND_DZ = 0;
export const PALM_MAX_LEAN = 2;

export function palmTrunkOffset(i, trunkH) {
  const t = i / Math.max(1, trunkH - 1);
  return Math.round(Math.pow(t, 1.55) * PALM_MAX_LEAN);
}

export function palmTrunkAt(lx, lz, i, trunkH) {
  const offset = palmTrunkOffset(i, trunkH);
  return {
    x: lx + PALM_WIND_DX * offset,
    z: lz + PALM_WIND_DZ * offset,
  };
}

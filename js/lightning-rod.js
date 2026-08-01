/**
 * Pure lightning rod strike redirect (MC-breadth).
 */

export const LIGHTNING_ROD_RANGE = 128;

/**
 * Horizontal distance in XZ.
 */
export function horizDist(ax, az, bx, bz) {
  return Math.hypot((bx - ax), (bz - az));
}

/**
 * Whether a strike at (sx,sz) is redirected to rod at (rx,rz).
 * @param {number} sx
 * @param {number} sz
 * @param {number} rx
 * @param {number} rz
 * @param {number} [range=LIGHTNING_ROD_RANGE]
 */
export function lightningRodRedirects(sx, sz, rx, rz, range = LIGHTNING_ROD_RANGE) {
  const r = Math.max(0, Number(range) || LIGHTNING_ROD_RANGE);
  return horizDist(sx, sz, rx, rz) <= r;
}

/**
 * Pick nearest rod among candidates for a strike point.
 * @param {{x:number,z:number}} strike
 * @param {{x:number,z:number}[]} rods
 * @param {number} [range]
 * @returns {{x:number,z:number}|null}
 */
export function nearestLightningRod(strike, rods, range = LIGHTNING_ROD_RANGE) {
  const list = Array.isArray(rods) ? rods : [];
  let best = null;
  let bestD = Infinity;
  for (const rod of list) {
    if (!rod) continue;
    if (!lightningRodRedirects(strike.x, strike.z, rod.x, rod.z, range)) continue;
    const d = horizDist(strike.x, strike.z, rod.x, rod.z);
    if (d < bestD) {
      bestD = d;
      best = rod;
    }
  }
  return best;
}

/** Rod stays powered briefly after strike (ticks remaining). */
export function lightningRodPowerTicks(afterStrike = true) {
  return afterStrike ? 8 : 0;
}

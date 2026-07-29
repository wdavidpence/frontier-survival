/**
 * Environment exposure helpers — pure (SC-inspired rain/shelter/temp).
 */

/**
 * True if solid non-transparent roof within `up` blocks above head.
 * @param {(x:number,y:number,z:number)=>number} getBlock
 * @param {number} x
 * @param {number} y feet
 * @param {number} z
 * @param {(id:number)=>boolean} isSolid
 * @param {(id:number)=>boolean} isTransparent
 */
export function hasRoofAbove(getBlock, x, y, z, isSolid, isTransparent, up = 8) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const y0 = Math.floor(y + 1.6);
  for (let i = 0; i < up; i++) {
    const id = getBlock(xi, y0 + i, zi);
    if (id && isSolid(id) && !isTransparent(id)) return true;
    // leaves count as partial roof
    if (id === 7 /* LEAVES */) return true;
  }
  return false;
}

/**
 * Wetness gain per second from environment.
 */
export function wetnessGainRate({ inWater, weather, roofed, rainingHard = false }) {
  if (inWater) return 40;
  if (weather === 'rain' && !roofed) return rainingHard ? 18 : 12;
  if (weather === 'snow' && !roofed) return 6;
  return 0;
}

/**
 * Extra cold pressure when wet/outdoors in bad weather (multiplier on cold dps).
 */
export function exposureColdMult({ weather, roofed, wetness, isNight }) {
  let m = 1;
  if (!roofed && weather === 'rain') m += 0.45;
  if (!roofed && weather === 'snow') m += 0.7;
  if (wetness > 50) m += 0.35;
  if (wetness > 80) m += 0.25;
  if (isNight && !roofed) m += 0.15;
  if (roofed) m *= 0.72;
  return m;
}

/**
 * Can sleep considering storm + roof (SC: don't leave shelter in bad weather).
 */
export function stormBlocksSleep({ weather, roofed, atBed }) {
  if (!atBed) return { ok: false, error: 'need a bed' };
  if ((weather === 'rain' || weather === 'snow') && !roofed) {
    return { ok: false, error: 'storm — need a roof over the bed' };
  }
  return { ok: true };
}

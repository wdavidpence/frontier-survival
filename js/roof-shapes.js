/**
 * Pure roof / ramp shape helpers (MC-breadth). Additive; placement wire is follow-up.
 */
/** Simple ramp: lower half then rising steps along +x. */
export function rampShape(steps = 4) {
  const n = Math.max(1, steps | 0);
  const shape = [];
  for (let i = 0; i < n; i++) {
    for (let y = 0; y <= i; y++) {
      shape.push({ x: i, y, z: 0 });
    }
  }
  return shape;
}

/** Peak roof ridge: two ramps meeting at center along x. */
export function roofPeakShape(halfWidth = 3) {
  const w = Math.max(1, halfWidth | 0);
  const shape = [];
  for (let i = 0; i <= w; i++) {
    const height = w - i;
    for (let y = 0; y <= height; y++) {
      shape.push({ x: -i, y, z: 0 });
      if (i !== 0) shape.push({ x: i, y, z: 0 });
    }
  }
  return shape;
}

/** Flat roof slab ring (hollow square) at y=0. */
export function roofFlatRing(size = 4) {
  const s = Math.max(2, size | 0);
  const shape = [];
  for (let x = 0; x < s; x++) {
    for (let z = 0; z < s; z++) {
      if (x === 0 || z === 0 || x === s - 1 || z === s - 1) {
        shape.push({ x, y: 0, z });
      }
    }
  }
  return shape;
}

export function listRoofShapeNames() {
  return ['ramp', 'roofPeak', 'roofFlatRing'];
}

export function getRoofShape(name, arg) {
  if (name === 'ramp') return rampShape(arg ?? 4);
  if (name === 'roofPeak') return roofPeakShape(arg ?? 3);
  if (name === 'roofFlatRing') return roofFlatRing(arg ?? 4);
  return null;
}

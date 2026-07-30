/**
 * Mesh buffer pool — pre-allocates typed arrays for chunk mesh data.
 * Reuses buffers across rebuilds to avoid GC pressure during gameplay.
 *
 * Each "slot" holds the six arrays needed for one chunk's BufferGeometry:
 *   positions (Float32), normals (Float32), colors (Float32),
 *   uvs (Float32), tiles (Float32), indices (Uint16Array).
 *
 * Typical chunk after greedy meshing: 2–5K quads → 8–20K verts.
 * We cap at MAX_VERTS to guarantee the pool is bounded.
 */

const MAX_VERTS = 24000; // ~6K quads, enough for any single chunk
const MAX_IDX = MAX_VERTS * 4 / 3; // index count for tri-strip quads
const POOL_SIZE = 16; // slots — covers all dirty chunks in a frame

class MeshSlot {
  constructor() {
    this.positions = new Float32Array(MAX_VERTS * 3);
    this.normals = new Float32Array(MAX_VERTS * 3);
    this.colors = new Float32Array(MAX_VERTS * 4);
    this.uvs = new Float32Array(MAX_VERTS * 2);
    this.tiles = new Float32Array(MAX_VERTS);
    this.indices = new Uint16Array(MAX_IDX);
    // Current data size (number of vertices / indices actually used)
    this.vertCount = 0;
    this.indexCount = 0;
  }

  /** Reset counters for reuse. */
  reset() {
    this.vertCount = 0;
    this.indexCount = 0;
  }

  /** Append a single vertex. */
  pushVertex(px, py, pz, nx, ny, nz, r, g, b, a, u, v, tile) {
    const pi = this.vertCount * 3;
    const ci = this.vertCount * 4;
    const ui = this.vertCount * 2;
    const ti = this.vertCount;

    this.positions[pi] = px;
    this.positions[pi + 1] = py;
    this.positions[pi + 2] = pz;

    this.normals[pi] = nx;
    this.normals[pi + 1] = ny;
    this.normals[pi + 2] = nz;

    this.colors[ci] = r;
    this.colors[ci + 1] = g;
    this.colors[ci + 2] = b;
    this.colors[ci + 3] = a;

    this.uvs[ui] = u;
    this.uvs[ui + 1] = v;

    this.tiles[ti] = tile;
    this.vertCount++;
  }

  /** Append a triangle index triplet. */
  pushTriangle(i0, i1, i2) {
    const bi = this.indexCount;
    this.indices[bi] = i0;
    this.indices[bi + 1] = i1;
    this.indices[bi + 2] = i2;
    this.indexCount += 3;
  }
}

/**
 * quadsToPooledArrays — like quadsToArrays but writes directly into a MeshSlot.
 * Returns { quadCount } so the caller knows how many quads were emitted.
 */
export function quadsToPooledArrays(quads, slot) {
  let base = 0;

  for (const q of quads) {
    const n = [0, 0, 0];
    n[q.axis] = q.sign;

    const stepU = [0, 0, 0];
    const stepV = [0, 0, 0];
    stepU[q.du] = 1;
    stepV[q.dv] = 1;

    const origin = [q.bx, q.by, q.bz];
    if (q.sign > 0) origin[q.axis] += 1;

    // Winding order — same as quadsToArrays
    const wind =
      q.sign > 0
        ? [
            [0, 0],
            [0, q.h],
            [q.w, q.h],
            [q.w, 0],
          ]
        : [
            [0, 0],
            [q.w, 0],
            [q.w, q.h],
            [0, q.h],
          ];

    for (const [uu, vv] of wind) {
      slot.pushVertex(
        origin[0] + stepU[0] * uu + stepV[0] * vv,
        origin[1] + stepU[1] * uu + stepV[1] * vv,
        origin[2] + stepU[2] * uu + stepV[2] * vv,
        n[0], n[1], n[2],
        q.r, q.g, q.b, q.a,
        uu, vv,
        q.tile,
      );
    }
    slot.pushTriangle(base, base + 1, base + 2);
    slot.pushTriangle(base, base + 2, base + 3);
    base += 4;
  }

  return { quadCount: quads.length };
}


export class MeshPool {
  constructor(size = POOL_SIZE) {
    this.slots = [];
    for (let i = 0; i < size; i++) {
      this.slots.push(new MeshSlot());
    }
    this.available = new Array(size).fill(true);
    this._stats = { allocs: 0, hits: 0 };
  }

  /** Acquire a free slot. Returns null if pool exhausted (should not happen with POOL_SIZE=16). */
  acquire() {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.available[i]) {
        this.available[i] = false;
        this.slots[i].reset();
        this._stats.hits++;
        return this.slots[i];
      }
    }
    // Fallback: reuse slot 0 if all busy (should be rare — means more dirty chunks than pool size)
    this._stats.allocs++;
    this.slots[0].reset();
    return this.slots[0];
  }

  /** Release a slot back to the pool. */
  release(slot) {
    const idx = this.slots.indexOf(slot);
    if (idx >= 0) {
      this.available[idx] = true;
    }
  }

  /** Get pool stats. */
  getStats() {
    return { ...this._stats, total: this.slots.length, available: this.available.filter(Boolean).length };
  }
}

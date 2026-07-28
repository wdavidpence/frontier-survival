import * as THREE from 'three';
import { BLOCK, BLOCK_PROPS, isSolid, isTransparent, getColor } from './blocks.js';
import { heightAt, hash2, fbm } from './gen.js';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 48;
export const SEA_LEVEL = 16;

const FACES = [
  { n: [0, 1, 0], dir: 'top', corners: [[0,1,0],[1,1,0],[1,1,1],[0,1,1]], shade: 1.0 },
  { n: [0,-1,0], dir: 'bottom', corners: [[0,0,1],[1,0,1],[1,0,0],[0,0,0]], shade: 0.55 },
  { n: [0,0,1], dir: 'south', corners: [[0,0,1],[0,1,1],[1,1,1],[1,0,1]], shade: 0.8 },
  { n: [0,0,-1], dir: 'north', corners: [[1,0,0],[1,1,0],[0,1,0],[0,0,0]], shade: 0.75 },
  { n: [1,0,0], dir: 'east', corners: [[1,0,1],[1,1,1],[1,1,0],[1,0,0]], shade: 0.7 },
  { n: [-1,0,0], dir: 'west', corners: [[0,0,0],[0,1,0],[0,1,1],[0,0,1]], shade: 0.85 },
];

export class World {
  /**
   * @param {object} opts
   * @param {number} opts.seed
   * @param {number} opts.radiusChunks half-extent in chunks
   */
  constructor({ seed = 1, radiusChunks = 4 } = {}) {
    this.seed = seed;
    this.radiusChunks = radiusChunks;
    this.chunks = new Map(); // key "cx,cz" -> Uint8Array
    this.meshes = new Map(); // key -> THREE.Mesh
    this.group = new THREE.Group();
    this.dirty = new Set();
    /** @type {Map<string, number>} sparse player edits "x,y,z" -> block id */
    this.edits = new Map();
    this._genAll();
  }

  key(cx, cz) {
    return `${cx},${cz}`;
  }

  _genAll() {
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        this._generateChunk(cx, cz);
      }
    }
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        this.rebuildChunk(cx, cz);
      }
    }
  }

  _generateChunk(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = baseX + lx;
        const z = baseZ + lz;
        const h = heightAt(x, z, this.seed);
        const biomeNoise = fbm(x * 0.02 + this.seed, z * 0.02, 3);
        const cold = biomeNoise > 0.62;
        const sandy = h <= SEA_LEVEL + 2 && biomeNoise < 0.45;

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let id = BLOCK.AIR;
          if (y === 0) id = BLOCK.BEDROCK;
          else if (y > h) {
            if (y <= SEA_LEVEL) id = BLOCK.WATER;
            else id = BLOCK.AIR;
          } else if (y === h) {
            if (h < SEA_LEVEL) id = BLOCK.SAND;
            else if (sandy) id = BLOCK.SAND;
            else if (cold && h > SEA_LEVEL + 10) id = BLOCK.SNOW;
            else id = BLOCK.GRASS;
          } else if (y > h - 4) {
            id = sandy || h < SEA_LEVEL ? BLOCK.SAND : BLOCK.DIRT;
          } else {
            id = BLOCK.STONE;
            // coal veins
            if (y < h - 6 && hash2(x + y * 3, z + this.seed) > 0.97) id = BLOCK.COAL_ORE;
          }
          data[this._idx(lx, y, lz)] = id;
        }

        // trees
        if (h > SEA_LEVEL + 1 && !sandy && !cold && hash2(x + this.seed * 3, z) > 0.985) {
          this._placeTree(data, lx, h + 1, lz, baseX, baseZ);
        }
      }
    }

    this.chunks.set(this.key(cx, cz), data);
  }

  _placeTree(data, lx, y, lz) {
    const trunkH = 4 + Math.floor(hash2(lx + 11, lz + 7) * 3);
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
        data[this._idx(lx, ty, lz)] = BLOCK.LOG;
      }
    }
    const top = y + trunkH - 1;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 4) continue;
          if (dx === 0 && dz === 0 && dy <= 0) continue;
          const tx = lx + dx;
          const ty = top + dy;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0 || ty >= WORLD_HEIGHT) continue;
          const i = this._idx(tx, ty, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
        }
      }
    }
  }

  _idx(lx, y, lz) {
    return (ly => (lz * WORLD_HEIGHT + ly) * CHUNK_SIZE + lx)(y);
  }

  worldToChunk(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const lx = ((Math.floor(x) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((Math.floor(z) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { cx, cz, lx, lz };
  }

  getBlock(x, y, z) {
    y = Math.floor(y);
    if (y < 0 || y >= WORLD_HEIGHT) return y < 0 ? BLOCK.BEDROCK : BLOCK.AIR;
    const { cx, cz, lx, lz } = this.worldToChunk(x, z);
    const data = this.chunks.get(this.key(cx, cz));
    if (!data) return BLOCK.AIR;
    return data[this._idx(lx, y, lz)];
  }

  setBlock(x, y, z, id, { recordEdit = true } = {}) {
    y = Math.floor(y);
    x = Math.floor(x);
    z = Math.floor(z);
    if (y < 0 || y >= WORLD_HEIGHT) return false;
    const { cx, cz, lx, lz } = this.worldToChunk(x, z);
    const data = this.chunks.get(this.key(cx, cz));
    if (!data) return false;
    const i = this._idx(lx, y, lz);
    if (data[i] === BLOCK.BEDROCK) return false;
    data[i] = id;
    if (recordEdit) {
      this.edits.set(`${x},${y},${z}`, id);
    }
    this.markDirty(cx, cz);
    // neighbor chunk seams
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
    return true;
  }

  /** @returns {Array<[number,number,number,number]>} */
  exportEdits() {
    const out = [];
    for (const [k, id] of this.edits) {
      const [x, y, z] = k.split(',').map(Number);
      out.push([x, y, z, id]);
    }
    return out;
  }

  /**
   * Apply sparse edits after generation. Does not clear existing edits map first unless replace.
   * @param {Array<[number,number,number,number]>} edits
   * @param {{ replace?: boolean }} opts
   */
  applyEdits(edits, { replace = true } = {}) {
    if (replace) this.edits.clear();
    if (!edits || !edits.length) {
      if (replace) {
        // rebuild all if we cleared? no need — gen is pristine
      }
      return;
    }
    for (const e of edits) {
      const [x, y, z, id] = e;
      this.setBlock(x, y, z, id, { recordEdit: true });
    }
    this.flushDirty();
  }

  markDirty(cx, cz) {
    if (!this.chunks.has(this.key(cx, cz))) return;
    this.dirty.add(this.key(cx, cz));
  }

  flushDirty() {
    for (const k of this.dirty) {
      const [cx, cz] = k.split(',').map(Number);
      this.rebuildChunk(cx, cz);
    }
    this.dirty.clear();
  }

  rebuildChunk(cx, cz) {
    const k = this.key(cx, cz);
    const data = this.chunks.get(k);
    if (!data) return;

    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    let vBase = 0;

    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const id = data[this._idx(lx, y, lz)];
          if (id === BLOCK.AIR) continue;
          const props = BLOCK_PROPS[id];
          if (!props || id === BLOCK.AIR) continue;

          const wx = baseX + lx;
          const wy = y;
          const wz = baseZ + lz;

          for (const face of FACES) {
            const nx = wx + face.n[0];
            const ny = wy + face.n[1];
            const nz = wz + face.n[2];
            const nid = this.getBlock(nx, ny, nz);
            const show = id === BLOCK.WATER
              ? (nid !== BLOCK.WATER && isTransparent(nid))
              : isTransparent(nid);
            if (!show) continue;
            // don't render water faces under solid
            if (id === BLOCK.WATER && isSolid(nid)) continue;

            const col = getColor(id, face.dir);
            const shade = face.shade * (id === BLOCK.WATER ? 0.85 : 1);
            const r = col[0] * shade;
            const g = col[1] * shade;
            const b = col[2] * shade;
            const alpha = id === BLOCK.WATER ? 0.55 : (props.transparent && id !== BLOCK.LEAVES ? 0.9 : 1.0);
            // leaves slight alpha via dimmer — keep opaque for simplicity on leaves
            for (const c of face.corners) {
              positions.push(wx + c[0], wy + c[1], wz + c[2]);
              normals.push(face.n[0], face.n[1], face.n[2]);
              colors.push(r, g, b, id === BLOCK.WATER ? 0.65 : 1);
            }
            indices.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
            vBase += 4;
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    geo.setIndex(indices);
    geo.computeBoundingSphere();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.FrontSide,
    });

    let mesh = this.meshes.get(k);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = geo;
    } else {
      mesh = new THREE.Mesh(geo, mat);
      mesh.name = `chunk_${k}`;
      this.meshes.set(k, mesh);
      this.group.add(mesh);
    }
  }

  /**
   * DDA voxel raycast
   * @returns {{x:number,y:number,z:number, nx:number,ny:number,nz:number, dist:number}|null}
   */
  raycast(origin, direction, maxDist = 8) {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

    const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
    const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
    const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);

    let tMaxX = dx === 0 ? Infinity : ((stepX > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX);
    let tMaxY = dy === 0 ? Infinity : ((stepY > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY);
    let tMaxZ = dz === 0 ? Infinity : ((stepZ > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ);

    let faceX = 0, faceY = 0, faceZ = 0;
    let dist = 0;

    for (let i = 0; i < 200; i++) {
      const id = this.getBlock(x, y, z);
      if (id !== BLOCK.AIR && id !== BLOCK.WATER && BLOCK_PROPS[id]) {
        // skip non-breakable target? still hit
        if (id !== BLOCK.AIR) {
          return { x, y, z, nx: -faceX, ny: -faceY, nz: -faceZ, dist, id };
        }
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          dist = tMaxX;
          if (dist > maxDist) return null;
          x += stepX;
          tMaxX += tDeltaX;
          faceX = stepX; faceY = 0; faceZ = 0;
        } else {
          dist = tMaxZ;
          if (dist > maxDist) return null;
          z += stepZ;
          tMaxZ += tDeltaZ;
          faceX = 0; faceY = 0; faceZ = stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          dist = tMaxY;
          if (dist > maxDist) return null;
          y += stepY;
          tMaxY += tDeltaY;
          faceX = 0; faceY = stepY; faceZ = 0;
        } else {
          dist = tMaxZ;
          if (dist > maxDist) return null;
          z += stepZ;
          tMaxZ += tDeltaZ;
          faceX = 0; faceY = 0; faceZ = stepZ;
        }
      }
    }
    return null;
  }

  /** Heat contribution near a world position (campfires/torches). */
  sampleHeat(x, y, z, radius = 6) {
    let heat = 0;
    const r = Math.ceil(radius);
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    for (let dz = -r; dz <= r; dz++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const id = this.getBlock(xi + dx, yi + dy, zi + dz);
          const h = BLOCK_PROPS[id]?.heat || 0;
          if (!h) continue;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > radius) continue;
          heat += h * (1 - dist / radius);
        }
      }
    }
    return heat;
  }

  findSpawn() {
    // Prefer dry land well above sea level, near origin band
    let best = null;
    for (let i = 0; i < 400; i++) {
      const x = Math.floor((hash2(i, this.seed) - 0.5) * this.radiusChunks * CHUNK_SIZE * 1.6);
      const z = Math.floor((hash2(this.seed, i + 9) - 0.5) * this.radiusChunks * CHUNK_SIZE * 1.6);
      const h = heightAt(x, z, this.seed);
      if (h < SEA_LEVEL + 2 || h >= WORLD_HEIGHT - 6) continue;
      // surface must be solid non-water
      const surface = this.getBlock(x, h, z);
      if (surface === BLOCK.WATER || surface === BLOCK.AIR) continue;
      if (!isSolid(surface)) continue;
      const above1 = this.getBlock(x, h + 1, z);
      const above2 = this.getBlock(x, h + 2, z);
      if (above1 !== BLOCK.AIR || above2 !== BLOCK.AIR) continue;
      const candidate = { x: x + 0.5, y: h + 1.01, z: z + 0.5, h };
      // score: higher and closer to origin is better
      const score = h * 2 - Math.hypot(x, z) * 0.15;
      if (!best || score > best.score) best = { ...candidate, score };
    }
    if (best) return { x: best.x, y: best.y, z: best.z };
    return { x: 0.5, y: SEA_LEVEL + 12, z: 0.5 };
  }
}

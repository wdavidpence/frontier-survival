import * as THREE from 'three';
import { BLOCK, BLOCK_PROPS, isSolid, isTransparent, getColor } from './blocks.js?v=214';
import { heightAt, hash2, fbm } from './gen.js?v=214';
import { biomeAt, BIOME } from './biomes.js?v=214';
import { tileForBlock } from './atlas-core.js?v=214';
import { greedyMeshChunk, quadsToArrays } from './mesh-greedy.js?v=214';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 48;
export const SEA_LEVEL = 16;

export class World {
  /**
   * @param {object} opts
   * @param {number} opts.seed
   * @param {number} opts.radiusChunks half-extent in chunks
   * @param {THREE.Material} [opts.material]
   */
  constructor({ seed = 1, radiusChunks = 4, material = null } = {}) {
    this.seed = seed;
    this.radiusChunks = radiusChunks;
    this.chunks = new Map();
    this.meshes = new Map();
    this.group = new THREE.Group();
    this.dirty = new Set();
    this.edits = new Map();
    // Prefer atlas greedyMaterial (passed in). Fallback is fully opaque DoubleSide solids.
    this.material =
      material ||
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: false,
        depthWrite: true,
        side: THREE.DoubleSide,
      });
    if (this.material) {
      this.material.transparent = false;
      this.material.depthWrite = true;
      this.material.side = THREE.DoubleSide;
    }
    this._stats = { quads: 0, naiveFaces: 0 };

    // ── Chunk worker pool (stub) ───────────────────────────────────────
    this._workerPool = [];
    this._maxWorkers = Math.max(1, navigator.hardwareConcurrency - 1) || 3;
    this._workerReady = false;

    // Keep synchronous generation for now — worker path wired in _genAllAsync
    this._genAll();
  }

  /** Lazily initialise the worker pool (first call creates Blob URL workers). */
  _ensureWorkers() {
    if (this._workerReady || typeof Worker === 'undefined') return;
    this._workerReady = true;

    // Build a Blob URL from the inline chunk-worker source.
    // We read it via a fetch so we don't need to duplicate the code here.
    const workerUrl = './js/chunk-worker.js?v=214';

    for (let i = 0; i < this._maxWorkers; i++) {
      try {
        const w = new Worker(workerUrl);
        this._workerPool.push(w);
      } catch {
        // Worker not supported — fall back to sync generation (already done)
        this._workerReady = false;
        break;
      }
    }
  }

  /**
   * Generate a single chunk via the worker pool.
   * @param {number} cx
   * @param {number} cz
   * @returns {Promise<Uint8Array>}
   */
  generateChunkAsync(cx, cz) {
    this._ensureWorkers();

    // Fallback: if no workers available, generate synchronously
    if (!this._workerReady || this._workerPool.length === 0) {
      return Promise.resolve(this._generateChunkSync(cx, cz));
    }

    // Find an idle worker (simple round-robin with message queue)
    const worker = this._workerPool[cx % this._workerPool.length];

    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.error) {
          worker.removeEventListener('message', handler);
          reject(new Error(`Chunk ${cx},${cz}: ${e.data.error}`));
          return;
        }
        worker.removeEventListener('message', handler);
        resolve(e.data.data); // Uint8Array (transferred)
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ cx, cz, seed: this.seed });
    });
  }

  /** Synchronous chunk generation (used as fallback). */
  _generateChunkSync(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = baseX + lx;
        const z = baseZ + lz;
        const h = heightAt(x, z, this.seed);
        const biome = biomeAt(x, z, this.seed);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let id = BLOCK.AIR;
          if (y === 0) id = BLOCK.BEDROCK;
          else if (y > h) {
            if (y <= SEA_LEVEL) id = BLOCK.WATER;
            else id = BLOCK.AIR;
          } else if (y === h) {
            if (biome === BIOME.SHORE || biome === BIOME.DESERT) id = BLOCK.SAND;
            else if (biome === BIOME.TUNDRA) id = BLOCK.SNOW;
            else id = BLOCK.GRASS;
          } else if (y > h - 4) {
            if (biome === BIOME.DESERT || biome === BIOME.SHORE) id = BLOCK.SAND;
            else id = BLOCK.DIRT;
          } else {
            id = BLOCK.STONE;
            if (y < h - 6 && hash2(x + y * 3, z + this.seed) > 0.97) id = BLOCK.COAL_ORE;
            if (y < h - 10 && y > 4 && hash2(x * 2 + y, z + this.seed * 5) > 0.985) id = BLOCK.IRON_ORE;
            if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + this.seed * 3) > 0.982) id = BLOCK.CLAY_DEEP_ORE;
            if (y >= 3 && y <= h - 5) {
              if (hash2(x + y * 7, z + this.seed * 3) > 0.991) id = BLOCK.AIR;
            }
          }
          data[this._idx(lx, y, lz)] = id;
        }

        if (h > SEA_LEVEL + 1) {
          const th = hash2(x * 3 + (this.seed | 0), z * 5 + 19);
          let treeChance = 0;
          if (biome === BIOME.FOREST) treeChance = 0.08;
          else if (biome === BIOME.SHORE) treeChance = 0.012;
          else if (biome === BIOME.TUNDRA) treeChance = 0.02;
          if (th > 1 - treeChance) {
            // Tree species selection by biome
            const sequoiaRoll = hash2(x + 73, z * 2 + (this.seed | 0));
            const spruceRoll = hash2(x * 5 + 17, z * 3 + (this.seed | 0));
            if (biome === BIOME.TUNDRA && spruceRoll > 0.15) {
              // Tundra: ~85% spruce, fallback to oak for the rest
              this._placeSpruce(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && sequoiaRoll > 0.97) {
              this._placeSequoia(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && spruceRoll > 0.85) {
              // Forest: ~15% of non-sequoia trees are spruce
              this._placeSpruce(data, lx, h + 1, lz);
            } else {
              this._placeTree(data, lx, h + 1, lz);
            }
          }
        }
        if (
          (biome === BIOME.FOREST || biome === BIOME.SHORE) &&
          h > SEA_LEVEL + 1 &&
          data[this._idx(lx, h, lz)] === BLOCK.GRASS &&
          data[this._idx(lx, h + 1, lz)] === BLOCK.AIR &&
          hash2(x + 91, z * 3 + (this.seed | 0)) > 0.94
        ) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.BUSH;
        }
        if (biome === BIOME.SHORE || (h >= SEA_LEVEL && h <= SEA_LEVEL + 3 && biome !== BIOME.TUNDRA)) {
          if (hash2(x + 33, z + this.seed) > 0.93) {
            const surface = data[this._idx(lx, h, lz)];
            if (surface === BLOCK.GRASS || surface === BLOCK.DIRT || surface === BLOCK.SAND) {
              data[this._idx(lx, h, lz)] = BLOCK.CLAY;
            }
          }
        }
      }
    }

    this._carveLavaTubesSync(data, baseX, baseZ);
    return data;
  }

  /** Synchronous lava tube carving (fallback). */
  _carveLavaTubesSync(data, baseX, baseZ) {
    const tubeY = 4;
    const tubeRadius = 2;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;

        const tubeCenterX = fbm(wx * 0.04 + this.seed * 17, wz * 0.04 + this.seed * 31, 2);
        const tubeCenterZ = fbm(wx * 0.04 + this.seed * 43, wz * 0.04 + this.seed * 59, 2);

        const tubeLx = (tubeCenterX * CHUNK_SIZE) % CHUNK_SIZE;
        const tubeLz = (tubeCenterZ * CHUNK_SIZE) % CHUNK_SIZE;

        const dx = lx - tubeLx;
        const dz = lz - tubeLz;
        const dist2d = Math.sqrt(dx * dx + dz * dz);

        const tubePresence = hash2(wx + this.seed * 7, wz + this.seed * 13);
        if (tubePresence < 0.85) continue;

        if (dist2d < tubeRadius) {
          const yTop = tubeY + Math.floor(hash2(wx, wz + this.seed * 5) * 3);
          const lavaLevel = tubeY;

          for (let y = lavaLevel; y <= yTop && y < WORLD_HEIGHT - 1; y++) {
            const i = this._idx(lx, y, lz);
            const block = data[i];
            if (block === BLOCK.STONE || block === BLOCK.DIRT) {
              if (y === lavaLevel) data[i] = BLOCK.LAVA;
              else if (y < yTop) data[i] = BLOCK.AIR;
            }
          }
        }
      }
    }
  }

  /** Async version of _genAll — generates all chunks in parallel via workers. */
  async _genAllAsync() {
    const tasks = [];
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        tasks.push(this.generateChunkAsync(cx, cz).then((data) => ({ cx, cz, data })));
      }
    }

    const results = await Promise.all(tasks);
    for (const { cx, cz, data } of results) {
      this.chunks.set(this.key(cx, cz), data);
    }

    // Now rebuild meshes for all chunks
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        this.rebuildChunk(cx, cz);
      }
    }
  }

  /** Dispose worker pool. */
  disposeWorkers() {
    for (const w of this._workerPool) {
      try { w.terminate(); } catch {}
    }
    this._workerPool = [];
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
        const biome = biomeAt(x, z, this.seed);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let id = BLOCK.AIR;
          if (y === 0) id = BLOCK.BEDROCK;
          else if (y > h) {
            if (y <= SEA_LEVEL) id = BLOCK.WATER;
            else id = BLOCK.AIR;
          } else if (y === h) {
            // Biome-driven surface block
            if (biome === BIOME.SHORE) id = BLOCK.SAND;
            else if (biome === BIOME.DESERT) id = BLOCK.SAND;
            else if (biome === BIOME.TUNDRA) id = BLOCK.SNOW;
            else id = BLOCK.GRASS; // FOREST default
          } else if (y > h - 4) {
            // Sub-surface follows biome: desert/shore → sand, tundra → dirt, else dirt
            if (biome === BIOME.DESERT || biome === BIOME.SHORE) id = BLOCK.SAND;
            else id = BLOCK.DIRT;
          } else {
            id = BLOCK.STONE;
            // coal veins
            if (y < h - 6 && hash2(x + y * 3, z + this.seed) > 0.97) id = BLOCK.COAL_ORE;
            // iron deeper
            if (y < h - 10 && y > 4 && hash2(x * 2 + y, z + this.seed * 5) > 0.985) id = BLOCK.IRON_ORE;
            // deep clay ore veins (y <= 8, hash2-safe density)
            if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + this.seed * 3) > 0.982) id = BLOCK.CLAY_DEEP_ORE;
            // caves
            if (y >= 3 && y <= h - 5) {
              if (hash2(x + y * 7, z + this.seed * 3) > 0.991) id = BLOCK.AIR;
            }
          }
          data[this._idx(lx, y, lz)] = id;
        }

        // trees — dense in forest, sparse in shore scrub / tundra pines
        if (h > SEA_LEVEL + 1) {
          const th = hash2(x * 3 + (this.seed | 0), z * 5 + 19);
          let treeChance = 0;
          if (biome === BIOME.FOREST) treeChance = 0.08; // ~8% of surface cells
          else if (biome === BIOME.SHORE) treeChance = 0.012;
          else if (biome === BIOME.TUNDRA) treeChance = 0.02;
          if (th > 1 - treeChance) {
            // Tree species selection by biome
            const sequoiaRoll = hash2(x + 73, z * 2 + (this.seed | 0));
            const spruceRoll = hash2(x * 5 + 17, z * 3 + (this.seed | 0));
            if (biome === BIOME.TUNDRA && spruceRoll > 0.15) {
              // Tundra: ~85% spruce, fallback to oak for the rest
              this._placeSpruce(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && sequoiaRoll > 0.97) {
              this._placeSequoia(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && spruceRoll > 0.85) {
              // Forest: ~15% of non-sequoia trees are spruce
              this._placeSpruce(data, lx, h + 1, lz);
            } else {
              this._placeTree(data, lx, h + 1, lz);
            }
          }
        }
        // berry bushes on grass surface — forest mainly
        if (
          (biome === BIOME.FOREST || biome === BIOME.SHORE) &&
          h > SEA_LEVEL + 1 &&
          data[this._idx(lx, h, lz)] === BLOCK.GRASS &&
          data[this._idx(lx, h + 1, lz)] === BLOCK.AIR &&
          hash2(x + 91, z * 3 + (this.seed | 0)) > 0.94
        ) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.BUSH;
        }

        // clay deposits near shore biome
        if (biome === BIOME.SHORE || (h >= SEA_LEVEL && h <= SEA_LEVEL + 3 && biome !== BIOME.TUNDRA)) {
          if (hash2(x + 33, z + this.seed) > 0.93) {
            const surface = data[this._idx(lx, h, lz)];
            if (surface === BLOCK.GRASS || surface === BLOCK.DIRT || surface === BLOCK.SAND) {
              data[this._idx(lx, h, lz)] = BLOCK.CLAY;
            }
          }
        }
      }
    }

    // Lava tube generation — carve tubular passages deep underground, fill with lava
    this._carveLavaTubes(data, baseX, baseZ);

    this.chunks.set(this.key(cx, cz), data);
  }

  /**
   * Lava tube generation — carved tubular passages deep underground filled with lava.
   * Uses 3D noise-based tunnel routing: center path determined by fbm drift, with
   * variable radius. Lava pools at the bottom of each tube segment.
   */
  _carveLavaTubes(data, baseX, baseZ) {
    const tubeY = 4; // Deep underground level (above bedrock at y=0)
    const tubeRadius = 2; // Half-width of the tunnel

    // For each column, compute a tube path through this chunk
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;

        // Deterministic check: does a lava tube pass near this position?
        // Use fbm to create the tube centerline offset at depth tubeY
        const tubeCenterX = fbm(wx * 0.04 + this.seed * 17, wz * 0.04 + this.seed * 31, 2);
        const tubeCenterZ = fbm(wx * 0.04 + this.seed * 43, wz * 0.04 + this.seed * 59, 2);

        // Map [0,1) to chunk-relative position
        const tubeLx = (tubeCenterX * CHUNK_SIZE) % CHUNK_SIZE;
        const tubeLz = (tubeCenterZ * CHUNK_SIZE) % CHUNK_SIZE;

        // Distance from this block to the tube center
        const dx = lx - tubeLx;
        const dz = lz - tubeLz;
        const dist2d = Math.sqrt(dx * dx + dz * dz);

        // Tube presence check — sparse enough to be interesting
        const tubePresence = hash2(wx + this.seed * 7, wz + this.seed * 13);
        if (tubePresence < 0.85) continue; // Only ~15% of columns host a tube

        if (dist2d < tubeRadius) {
          // Carve through stone, fill with lava at bottom level
          const yTop = tubeY + Math.floor(hash2(wx, wz + this.seed * 5) * 3);
          const lavaLevel = tubeY;

          for (let y = lavaLevel; y <= yTop && y < WORLD_HEIGHT - 1; y++) {
            const i = this._idx(lx, y, lz);
            const block = data[i];
            // Carve stone/dirt; don't overwrite bedrock
            if (block === BLOCK.STONE || block === BLOCK.DIRT) {
              if (y === lavaLevel) {
                data[i] = BLOCK.LAVA; // Lava floor
              } else if (y < yTop) {
                data[i] = BLOCK.AIR; // Carved ceiling/air space
              }
            }
          }

          // Edge glow reserved for future light bleed; lava BLOCK_PROPS.light handles emission.
        }
      }
    }
  }

  _placeTree(data, lx, y, lz) {
    // Variable height canopy (Minecraft-ish oak)
    const trunkH = 4 + Math.floor(hash2(lx + 11, lz + 7) * 4); // 4-7
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
        data[this._idx(lx, ty, lz)] = BLOCK.LOG;
      }
    }
    const top = y + trunkH - 1;
    const radius = 2 + (hash2(lx + 3, lz + 9) > 0.55 ? 1 : 0);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
          if (dist > radius + 1) continue;
          if (dx === 0 && dz === 0 && dy < 0) continue; // keep trunk
          // thinner top layer
          if (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
          const tx = lx + dx;
          const ty = top + dy;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0 || ty >= WORLD_HEIGHT) continue;
          const i = this._idx(tx, ty, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
        }
      }
    }
    // canopy peak
    const peak = top + 3;
    if (peak < WORLD_HEIGHT && lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
      const i = this._idx(lx, peak, lz);
      if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
    }
  }

  /** Place a massive sequoia — thick trunk, tall, reddish canopy. */
  _placeSequoia(data, lx, y, lz) {
    const trunkH = 8 + Math.floor(hash2(lx + 41, lz + 37) * 5); // 8-12
    const thick = hash2(lx + 53, lz + 61) > 0.4; // ~60% chance of 2x2 base
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      // Main trunk column
      this._setAir(data, lx, ty, lz, BLOCK.SEQUOIA_LOG);
      // Thick base: 2x2 bottom + occasional flare near top
      if (thick) {
        this._setAir(data, lx + 1, ty, lz, BLOCK.SEQUOIA_LOG);
        this._setAir(data, lx, ty, lz + 1, BLOCK.SEQUOIA_LOG);
        this._setAir(data, lx + 1, ty, lz + 1, BLOCK.SEQUOIA_LOG);
      } else if (i < 2) {
        // Narrow flare at very bottom for thin variants
        this._setAir(data, lx + 1, ty, lz, BLOCK.SEQUOIA_LOG);
      }
    }
    // Massive canopy: wide ellipsoid near the top, reddish-green foliage
    const canopyBase = y + trunkH - 2;
    const rXZ = thick ? 3 : 2;
    for (let dy = -1; dy <= 3; dy++) {
      for (let dx = -rXZ; dx <= rXZ; dx++) {
        for (let dz = -rXZ; dz <= rXZ; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz);
          if (dist > rXZ + 1) continue;
          // Shrink top/bottom layers for rounded shape
          if (dy === 3 && dist > rXZ) continue;
          if (dy === -1 && dist > rXZ - 1) continue;
          const tx = lx + dx;
          const ty = canopyBase + dy;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0 || ty >= WORLD_HEIGHT) continue;
          const i = this._idx(tx, ty, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.SEQUOIA_LEAVES;
        }
      }
    }
  }

  /** Place a spruce tree — tall narrow cone, dark pine tones. */
  _placeSpruce(data, lx, y, lz) {
    const trunkH = 5 + Math.floor(hash2(lx + 71, lz + 59) * 3); // 5-7
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      this._setAir(data, lx, ty, lz, BLOCK.SPRUCE_LOG);
    }
    // Conical canopy: wide at bottom, narrow point at top — stacked diamond layers
    const canopyStart = y + Math.max(1, trunkH - 3);
    const layers = 3 + Math.floor(hash2(lx + 13, lz + 29) * 2); // 3-4 layers
    for (let layer = 0; layer < layers; layer++) {
      const cy = canopyStart + layer;
      if (cy >= WORLD_HEIGHT) break;
      // Radius shrinks as we go up: start at 3, end at 1
      const r = Math.max(1, 3 - layer);
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz);
          if (dist > r) continue;
          const tx = lx + dx;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) continue;
          const i = this._idx(tx, cy, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.SPRUCE_LEAVES;
        }
      }
    }
    // Top cap
    const topY = canopyStart + layers;
    this._setAir(data, lx, topY, lz, BLOCK.SPRUCE_LEAVES);
  }

  /** Helper: set block only if in-bounds. */
  _setAir(data, lx, ty, lz, block) {
    if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ty >= 0 && ty < WORLD_HEIGHT) {
      data[this._idx(lx, ty, lz)] = block;
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

    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    const getBlock = (x, y, z) => this.getBlock(x, y, z);
    const quads = greedyMeshChunk({
      getBlock,
      tileFor: tileForBlock,
      colorFor: getColor,
      isTransparent,
      isSolid,
      baseX,
      baseY: 0,
      baseZ,
      sizeX: CHUNK_SIZE,
      sizeY: WORLD_HEIGHT,
      sizeZ: CHUNK_SIZE,
      waterId: BLOCK.WATER,
    });
    const arrays = quadsToArrays(quads);
    this._stats.quads = (this._stats.quads || 0) + arrays.quadCount;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arrays.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(arrays.colors, 4));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uvs, 2));
    geo.setAttribute('tile', new THREE.Float32BufferAttribute(arrays.tiles, 1));
    geo.setIndex(arrays.indices);
    geo.computeBoundingSphere();

    let mesh = this.meshes.get(k);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = geo;
      mesh.material = this.material;
    } else {
      mesh = new THREE.Mesh(geo, this.material);
      mesh.name = `chunk_${k}`;
      this.meshes.set(k, mesh);
      this.group.add(mesh);
    }
  }

  meshStats() {
    let verts = 0;
    let tris = 0;
    for (const m of this.meshes.values()) {
      const pos = m.geometry?.getAttribute('position');
      const idx = m.geometry?.index;
      if (pos) verts += pos.count;
      if (idx) tris += idx.count / 3;
    }
    return { chunks: this.meshes.size, verts, tris };
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

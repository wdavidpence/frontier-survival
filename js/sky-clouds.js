/**
 * Simple voxel cloud layer: sparse, camera-relative clusters of small
 * overlapping box "voxels" that read as Minecraft-like cloud puffs
 * drifting slowly overhead without becoming a horizon occluder.
 */
import * as THREE from 'three';

const CLOUD_Y = 42;
const CLUSTER_CELL = 20;
const CLUSTER_GRID = 9;
const VOXEL_SPACING = 3.2;
const VOXEL_W = 3.6;
const VOXEL_H = 2.4;
const VOXEL_D = 3.6;
const DRIFT_SPEED = 0.35;

// Small relative voxel offsets (in voxel units) per cluster template so each
// cloud bank reads as a blocky, irregular puff rather than a uniform slab.
const TEMPLATES = [
  [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1], [0, 1, 0], [1, 1, 0]],
  [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0]],
  [[0, 0, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [0, 1, 1]],
  [[0, 0, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 1, 0], [1, 0, 1]],
];
const MAX_VOXELS = 6;

export class VoxelCloudLayer {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._t = 0;

    const count = CLUSTER_GRID * CLUSTER_GRID * MAX_VOXELS;
    const geo = new THREE.BoxGeometry(VOXEL_W, VOXEL_H, VOXEL_D);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.renderOrder = -50;
    this.mesh.frustumCulled = false;

    // deterministic pseudo-random layout so the layer reads as clusters of
    // puffs with gaps of sky between banks, not a solid sheet
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    this._active = [];
    this._x = [];
    this._y = [];
    this._z = [];
    this._scale = [];
    let i = 0;
    for (let gx = 0; gx < CLUSTER_GRID; gx++) {
      for (let gz = 0; gz < CLUSTER_GRID; gz++) {
        const show = rand() < 0.4;
        const template = TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
        const clusterJitterX = (rand() - 0.5) * VOXEL_SPACING * 0.6;
        const clusterJitterZ = (rand() - 0.5) * VOXEL_SPACING * 0.6;
        const baseHeight = -1.5 + rand() * 3;

        for (let slot = 0; slot < MAX_VOXELS; slot++) {
          const active = show && slot < template.length;
          let lx = 0;
          let ly = 0;
          let lz = 0;
          let scale = 1;
          if (active) {
            const [dx, dy, dz] = template[slot];
            lx = dx * VOXEL_SPACING + clusterJitterX + (rand() - 0.5) * 0.6;
            ly = dy * VOXEL_H * 0.7 + baseHeight;
            lz = dz * VOXEL_SPACING + clusterJitterZ + (rand() - 0.5) * 0.6;
            scale = 0.85 + rand() * 0.3;
          }
          this._active.push(active);
          this._x.push(lx);
          this._y.push(ly);
          this._z.push(lz);
          this._scale.push(scale);
          i++;
        }
      }
    }
    this._layout(0, 0, 0);
    this.scene.add(this.mesh);
  }

  _layout(anchorX, anchorZ, offset) {
    const dummy = new THREE.Object3D();
    const half = CLUSTER_GRID / 2;
    let i = 0;
    for (let gx = 0; gx < CLUSTER_GRID; gx++) {
      for (let gz = 0; gz < CLUSTER_GRID; gz++) {
        const clusterX = anchorX + (gx - half) * CLUSTER_CELL + offset;
        const clusterZ = anchorZ + (gz - half) * CLUSTER_CELL;
        for (let slot = 0; slot < MAX_VOXELS; slot++) {
          const active = this._active[i];
          const scale = active ? this._scale[i] : 0;
          dummy.position.set(
            clusterX + this._x[i],
            CLOUD_Y + this._y[i],
            clusterZ + this._z[i]
          );
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
          i++;
        }
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * @param {number} dt seconds elapsed
   */
  update(dt, camera) {
    this._t += dt * DRIFT_SPEED;
    const offset = this._t % (CLUSTER_GRID * CLUSTER_CELL);
    const anchorX = camera?.position.x || 0;
    const anchorZ = camera?.position.z || 0;
    this._layout(anchorX, anchorZ, offset);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

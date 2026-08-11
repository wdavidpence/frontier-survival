/**
 * Simple voxel cloud layer: a sparse, camera-relative grid of overlapping
 * box "puffs" drifting slowly overhead without becoming a horizon occluder.
 */
import * as THREE from 'three';

const CLOUD_Y = 40;
const CELL = 12;
const GRID = 16;
const DRIFT_SPEED = 0.35;

export class VoxelCloudLayer {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._t = 0;

    const count = GRID * GRID;
    const geo = new THREE.BoxGeometry(CELL * 1.35, 1.8, CELL * 1.05);
    const mat = new THREE.MeshLambertMaterial({
      color: 0xf6f1e5,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.renderOrder = -50;
    this.mesh.frustumCulled = false;

    const dummy = new THREE.Object3D();
    let i = 0;
    // deterministic pseudo-random coverage so the layer reads as clouds, not a solid sheet
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    this._active = [];
    this._scale = [];
    this._height = [];
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const show = rand() < 0.38;
        const scale = 0.72 + rand() * 0.62;
        const height = -1.2 + rand() * 2.4;
        this._active.push(show);
        this._scale.push(scale);
        this._height.push(height);
        dummy.position.set((gx - GRID / 2) * CELL, CLOUD_Y + height, (gz - GRID / 2) * CELL);
        dummy.scale.set(show ? scale : 0, show ? 0.8 + scale * 0.3 : 0, show ? scale : 0);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.mesh);
  }

  /**
   * @param {number} dt seconds elapsed
   */
  update(dt, camera) {
    this._t += dt * DRIFT_SPEED;
    const dummy = new THREE.Object3D();
    const offset = this._t % (GRID * CELL);
    const anchorX = camera?.position.x || 0;
    const anchorZ = camera?.position.z || 0;
    let i = 0;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const show = this._active[i];
        const x = anchorX + (gx - GRID / 2) * CELL + offset;
        const z = anchorZ + (gz - GRID / 2) * CELL;
        const scale = this._scale[i];
        dummy.position.set(x, CLOUD_Y + this._height[i], z);
        dummy.scale.set(show ? scale : 0, show ? 0.8 + scale * 0.3 : 0, show ? scale : 0);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

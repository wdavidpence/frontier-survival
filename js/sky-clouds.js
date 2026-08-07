/**
 * Simple voxel cloud layer: a sparse grid of flat box "puffs" drifting
 * slowly at a fixed height above the world.
 */
import * as THREE from 'three';

const CLOUD_Y = 128;
const CELL = 8;
const GRID = 18;
const DRIFT_SPEED = 0.35;

export class VoxelCloudLayer {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._t = 0;

    const count = GRID * GRID;
    const geo = new THREE.BoxGeometry(CELL * 0.82, 2.2, CELL * 0.82);
    const mat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
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
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const show = rand() < 0.35;
        this._active.push(show);
        dummy.position.set((gx - GRID / 2) * CELL, CLOUD_Y, (gz - GRID / 2) * CELL);
        dummy.scale.setScalar(show ? 1 : 0);
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
  update(dt) {
    this._t += dt * DRIFT_SPEED;
    const dummy = new THREE.Object3D();
    const offset = this._t % (GRID * CELL);
    let i = 0;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const show = this._active[i];
        const x = (gx - GRID / 2) * CELL + offset;
        dummy.position.set(x, CLOUD_Y, (gz - GRID / 2) * CELL);
        dummy.scale.setScalar(show ? 1 : 0);
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

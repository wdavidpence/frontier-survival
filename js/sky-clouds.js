/**
 * Improved voxel cloud layer with rounded volumetric puffs, height variation,
 * day/night light response, and ambient atmospheric particles (fireflies/dust motes).
 */
import * as THREE from 'three';

const CLOUD_Y = 128;
const CELL = 8;
const GRID = 22;
const DRIFT_SPEED = 0.2;

const AMBIENT_PARTICLE_COUNT = 120;

export class VoxelCloudLayer {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._t = 0;

    const count = GRID * GRID;
    const geo = new THREE.SphereGeometry(4, 8, 6);
    const mat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
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
    this._heights = [];

    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const show = rand() < 0.45;
        this._active.push(show);
        const h = rand() * 4 - 2;
        this._heights.push(h);

        dummy.position.set((gx - GRID / 2) * CELL, CLOUD_Y + h, (gz - GRID / 2) * CELL);
        dummy.scale.setScalar(show ? 1 : 0);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.mesh);

    // Init ambient atmospheric particles (fireflies / dust motes)
    this._initAmbientParticles();
  }

  _initAmbientParticles() {
    this._particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(AMBIENT_PARTICLE_COUNT * 3);
    this._particleData = [];

    for (let p = 0; p < AMBIENT_PARTICLE_COUNT; p++) {
      const bx = (Math.random() - 0.5) * 80;
      const by = 4 + Math.random() * 30;
      const bz = (Math.random() - 0.5) * 80;
      positions[p * 3] = bx;
      positions[p * 3 + 1] = by;
      positions[p * 3 + 2] = bz;

      this._particleData.push({
        baseX: bx,
        baseY: by,
        baseZ: bz,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        pulseSpeed: 1.5 + Math.random() * 2.0,
      });
    }

    this._particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._particleMat = new THREE.PointsMaterial({
      color: 0xffff88,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.ambientParticles = new THREE.Points(this._particleGeo, this._particleMat);
    this.ambientParticles.renderOrder = -10;
    this.scene.add(this.ambientParticles);
  }

  _updateAmbientParticles(dt, sunIntensity) {
    if (!this.ambientParticles) return;

    const positions = this._particleGeo.attributes.position.array;
    const isNight = sunIntensity < 0.55;
    const nightFactor = 1 - Math.min(1, sunIntensity / 0.55);

    // Color: Warm yellow-green fireflies at night vs golden-white dust motes during day
    if (isNight) {
      // Fireflies: glowing greenish yellow
      const pulse = 0.5 + 0.5 * Math.sin(this._t * 3 + nightFactor);
      this._particleMat.color.setRGB(0.7 + pulse * 0.2, 0.95, 0.25);
      this._particleMat.opacity = (0.4 + pulse * 0.5) * (0.4 + nightFactor * 0.6);
      this._particleMat.size = 0.38;
    } else {
      // Dust motes: soft subtle golden-white
      this._particleMat.color.setRGB(0.95, 0.90, 0.75);
      this._particleMat.opacity = 0.25 * sunIntensity;
      this._particleMat.size = 0.25;
    }

    for (let p = 0; p < AMBIENT_PARTICLE_COUNT; p++) {
      const data = this._particleData[p];
      data.phase += dt * data.speed;

      // Gentle floating bobbing motion
      positions[p * 3] = data.baseX + Math.sin(data.phase * 0.7) * 2.5;
      positions[p * 3 + 1] = data.baseY + Math.cos(data.phase * 1.1) * 1.2;
      positions[p * 3 + 2] = data.baseZ + Math.cos(data.phase * 0.6) * 2.5;
    }

    this._particleGeo.attributes.position.needsUpdate = true;
  }

  /**
   * @param {number} dt seconds elapsed
   * @param {number} [sunIntensity=1] 0..1 daylight level for cloud coloring
   */
  update(dt, sunIntensity = 1) {
    this._t += dt * DRIFT_SPEED;
    const dummy = new THREE.Object3D();
    const offset = this._t % (GRID * CELL);
    let i = 0;

    // Cloud color shifts with time of day
    const cloudBrightness = 0.3 + sunIntensity * 0.7; // 0.3 at night, 1.0 at noon
    this.mesh.material.color.setRGB(
      cloudBrightness * 0.95,
      cloudBrightness * 0.95,
      cloudBrightness * 0.98
    );
    this.mesh.material.opacity = 0.5 + sunIntensity * 0.2; // more visible in day

    for (let gx = 0; gx < GRID; gx++) {
      for (let gz = 0; gz < GRID; gz++) {
        const show = this._active[i];
        const x = (gx - GRID / 2) * CELL + offset;
        const y = CLOUD_Y + (this._heights[i] || 0);
        dummy.position.set(x, y, (gz - GRID / 2) * CELL);
        dummy.scale.setScalar(show ? 1 : 0);
        dummy.updateMatrix();
        this.mesh.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    // Update ambient atmospheric particles
    this._updateAmbientParticles(dt, sunIntensity);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();

    if (this.ambientParticles) {
      this.scene.remove(this.ambientParticles);
      this._particleGeo.dispose();
      this._particleMat.dispose();
    }
  }
}

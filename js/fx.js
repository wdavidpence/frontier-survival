/**
 * Break/hit visual juice: crack overlay + debris particles.
 */
import * as THREE from 'three';
import { crackTileForProgress, tileUVs } from './atlas-core.js?v=293';

export class BreakFX {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./atlas.js').createBlockAtlas extends Function} atlas
   */
  constructor(scene, atlas) {
    this.scene = scene;
    this.atlas = atlas;
    this.crackMesh = null;
    this.particles = [];
    this._crackGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    /** @type {THREE.Mesh|null} */
    this._flashMesh = null;
    /** @type {THREE.BufferGeometry} */
    this._flashGeo = new THREE.SphereGeometry(0.35, 6, 4);
    /** @type {THREE.Material} */
    this._flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this._flashMesh = new THREE.Mesh(this._flashGeo, this._flashMat);
    this._flashMesh.visible = false;
    this.scene.add(this._flashMesh);
  }

  /**
   * @param {{x:number,y:number,z:number}|null} block
   * @param {number} progress 0..1
   */
  setCrack(block, progress) {
    if (!block || progress <= 0.02) {
      this.hideCrack();
      return;
    }
    if (!this.crackMesh) {
      this.crackMesh = new THREE.Mesh(this._crackGeo, this.atlas.crackMaterial.clone());
      this.crackMesh.renderOrder = 2;
      this.scene.add(this.crackMesh);
    }
    this.crackMesh.visible = true;
    this.crackMesh.position.set(block.x + 0.5, block.y + 0.5, block.z + 0.5);
    const tile = crackTileForProgress(progress);
    const uvs = tileUVs(tile);
    // full box uses same UV on all faces via simple approach: update material map offset/repeat for one tile
    const mat = this.crackMesh.material;
    const n = 8;
    const tx = tile % n;
    const ty = (tile / n) | 0;
    mat.map = this.atlas.texture;
    mat.map.offset.set(tx / n, 1 - (ty + 1) / n);
    mat.map.repeat.set(1 / n, 1 / n);
    // cloning texture state is shared — use UV on geometry instead
    mat.map.offset.set(0, 0);
    mat.map.repeat.set(1, 1);
    this._applyBoxUVs(this.crackMesh.geometry, uvs);
    mat.opacity = 0.85;
    mat.transparent = true;
    mat.needsUpdate = true;
  }

  _applyBoxUVs(geo, faceUV) {
    // BoxGeometry groups 6 faces × 4 verts; assign same face UV pattern
    const uvAttr = geo.getAttribute('uv');
    if (!uvAttr) return;
    for (let f = 0; f < 6; f++) {
      for (let i = 0; i < 4; i++) {
        const idx = f * 4 + i;
        // box face UV order differs slightly; cycle
        const u = faceUV[i][0];
        const v = faceUV[i][1];
        uvAttr.setXY(idx, u, v);
      }
    }
    uvAttr.needsUpdate = true;
  }

  hideCrack() {
    if (this.crackMesh) this.crackMesh.visible = false;
  }

  /**
   * Burst colored debris at block center.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {[number,number,number]} color
   * @param {number} count
   */
  burst(x, y, z, color = [0.5, 0.5, 0.5], count = 10) {
    const cx = x + 0.5;
    const cy = y + 0.5;
    const cz = z + 0.5;

    // Hard cap to prevent runaway particle counts
    const capped = Math.min(count, 24);

    // Brief impact flash for camera readability
    this._flashMesh.position.set(cx, cy, cz);
    this._flashMesh.visible = true;
    this._flashMat.opacity = 0.9;
    // Tint flash toward block color but keep it bright
    this._flashMat.color.setRGB(
      Math.min(1, color[0] + 0.5),
      Math.min(1, color[1] + 0.5),
      Math.min(1, color[2] + 0.5)
    );
    this._flashLife = 0.12;

    for (let i = 0; i < capped; i++) {
      // Two size tiers: ~60% small, ~40% medium for silhouette variety
      const isMedium = Math.random() < 0.4;
      const size = isMedium ? 0.1 + Math.random() * 0.08 : 0.05 + Math.random() * 0.06;
      const geo = new THREE.BoxGeometry(size, size, size);

      // Color jitter: ±15% per channel for varied debris look
      const r = Math.max(0, Math.min(1, color[0] + (Math.random() - 0.5) * 0.3));
      const g = Math.max(0, Math.min(1, color[1] + (Math.random() - 0.5) * 0.3));
      const b = Math.max(0, Math.min(1, color[2] + (Math.random() - 0.5) * 0.3));

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(r, g, b),
        transparent: true,
        opacity: 1,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(cx, cy, cz);

      // Stronger outward spread; upward bias for readability
      const speed = 2.5 + Math.random() * 3.5;
      const vx = (Math.random() - 0.5) * speed;
      const vy = 2.5 + Math.random() * 3.5;
      const vz = (Math.random() - 0.5) * speed;

      this.scene.add(m);
      const maxLife = 0.45 + Math.random() * 0.35;
      this.particles.push({ mesh: m, vx, vy, vz, life: maxLife, maxLife, grav: 14 });
    }
  }

  /**
   * Soft surface dust / chew crumbs. Smaller and shorter than a break burst.
   */
  puff(x, y, z, color = [0.55, 0.5, 0.4], count = 6) {
    const cx = x + 0.5;
    const cy = y + 0.08;
    const cz = z + 0.5;
    const capped = Math.min(count, 10);
    for (let i = 0; i < capped; i++) {
      const size = 0.03 + Math.random() * 0.04;
      const geo = new THREE.BoxGeometry(size, size, size);
      const r = Math.max(0, Math.min(1, color[0] + (Math.random() - 0.5) * 0.2));
      const g = Math.max(0, Math.min(1, color[1] + (Math.random() - 0.5) * 0.2));
      const b = Math.max(0, Math.min(1, color[2] + (Math.random() - 0.5) * 0.2));
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), transparent: true, opacity: 0.92 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(cx + (Math.random() - 0.5) * 0.35, cy, cz + (Math.random() - 0.5) * 0.35);
      this.scene.add(m);
      const maxLife = 0.28 + Math.random() * 0.18;
      this.particles.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 1.4,
        vy: 0.6 + Math.random() * 1.1,
        vz: (Math.random() - 0.5) * 1.4,
        life: maxLife,
        maxLife,
        grav: 8,
      });
    }
  }

  /** Rising underwater breath bubbles. */
  bubble(x, y, z, count = 3) {
    const capped = Math.min(count, 8);
    for (let i = 0; i < capped; i++) {
      const size = 0.04 + Math.random() * 0.05;
      const geo = new THREE.SphereGeometry(size, 6, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xcfefff,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x + (Math.random() - 0.5) * 0.28, y + Math.random() * 0.2, z + (Math.random() - 0.5) * 0.28);
      this.scene.add(m);
      const maxLife = 0.7 + Math.random() * 0.45;
      this.particles.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.7 + Math.random() * 0.55,
        vz: (Math.random() - 0.5) * 0.25,
        life: maxLife,
        maxLife,
        grav: -1.6,
      });
    }
  }

  /** @type {number} */
  _flashLife = 0;

  tick(dt) {
    // Decay impact flash
    if (this._flashLife > 0 && this._flashMesh) {
      this._flashLife -= dt;
      if (this._flashLife <= 0) {
        this._flashMesh.visible = false;
        this._flashMat.opacity = 0;
        this._flashLife = 0;
      } else {
        // Rapid fade: linear from 0.9 → 0 over flash lifetime
        this._flashMat.opacity = (this._flashLife / 0.12) * 0.9;
        // Slight scale pulse
        const s = 1 + (this._flashLife / 0.12) * 0.5;
        this._flashMesh.scale.setScalar(s);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy -= (p.grav ?? 14) * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 8;
      p.mesh.rotation.y += dt * 6;

      // Opacity fade-out in last 40% of life for smooth pop-off
      const ratio = p.maxLife > 0 ? p.life / p.maxLife : 0;
      const mat = p.mesh.material;
      if (ratio < 0.4) {
        mat.opacity = ratio / 0.4; // linear fade to 0
      } else {
        mat.opacity = 1;
      }

      // Scale shrink in last 30% of life for readability
      if (ratio < 0.3) {
        const s = ratio / 0.3; // 1 → 0
        p.mesh.scale.setScalar(0.2 + s * 0.8);
      } else {
        p.mesh.scale.setScalar(1);
      }

      if (p.life <= 0 || p.mesh.position.y < -5) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  dispose() {
    this.hideCrack();
    if (this.crackMesh) {
      this.scene.remove(this.crackMesh);
      this.crackMesh.geometry.dispose();
      this.crackMesh.material.dispose();
      this.crackMesh = null;
    }
    if (this._flashMesh) {
      this.scene.remove(this._flashMesh);
      // _flashGeo and _flashMat are shared — dispose only once at end
    }
    this._flashGeo.dispose();
    this._flashMat.dispose();
    this._flashMesh = null;
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles.length = 0;
  }
}

/**
 * Compute particle parameter specs for a given weather type.
 * @param {string} weather - 'clear' | 'rain' | 'snow'
 * @returns {{color: number, size: number, opacity: number, speed: number, isSnow: boolean, visible: boolean}}
 */
export function getWeatherFXParams(weather) {
  if (weather === 'snow') {
    return { color: 0xffffff, size: 0.13, opacity: 0.8, speed: 3.5, isSnow: true, visible: true };
  }
  if (weather === 'rain') {
    return { color: 0x99ccff, size: 0.08, opacity: 0.6, speed: 15.0, isSnow: false, visible: true };
  }
  return { color: 0x99ccff, size: 0.08, opacity: 0.0, speed: 0, isSnow: false, visible: false };
}

/**
 * Step a single particle position for weather motion.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} dt
 * @param {string} weather
 * @param {number} elapsed
 * @param {number} index
 * @returns {[number, number, number]}
 */
export function stepWeatherParticle(x, y, z, dt, weather, elapsed, index) {
  const params = getWeatherFXParams(weather);
  if (!params.visible) return [x, y, z];

  let ny = y - params.speed * (0.7 + (index % 7) * 0.08) * dt;
  let nx = x;
  let nz = z;

  if (params.isSnow) {
    nx += Math.sin(elapsed * 2 + index * 0.5) * 0.8 * dt;
    nz += Math.cos(elapsed * 1.5 + index * 0.3) * 0.5 * dt;
  } else {
    nx -= 1.2 * dt;
  }

  if (ny < -6) {
    nx = (Math.random() - 0.5) * 40;
    ny = 16 + Math.random() * 12;
    nz = (Math.random() - 0.5) * 40;
  }
  return [nx, ny, nz];
}

/**
 * Weather atmosphere rain/snow particle system.
 */
export class WeatherFX {
  /**
   * @param {THREE.Scene} scene
   * @param {number} [particleCount=450]
   */
  constructor(scene, particleCount = 450) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.elapsed = 0;
    this.pointsMesh = null;
    this.geometry = null;
    this.material = null;
    this._initMesh();
  }

  _initMesh() {
    if (typeof THREE === 'undefined' || !THREE || !THREE.BufferGeometry) return;
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 25 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.visible = false;
    if (this.scene) {
      this.scene.add(this.pointsMesh);
    }
  }

  /**
   * Update particle positions and visuals for active weather.
   * @param {number} dt
   * @param {string} weather - 'clear' | 'rain' | 'snow'
   * @param {{x:number, y:number, z:number}} [centerPos]
   * @param {boolean} [active=true]
   */
  tick(dt, weather, centerPos, active = true) {
    const params = getWeatherFXParams(weather);
    const isStorm = active && params.visible;
    if (this.pointsMesh) {
      this.pointsMesh.visible = isStorm;
    }
    if (!isStorm || !this.geometry) return;

    this.elapsed += dt;
    const pos = this.geometry.attributes.position.array;
    const cx = centerPos ? centerPos.x : 0;
    const cy = centerPos ? centerPos.y : 0;
    const cz = centerPos ? centerPos.z : 0;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const [nx, ny, nz] = stepWeatherParticle(
        pos[idx],
        pos[idx + 1],
        pos[idx + 2],
        dt,
        weather,
        this.elapsed,
        i,
      );
      pos[idx] = nx;
      pos[idx + 1] = ny;
      pos[idx + 2] = nz;
    }

    if (this.pointsMesh) {
      this.pointsMesh.position.set(cx, cy, cz);
    }
    if (this.geometry && this.geometry.attributes.position) {
      this.geometry.attributes.position.needsUpdate = true;
    }

    if (this.material) {
      this.material.color.setHex(params.color);
      this.material.size = params.size;
      this.material.opacity = params.opacity;
    }
  }

  dispose() {
    if (this.pointsMesh) {
      if (this.scene) this.scene.remove(this.pointsMesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
      this.pointsMesh = null;
      this.geometry = null;
      this.material = null;
    }
  }
}

/** Small deterministic firefly constellation for the Mangrove Rootwalk. */
export class MangroveFireflyFX {
  constructor(scene, count = 18) {
    this.scene = scene;
    this.count = count;
    this.elapsed = 0;
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2.5 + (i % 5) * 0.8;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 1.8 + (i % 4) * 0.65;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.72;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      color: 0xffd86a,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    scene?.add(this.points);
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.points.visible = Boolean(active && center);
    if (!this.points.visible) return;
    this.points.position.set(55.5, 20.2, 58.5);
    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      pos[idx + 1] += Math.sin(this.elapsed * 2.2 + i * 1.7) * 0.004;
      pos[idx] += Math.sin(this.elapsed * 1.4 + i) * 0.002;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.material.size = 0.14 + nightMix * 0.07;
    this.material.opacity = 0.58 + Math.sin(this.elapsed * 3.1) * 0.22 + nightMix * 0.16;
  }

  dispose() {
    this.scene?.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** Restrained pale moth motes that appear only after dusk at the Rootwalk. */
export class MangroveMothFX {
  constructor(scene, count = 6) {
    this.scene = scene;
    this.count = count;
    this.elapsed = 0;
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    this._basePositions = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2.1 + (i % 3) * 0.7;
      const base = [Math.cos(a) * r, 2.4 + (i % 3) * 0.55, Math.sin(a) * r * 0.6];
      this._basePositions.push(base);
      pos.set(base, i * 3);
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      color: 0xd9e7ff,
      size: 0.08,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    scene?.add(this.points);
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.points.visible = Boolean(active && center && nightMix > 0.18);
    if (!this.points.visible) return;
    this.points.position.set(55.5, 20.2, 58.5);
    const pos = this.geometry.attributes.position.array;
    const lanternPull = 0.45 + nightMix * 0.55;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const base = this._basePositions[i];
      const angle = this.elapsed * (0.38 + i * 0.018) + i * 1.047;
      const radius = 1 - lanternPull * 0.18;
      pos[idx] = base[0] * radius + Math.sin(angle) * 0.08;
      pos[idx + 1] = base[1] + Math.sin(angle * 1.7) * 0.07;
      pos[idx + 2] = base[2] * radius + Math.cos(angle) * 0.06;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.material.size = 0.08 + nightMix * 0.04;
    this.material.opacity = 0.18 + nightMix * 0.26;
  }

  dispose() {
    this.scene?.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** Small Rootwalk water response: lantern reflection plus a restrained foam ring. */
export class MangroveWaterFX {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.crabPulse = 0;
    this.crabPulseX = 53;
    this.crabPulseZ = 58.8;
    this.reflection = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.76, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffc36a,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    this.foam = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.7, 18),
      new THREE.MeshBasicMaterial({
        color: 0xd8f4ed,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    this.crabRipple = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.34, 14),
      new THREE.MeshBasicMaterial({
        color: 0xc3f5df,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    // A small floating lantern marks the water approach before the bridge is
    // close enough to read. It is visual-only and never enters world data.
    this.approachBeacon = new THREE.Group();
    this.approachBeacon.position.set(50, 17.04, 60);
    const beaconPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.82, 6),
      new THREE.MeshStandardMaterial({ color: 0x5b3a23, roughness: 0.9 }),
    );
    beaconPost.position.y = 0.4;
    const beaconLantern = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      new THREE.MeshBasicMaterial({ color: 0xffd77d, transparent: true, opacity: 0.9 }),
    );
    beaconLantern.position.y = 0.92;
    const beaconHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffb55c,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    beaconHalo.position.y = 0.92;
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.26, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffd18a,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.02;
    this.approachBeacon.add(beaconPost, beaconLantern, beaconHalo, beaconRing);
    this._beaconLantern = beaconLantern;
    this._beaconHalo = beaconHalo;
    this._beaconRing = beaconRing;
    this._lanternInspectPulse = 0;
    this.approachBeacon.visible = false;
    scene?.add(this.approachBeacon);
    for (const mesh of [this.reflection, this.foam, this.crabRipple]) {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(50, 17.12, 60);
      mesh.visible = false;
      scene?.add(mesh);
    }
    this.crabRipple.position.y = 17.13;
  }

  setCrabPulse(strength, x = 52.3, z = 59.4) {
    this.crabPulse = Math.max(this.crabPulse, strength || 0);
    this.crabPulseX = x;
    this.crabPulseZ = z;
  }

  lanternInspectPulse(strength = 1) {
    this._lanternInspectPulse = Math.max(this._lanternInspectPulse, strength);
  }

  tick(dt, active, nightMix = 0, center = null) {
    this.elapsed += dt;
    this._lanternInspectPulse = Math.max(0, this._lanternInspectPulse - dt * 1.35);
    const show = Boolean(active);
    const beaconDistance = center ? Math.hypot(center.x - 50, center.z - 60) : Infinity;
    const beaconNear = Math.max(0, 1 - beaconDistance / 14);
    this.reflection.visible = show && (nightMix > 0.05 || beaconNear > 0);
    this.foam.visible = show;
    this.crabRipple.visible = show && nightMix > 0.1 && this.crabPulse > 0.62;
    this.crabRipple.position.x = this.crabPulseX;
    this.crabRipple.position.z = this.crabPulseZ;
    this.crabRipple.material.opacity = this.crabRipple.visible ? 0.08 + (this.crabPulse - 0.62) * 0.1 : 0;
    this.crabRipple.scale.setScalar(0.85 + Math.max(0, this.crabPulse - 0.62) * 0.9);
    this.crabPulse = 0;
    if (!show) return;
    const beaconVisible = beaconDistance <= 42;
    this.approachBeacon.visible = beaconVisible;
    if (beaconVisible) {
      const beaconPulse = 0.5 + 0.5 * Math.sin(this.elapsed * 2.2);
      const inspectPulse = this._lanternInspectPulse;
      this._beaconLantern.rotation.y += dt * 0.8;
      this._beaconLantern.position.y = 0.9 + Math.sin(this.elapsed * 1.8) * 0.025 + inspectPulse * 0.06;
      this._beaconLantern.material.opacity = 0.88 + nightMix * 0.1;
      this._beaconHalo.position.y = this._beaconLantern.position.y;
      this._beaconHalo.material.opacity = 0.035 + nightMix * 0.24 + beaconPulse * 0.025 + inspectPulse * 0.28;
      this._beaconRing.material.opacity = 0.04 + nightMix * 0.18 + beaconPulse * 0.02 + inspectPulse * 0.2;
      this._beaconRing.scale.setScalar(0.9 + beaconPulse * 0.12 + nightMix * 0.08 + inspectPulse * 0.5);
    }
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 2.4);
    const approach = center ? Math.max(0, 1 - Math.hypot(center.x - 54, center.z - 58) / 12) : 0;
    this.reflection.material.opacity = this.reflection.visible
      ? 0.04 + nightMix * 0.22 + approach * 0.05
        + beaconNear * (0.08 + this._lanternInspectPulse * 0.26)
      : 0;
    this.foam.material.opacity = 0.045 + pulse * 0.02 + nightMix * 0.055 + approach * 0.025;
    this.reflection.scale.set(
      1.55 + pulse * 0.1 + approach * 0.08 + beaconNear * 0.18 + this._lanternInspectPulse * 0.35,
      1,
      0.78 + pulse * 0.06 + approach * 0.04 + beaconNear * 0.10,
    );
    this.foam.scale.set(1.12 + pulse * 0.05 + approach * 0.04, 1, 0.7 + pulse * 0.04 + approach * 0.03);
  }

  dispose() {
    this.scene?.remove(this.approachBeacon);
    this.approachBeacon.traverse((child) => {
      child.geometry?.dispose();
      child.material?.dispose?.();
    });
    for (const mesh of [this.reflection, this.foam, this.crabRipple]) {
      this.scene?.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  }
}

/** Three tiny authored frog silhouettes that wake beside the Rootwalk channel at dusk. */
export class MangroveFrogFX {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.frogs = [];
    this._ripples = [];
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x315b43, roughness: 0.95 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0x6e8a54, roughness: 1 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd56a, transparent: true });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x18251c });
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0x8fd3c4, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const spots = [[53.4, 17.25, 58.2], [54.7, 17.2, 58.8], [52.6, 17.25, 57.5]];
    this._spots = spots;
    this._baseRotations = spots.map((_, i) => i * 1.8);
    for (let i = 0; i < spots.length; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 5), bodyMat);
      body.scale.set(1.15, 0.62, 1.35);
      body.position.y = 0.2;
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5), bellyMat);
      belly.scale.set(1.1, 0.5, 0.85);
      belly.position.set(0, 0.18, 0.12);
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 4), eyeMat);
      const eyeR = eyeL.clone();
      eyeL.position.set(-0.12, 0.42, 0.08);
      eyeR.position.set(0.12, 0.42, 0.08);
      const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.027, 5, 3), pupilMat);
      const pupilR = pupilL.clone();
      pupilL.position.set(-0.12, 0.43, 0.135);
      pupilR.position.set(0.12, 0.43, 0.135);
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.2, 12), rippleMat);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = -1.15;
      ripple.visible = false;
      group.add(body, belly, eyeL, eyeR, pupilL, pupilR, ripple);
      group.position.set(...spots[i]);
      group.rotation.y = i * 1.8;
      group.visible = false;
      scene?.add(group);
      this.frogs.push(group);
      this._ripples.push(ripple);
    }
    this._bodyMat = bodyMat;
    this._bellyMat = bellyMat;
    this._eyeMat = eyeMat;
    this._pupilMat = pupilMat;
    this._rippleMat = rippleMat;
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    const show = Boolean(active && center && nightMix > 0.18);
    let maxAlert = 0;
    let maxHop = 0;
    for (let i = 0; i < this.frogs.length; i++) {
      const frog = this.frogs[i];
      frog.visible = show;
      if (!show) continue;
      const distance = Math.hypot(center.x - this._spots[i][0], center.z - this._spots[i][2]);
      const alert = Math.max(0, 1 - distance / 14);
      maxAlert = Math.max(maxAlert, alert);
      const cycle = (this.elapsed + i * 2.3) % 7;
      const hop = distance < 16 && cycle < 0.72 ? Math.sin((cycle / 0.72) * Math.PI) * 0.28 : 0;
      maxHop = Math.max(maxHop, hop);
      const ripple = this._ripples[i];
      ripple.visible = show && hop > 0.03;
      ripple.scale.setScalar(1 + hop * 2.4);
      frog.position.y = 17.2 + Math.sin(this.elapsed * 1.4 + i * 1.9) * 0.018 + hop;
      frog.rotation.z = Math.sin(this.elapsed * 1.1 + i) * 0.025;
      frog.rotation.x = hop * 0.18;
      frog.rotation.y = this._baseRotations[i] + Math.atan2(center.x - this._spots[i][0], center.z - this._spots[i][2]) * alert;
      frog.scale.setScalar(0.9 + nightMix * 0.06);
    }
    const alertPulse = maxAlert * (0.5 + 0.5 * Math.sin(this.elapsed * 5.5)) * 0.16;
    this._eyeMat.opacity = show ? 0.58 + nightMix * 0.35 + alertPulse : 0;
    this._rippleMat.opacity = show ? maxHop * 0.3 : 0;
  }

  dispose() {
    for (const frog of this.frogs) {
      this.scene?.remove(frog);
      frog.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
      });
    }
    for (const mat of [this._bodyMat, this._bellyMat, this._eyeMat, this._pupilMat, this._rippleMat]) mat.dispose();
  }
}

/** Sparse authored crabs that sidestep along the Rootwalk channel edge after dusk. */
export class MangroveCrabFX {
  constructor(scene, count = 3) {
    this.scene = scene;
    this.elapsed = 0;
    this.crabs = [];
    this._flecks = [];
    this.scuttlePulse = 0;
    this.scuttleSourceX = 52.3;
    this.scuttleSourceZ = 59.4;
    this.audioCooldown = 0;
    this._spots = [[51.6, 16.92, 59.1], [53.1, 16.92, 59.8], [50.8, 16.92, 57.9]];
    const shellMat = new THREE.MeshBasicMaterial({ color: 0xb5653e, transparent: true, opacity: 0.78, depthTest: false, depthWrite: false });
    const clawMat = new THREE.MeshBasicMaterial({ color: 0xe09a62, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false });
    const fleckMat = new THREE.MeshBasicMaterial({ color: 0xe0bf83, transparent: true, opacity: 0.56, depthTest: false, depthWrite: false });
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 5), shellMat);
      shell.scale.set(1.35, 0.55, 1.0);
      shell.position.y = 0.12;
      group.add(shell);
      for (const side of [-1, 1]) {
        for (let leg = -1; leg <= 1; leg++) {
          const limb = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.2), clawMat);
          limb.position.set(side * 0.17, 0.08, leg * 0.1);
          limb.rotation.y = side * (0.65 + leg * 0.18);
          group.add(limb);
        }
        const claw = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), clawMat);
        claw.position.set(side * 0.26, 0.12, 0.16);
        group.add(claw);
      }
      const flecks = [];
      for (const side of [-1, 1]) {
        const fleck = new THREE.Mesh(new THREE.TetrahedronGeometry(0.06, 0), fleckMat);
        fleck.position.set(side * 0.2, 0.04, -0.08);
        fleck.visible = false;
        group.add(fleck);
        flecks.push(fleck);
      }
      group.position.set(...this._spots[i]);
      group.rotation.y = i * 1.7;
      group.visible = false;
      scene?.add(group);
      this.crabs.push(group);
      this._flecks.push(flecks);
    }
    this._shellMat = shellMat;
    this._clawMat = clawMat;
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.scuttlePulse = 0;
    this.audioCooldown = Math.max(0, this.audioCooldown - dt);
    const show = Boolean(active && center && nightMix > 0.1);
    for (let i = 0; i < this.crabs.length; i++) {
      const crab = this.crabs[i];
      crab.visible = show;
      if (!show) continue;
      const distance = Math.hypot(center.x - this._spots[i][0], center.z - this._spots[i][2]);
      const flee = Math.max(0, 1 - distance / 7);
      const away = this._spots[i][0] >= center.x ? 1 : -1;
      const freeze = Math.max(0, 1 - distance / 5) * (0.5 + 0.5 * Math.sin(this.elapsed * 3.2 + i));
      const sidestep = Math.sin(this.elapsed * 0.55 + i * 1.8) * 0.16;
      const scuttle = away * flee * (0.22 + Math.sin(this.elapsed * 4.2 + i) * 0.06) * (1 - freeze * 0.85);
      const scuttlePulse = flee * Math.max(0, Math.sin(this.elapsed * 4.2 + i));
      if (scuttlePulse > this.scuttlePulse) {
        this.scuttleSourceX = crab.position.x + away * 0.55;
        this.scuttleSourceZ = crab.position.z + 0.28;
      }
      this.scuttlePulse = Math.max(this.scuttlePulse, scuttlePulse);
      crab.position.x = this._spots[i][0] + sidestep + scuttle;
      crab.position.y = this._spots[i][1] + Math.sin(this.elapsed * 1.6 + i) * 0.012;
      crab.rotation.y = away * (0.3 + flee * 0.35);
      crab.rotation.z = Math.sin(this.elapsed * 1.1 + i * 0.7) * 0.04;
      crab.rotation.x = flee * 0.08 + freeze * 0.14;
      crab.scale.setScalar(0.9 + nightMix * 0.05);
      for (const [index, fleck] of this._flecks[i].entries()) {
        fleck.visible = scuttlePulse > 0.62;
        fleck.position.y = 0.06 + scuttlePulse * (0.12 + index * 0.03);
        fleck.scale.setScalar(0.65 + scuttlePulse * 0.7);
      }
    }
  }

  dispose() {
    for (const crab of this.crabs) {
      this.scene?.remove(crab);
      crab.traverse((child) => { if (child.geometry) child.geometry.dispose(); });
    }
    this._shellMat.dispose();
    this._clawMat.dispose();
    this._flecks[0]?.[0]?.material.dispose();
  }
}

/** Two sparse authored mudskippers that hop between the channel surface and wet mud after dusk. */
export class MangroveMudskipperFX {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.skippers = [];
    this._ripples = [];
    this.alertPulse = 0;
    this.feedingPulse = 0;
    this.audioCooldown = 0;
    this._spots = [[52.9, 17.04, 59.5], [54.0, 17.04, 59.2]];
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x9b7d55, transparent: true, opacity: 0.82, depthTest: false, depthWrite: false });
    const finMat = new THREE.MeshBasicMaterial({ color: 0xc8a56d, transparent: true, opacity: 0.78, depthTest: false, depthWrite: false });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd978, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false });
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0xb8ead8, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    for (let i = 0; i < this._spots.length; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 5), bodyMat);
      body.scale.set(0.9, 0.42, 1.5);
      body.position.y = 0.11;
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 5), finMat);
      fin.rotation.z = Math.PI / 2;
      fin.position.set(0.12, 0.16, 0.02);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 3), eyeMat);
      eye.position.set(-0.08, 0.24, 0.18);
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.2, 12), rippleMat);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = 0.02;
      ripple.visible = false;
      group.add(body, fin, eye, ripple);
      group.position.set(...this._spots[i]);
      group.rotation.y = i * 1.2;
      group.visible = false;
      scene?.add(group);
      this.skippers.push(group);
      this._ripples.push(ripple);
    }
    this._bodyMat = bodyMat;
    this._finMat = finMat;
    this._eyeMat = eyeMat;
    this._rippleMat = rippleMat;
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.audioCooldown = Math.max(0, this.audioCooldown - dt);
    const show = Boolean(active && center && nightMix > 0.1);
    this.alertPulse = 0;
    this.feedingPulse = 0;
    let maxHop = 0;
    for (let i = 0; i < this.skippers.length; i++) {
      const skipper = this.skippers[i];
      skipper.visible = show;
      const ripple = this._ripples[i];
      ripple.visible = false;
      if (!show) continue;
      const distance = Math.hypot(center.x - this._spots[i][0], center.z - this._spots[i][2]);
      const approach = Math.max(0, 1 - distance / 7);
      const cycle = (this.elapsed + i * 2.4) % 5.8;
      const hop = distance < 18 && cycle < 0.58 ? Math.sin((cycle / 0.58) * Math.PI) * (0.24 + approach * 0.08) : 0;
      const alert = approach * Math.max(0, Math.sin(this.elapsed * 5.2 + i * 1.7));
      const feedCycle = (this.elapsed + i * 1.9) % 8.2;
      const feeding = distance < 18 && feedCycle > 2.4 && feedCycle < 3.2
        ? Math.sin(((feedCycle - 2.4) / 0.8) * Math.PI)
        : 0;
      const dx = 55.5 - this._spots[i][0];
      const dz = 58.5 - this._spots[i][2];
      const length = Math.hypot(dx, dz) || 1;
      const dart = alert * 0.2;
      this.alertPulse = Math.max(this.alertPulse, alert);
      this.feedingPulse = Math.max(this.feedingPulse, feeding);
      maxHop = Math.max(maxHop, hop);
      skipper.position.x = this._spots[i][0] + Math.sin(this.elapsed * 0.45 + i) * 0.11 + (dx / length) * dart;
      skipper.position.y = this._spots[i][1] + hop - feeding * 0.045;
      skipper.position.z = this._spots[i][2] + (dz / length) * dart;
      skipper.rotation.x = -hop * 0.32 - alert * 0.12 + feeding * 0.22;
      skipper.rotation.z = Math.sin(this.elapsed * 1.2 + i) * 0.035;
      skipper.scale.setScalar(0.92 + nightMix * 0.04);
      ripple.visible = hop > 0.04 || feeding > 0.08;
      ripple.scale.setScalar(1 + hop * 2.2 + feeding * 0.65);
      ripple.material.opacity = Math.max(hop * 0.24, feeding * 0.12);
    }
    return maxHop;
  }

  dispose() {
    for (const skipper of this.skippers) {
      this.scene?.remove(skipper);
      skipper.traverse((child) => { if (child.geometry) child.geometry.dispose(); });
    }
    for (const mat of [this._bodyMat, this._finMat, this._eyeMat, this._rippleMat]) mat.dispose();
  }
}

/** Two sparse authored dragonflies hovering above the Mangrove channel in day and dusk. */
export class MangroveDragonflyFX {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.scatterPulse = 0;
    this.feedingCue = 0;
    this.skimPulse = 0;
    this.perchPulse = 0;
    this.flies = [];
    this.ripples = [];
    this.ripplePulse = [];
    this._rippleMats = [];
    this._wings = [];
    this._spots = [[53.0, 17.42, 58.7], [54.25, 17.58, 59.05]];
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x2f6f77, transparent: true, opacity: 0.96, depthTest: false, depthWrite: false });
    const wingMat = new THREE.MeshBasicMaterial({ color: 0x79d8da, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd8fff0, transparent: true, opacity: 0.88, depthTest: false, depthWrite: false });
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0x9fe5e1, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    for (let i = 0; i < this._spots.length; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.52, 6), bodyMat);
      body.rotation.z = Math.PI / 2;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), eyeMat);
      head.position.x = -0.2;
      const wings = [];
      for (const [x, z, rot] of [[-0.02, 0.07, 0.22], [-0.02, -0.07, -0.22], [0.1, 0.06, 0.48], [0.1, -0.06, -0.48]]) {
        const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.12), wingMat);
        wing.position.set(x, 0.025, z);
        wing.rotation.set(0, rot, rot * 0.25);
        group.add(wing);
        wings.push(wing);
      }
      group.add(body, head);
      group.position.set(...this._spots[i]);
      group.rotation.y = i * 1.8;
      group.visible = false;
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.1, 10), rippleMat.clone());
      this._rippleMats.push(ripple.material);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(this._spots[i][0], 17.14, this._spots[i][2]);
      ripple.visible = false;
      scene?.add(ripple);
      this.ripples.push(ripple);
      this.ripplePulse.push(0);
      scene?.add(group);
      this.flies.push(group);
      this._wings.push(wings);
    }
    this._bodyMat = bodyMat;
    this._wingMat = wingMat;
    this._eyeMat = eyeMat;
    this._rippleMat = rippleMat;
  }

  tick(dt, active, center, nightMix = 0, feedingPulse = 0) {
    this.elapsed += dt;
    this.scatterPulse = 0;
    this.feedingCue = 0;
    this.skimPulse = 0;
    this.perchPulse = 0;
    const show = Boolean(active && center && nightMix < 0.65);
    for (let i = 0; i < this.ripples.length; i++) {
      this.ripplePulse[i] = Math.max(0, this.ripplePulse[i] - dt * 2.8);
      this.ripples[i].visible = false;
    }
    for (let i = 0; i < this.flies.length; i++) {
      const fly = this.flies[i];
      fly.visible = show;
      if (!show) continue;
      const distance = Math.hypot(center.x - this._spots[i][0], center.z - this._spots[i][2]);
      const scatter = Math.max(0, 1 - distance / 6);
      this.scatterPulse = Math.max(this.scatterPulse, scatter);
      this.feedingCue = Math.max(this.feedingCue, feedingPulse);
      const skim = feedingPulse * Math.max(0, Math.sin(this.elapsed * 4.8 + i * 1.6));
      this.skimPulse = Math.max(this.skimPulse, skim);
      const perchCycle = (this.elapsed + i * 3.6) % 11.2;
      const perch = i === 0 && feedingPulse < 0.2 && perchCycle > 5.0 && perchCycle < 6.8
        ? Math.max(0, 1 - scatter) * Math.max(0, Math.sin((perchCycle - 5.0) * Math.PI / 1.8))
        : 0;
      this.perchPulse = Math.max(this.perchPulse, perch);
      const dx = this._spots[i][0] - center.x;
      const dz = this._spots[i][2] - center.z;
      const length = Math.hypot(dx, dz) || 1;
      const drift = Math.sin(this.elapsed * 0.7 + i * 1.4) * 0.18;
      fly.position.x = this._spots[i][0] + drift + (dx / length) * scatter * 0.3 + Math.cos(this.elapsed * 4.8 + i * 1.6) * skim * 0.22;
      fly.position.y = this._spots[i][1] + Math.sin(this.elapsed * 2.1 + i) * 0.11 + scatter * 0.16 - feedingPulse * 0.08 - skim * 0.06 - perch * 0.22;
      fly.position.z = this._spots[i][2] + Math.cos(this.elapsed * 0.8 + i) * 0.12 + (dz / length) * scatter * 0.3 + Math.sin(this.elapsed * 4.8 + i * 1.6) * skim * 0.18;
      fly.rotation.x = feedingPulse * 0.14 + skim * 0.18 + perch * 0.22;
      fly.rotation.y += dt * (0.7 + i * 0.15);
      fly.rotation.z = Math.sin(this.elapsed * 1.3 + i) * 0.16 + perch * 0.3;
      const flap = (0.72 + Math.abs(Math.sin(this.elapsed * 8.5 + i)) * 0.55) * (1 - perch * 0.55);
      for (const wing of this._wings[i]) wing.scale.y = flap;
      const ripple = this.ripples[i];
      this.ripplePulse[i] = Math.max(this.ripplePulse[i], skim > 0.55 ? skim : 0);
      ripple.visible = this.ripplePulse[i] > 0.06;
      ripple.position.set(fly.position.x, 17.14, fly.position.z);
      ripple.scale.setScalar(1 + this.ripplePulse[i] * 1.8);
      ripple.material.opacity = this.ripplePulse[i] * 0.16;
    }
    return this.scatterPulse;
  }

  dispose() {
    for (const fly of this.flies) {
      this.scene?.remove(fly);
      fly.traverse((child) => { if (child.geometry) child.geometry.dispose(); });
    }
    for (const ripple of this.ripples) {
      this.scene?.remove(ripple);
      if (ripple.geometry) ripple.geometry.dispose();
    }
    for (const mat of [this._bodyMat, this._wingMat, this._eyeMat, this._rippleMat, ...this._rippleMats]) mat.dispose();
  }
}

/** One sparse authored Mangrove egret perched over the shallow channel. */
export class MangroveEgretFX {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.scatterPulse = 0;
    this.perchPulse = 0;
    this.bird = new THREE.Group();
    this._spot = [55.0, 17.72, 60.6];

    const bodyMat = new THREE.MeshBasicMaterial({ color: 0xdfe8dd, transparent: true, opacity: 0.9, depthTest: true, depthWrite: false });
    const wingMat = new THREE.MeshBasicMaterial({ color: 0x41545a, transparent: true, opacity: 0.88, depthTest: true, depthWrite: false, side: THREE.DoubleSide });
    const beakMat = new THREE.MeshBasicMaterial({ color: 0xd4a34a, transparent: true, opacity: 0.95, depthTest: true, depthWrite: false });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.18), bodyMat);
    body.position.y = 0.25;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.34, 6), bodyMat);
    neck.position.y = 0.53;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), bodyMat);
    head.position.y = 0.75;
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 4), beakMat);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.13, 0.73, 0);
    const wings = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.26), wingMat);
      wing.position.set(side * 0.14, 0.36, 0);
      this.bird.add(wing);
      wings.push(wing);
    }
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 5), beakMat);
      leg.position.set(side * 0.07, 0.0, 0);
      this.bird.add(leg);
      legs.push(leg);
    }
    this.bird.add(body, neck, head, beak);
    this.bird.position.set(...this._spot);
    this.bird.visible = false;
    scene?.add(this.bird);
    this._wings = wings;
    this._bodyMat = bodyMat;
    this._wingMat = wingMat;
    this._beakMat = beakMat;

  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.scatterPulse = 0;
    this.perchPulse = 0;
    const distance = center ? Math.hypot(center.x - this._spot[0], center.z - this._spot[2]) : Infinity;
    const show = Boolean(active && center && nightMix < 0.5 && distance < 24);
    this.bird.visible = show;
    if (!show) return 0;
    const scatter = Math.max(0, 1 - distance / 7);
    this.scatterPulse = scatter;
    this.perchPulse = 1 - scatter;
    const flap = 0.72 + Math.abs(Math.sin(this.elapsed * 7.2)) * 0.28 + scatter * 0.45;
    for (const wing of this._wings) wing.rotation.z = scatter * 0.5 * (wing.position.x < 0 ? -1 : 1) + Math.sin(this.elapsed * 7.2) * 0.08;
    for (const wing of this._wings) wing.scale.y = flap;
    this.bird.position.x = this._spot[0] + scatter * 0.45 + Math.sin(this.elapsed * 0.8) * 0.05;
    this.bird.position.y = this._spot[1] + scatter * 0.42 + Math.sin(this.elapsed * 2.2) * 0.03;
    this.bird.position.z = this._spot[2] + Math.cos(this.elapsed * 0.7) * 0.06;

    this.bird.rotation.z = scatter * 0.32;
    this.bird.rotation.x = scatter * -0.18;
    return this.scatterPulse;
  }

  dispose() {
    this.scene?.remove(this.bird);
    this.bird.traverse((child) => { if (child.geometry) child.geometry.dispose(); });
    for (const mat of [this._bodyMat, this._wingMat, this._beakMat]) mat.dispose();
  }
}

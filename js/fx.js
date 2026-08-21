/**
 * Break/hit visual juice: crack overlay + debris particles.
 */
import * as THREE from 'three';
import { crackTileForProgress, tileUVs } from './atlas-core.js?v=216';

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
      this.particles.push({ mesh: m, vx, vy, vz, life: maxLife, maxLife });
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
      p.vy -= 14 * dt;
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
    this.reflection = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.68, 18),
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
    for (const mesh of [this.reflection, this.foam]) {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(54, 17.12, 58);
      mesh.visible = false;
      scene?.add(mesh);
    }
  }

  tick(dt, active, nightMix = 0, center = null) {
    this.elapsed += dt;
    const show = Boolean(active);
    this.reflection.visible = show && nightMix > 0.05;
    this.foam.visible = show;
    if (!show) return;
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 2.4);
    const approach = center ? Math.max(0, 1 - Math.hypot(center.x - 54, center.z - 58) / 12) : 0;
    this.reflection.material.opacity = this.reflection.visible ? 0.12 + nightMix * 0.30 + approach * 0.05 : 0;
    this.foam.material.opacity = 0.045 + pulse * 0.02 + nightMix * 0.055 + approach * 0.025;
    this.reflection.scale.set(1.55 + pulse * 0.1 + approach * 0.08, 1, 0.78 + pulse * 0.06 + approach * 0.04);
    this.foam.scale.set(1.12 + pulse * 0.05 + approach * 0.04, 1, 0.7 + pulse * 0.04 + approach * 0.03);
  }

  dispose() {
    for (const mesh of [this.reflection, this.foam]) {
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

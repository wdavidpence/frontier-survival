import * as THREE from 'three';

function hash01(seed) {
  let h = 2166136261;
  const text = String(seed ?? 'tidewatch');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h / 0x100000000;
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.03, ...options });
}

function addBox(group, name, size, position, mat, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** Authored visual-only expedition prop; voxels remain interaction truth. */
export function createTidewatchWreck({ x = 0, y = 17, z = 0, seed = 0 } = {}) {
  const group = new THREE.Group();
  group.name = 'tidewatch-wreck';
  group.position.set(x + 1.45, y + 0.08, z - 1.35);
  group.rotation.y = (hash01(seed) - 0.5) * 0.7;
  group.userData = { elapsed: 0, baseY: group.position.y, seed: hash01(seed), lanterns: [], gulls: [] };

  const hull = material(0x593624);
  const plank = material(0x9e683a);
  const rope = material(0x8b7251);
  const metal = material(0x4d5962, { roughness: 0.45, metalness: 0.62 });
  const sail = material(0xc9b78c, { side: THREE.DoubleSide, transparent: true, opacity: 0.86 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xffb65c, emissive: 0xff8b35, emissiveIntensity: 1.35, roughness: 0.38 });

  addBox(group, 'wreck-hull', [2.4, 0.44, 4.1], [0, 0.44, 0], hull, [0.05, 0, -0.03]);
  addBox(group, 'wreck-rim-left', [0.17, 0.22, 4.35], [-1.17, 0.83, 0], plank, [0.05, 0.02, -0.03]);
  addBox(group, 'wreck-rim-right', [0.17, 0.22, 4.35], [1.17, 0.83, 0], plank, [0.05, -0.02, 0.04]);
  addBox(group, 'wreck-keel', [0.34, 0.28, 3.72], [0, 0.15, 0.05], hull, [0.05, 0, 0]);
  addBox(group, 'wreck-bench', [1.65, 0.12, 0.3], [0, 0.73, 0.55], plank, [0.05, 0, 0]);
  addBox(group, 'wreck-broken-mast', [0.16, 2.7, 0.16], [-0.3, 1.65, 0.15], plank, [0.12, 0, 0.18]);
  addBox(group, 'wreck-spar', [2.25, 0.11, 0.11], [0.34, 2.45, 0.08], plank, [0.1, 0.04, -0.34]);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.08, 1.15, 4), hull);
  bow.name = 'wreck-bow';
  bow.rotation.x = Math.PI / 2 + 0.05;
  bow.position.set(0, 0.62, -2.48);
  bow.castShadow = true;
  group.add(bow);

  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0.02, 1.62);
  sailShape.lineTo(0.92, 1.18);
  sailShape.lineTo(0.73, 0.75);
  sailShape.lineTo(0.38, 0.88);
  sailShape.lineTo(0.18, 0.28);
  sailShape.closePath();
  const sailMesh = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), sail);
  sailMesh.name = 'wreck-torn-sail';
  sailMesh.position.set(-0.24, 1.25, 0.08);
  sailMesh.rotation.y = 0.05;
  group.add(sailMesh);

  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.65, 6), rope);
  line.name = 'wreck-rigging';
  line.position.set(0.32, 1.65, 0.1);
  line.rotation.z = -0.43;
  group.add(line);

  for (const [dx, dz, scale] of [[0.72, 1.1, 0.34], [0.48, 1.34, 0.24], [-0.7, 1.05, 0.29]]) {
    addBox(group, 'wreck-salvage-crate', [scale, scale * 0.7, scale], [dx, 0.8, dz], plank, [0.03, dx * 0.3, 0.08]);
  }
  addBox(group, 'wreck-iron-band', [0.42, 0.035, 0.045], [0.72, 0.84, 1.1], metal);

  const lantern = new THREE.Group();
  lantern.name = 'wreck-signal-lantern';
  lantern.position.set(-0.8, 1.05, -0.35);
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.27, 8), metal);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), glow);
  lantern.add(cage, flame);
  group.add(lantern);
  group.userData.lanterns.push({ lantern, flame });

  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38, 1, 1), material(0x355867, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  flag.name = 'wreck-signal-flag';
  flag.position.set(-0.15, 2.37, 0.11);
  flag.rotation.y = Math.PI / 2;
  group.add(flag);
  group.userData.flag = flag;

  // Two low-cost, procedural seabirds make the wreck read as a living place
  // from ordinary boat distance without adding a simulated fauna system.
  const gullMat = material(0xdce8e4, { roughness: 0.72 });
  const wingMat = material(0xb8d2cf, { side: THREE.DoubleSide, roughness: 0.74 });
  for (const [orbit, height, phase] of [[2.7, 2.9, 0], [3.55, 3.35, Math.PI]]) {
    const gull = new THREE.Group();
    gull.name = 'tidewatch-gull';
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 5), gullMat);
    body.rotation.z = Math.PI / 2;
    const leftWing = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.11), wingMat);
    const rightWing = leftWing.clone();
    leftWing.position.set(0, 0.03, 0.16);
    rightWing.position.set(0, 0.03, -0.16);
    leftWing.rotation.y = 0.28;
    rightWing.rotation.y = -0.28;
    gull.add(body, leftWing, rightWing);
    group.add(gull);
    group.userData.gulls.push({ gull, orbit, height, phase, leftWing, rightWing });
  }
  return group;
}

export function updateTidewatchWreck(group, dt = 0, night = false) {
  if (!group?.userData) return;
  const data = group.userData;
  data.elapsed = (data.elapsed || 0) + Math.max(0, Number(dt) || 0);
  const swell = Math.sin(data.elapsed * 1.15 + data.seed * Math.PI * 2);
  group.position.y = data.baseY + swell * 0.045;
  group.rotation.z = swell * 0.012;
  if (data.flag) data.flag.rotation.z = Math.sin(data.elapsed * 2.1) * 0.11;
  for (const { lantern, flame } of data.lanterns || []) {
    const flicker = 0.82 + 0.18 * Math.sin(data.elapsed * 7.3);
    lantern.visible = !!night;
    flame.material.emissiveIntensity = night ? 1.15 * flicker : 0.35;
  }
  for (const bird of data.gulls || []) {
    const angle = data.elapsed * 0.42 + bird.phase;
    bird.gull.position.set(Math.cos(angle) * bird.orbit, bird.height + Math.sin(data.elapsed * 1.6 + bird.phase) * 0.18, Math.sin(angle) * bird.orbit * 0.62);
    bird.gull.rotation.y = -angle + Math.PI / 2;
    const flap = Math.sin(data.elapsed * 6 + bird.phase) * 0.34;
    bird.leftWing.rotation.z = flap;
    bird.rightWing.rotation.z = -flap;
  }
}

export function disposeTidewatchWreck(group) {
  group?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((mat) => mat.dispose?.());
  });
}

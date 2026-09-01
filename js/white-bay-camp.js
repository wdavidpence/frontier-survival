import * as THREE from 'three';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.04, ...options });
}

function box(group, name, size, position, mat, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** Overnight camp on the authored White Bay sand landing. */
export function createWhiteBayCamp({ x = 0, y = 0, z = 0 } = {}) {
  const group = new THREE.Group();
  group.name = 'white-bay-camp';
  group.position.set(x, y, z);
  group.userData = { elapsed: 0, lanterns: [] };

  const drift = material(0x9a7448);
  const dark = material(0x5a3d24);
  const cloth = material(0xc4b48a, { side: THREE.DoubleSide });
  const brass = material(0xb98a3e, { metalness: 0.4, roughness: 0.46 });
  const flame = new THREE.MeshStandardMaterial({ color: 0xffbd61, emissive: 0xff8a32, emissiveIntensity: 0.4, roughness: 0.35 });

  box(group, 'bay-lean-to', [1.7, 0.08, 1.15], [0.08, 1.05, 0.1], drift, [0.42, 0, 0.06]);
  box(group, 'bay-post-left', [0.12, 1.15, 0.12], [-0.72, 0.58, -0.38], dark);
  box(group, 'bay-post-right', [0.12, 1.15, 0.12], [0.78, 0.58, -0.32], dark);
  box(group, 'bay-bedroll', [1.15, 0.12, 0.48], [0.04, 0.22, 0.18], cloth, [0, 0.18, 0]);
  box(group, 'bay-crate', [0.38, 0.28, 0.34], [-0.82, 0.22, 0.42], dark);

  const lantern = new THREE.Group();
  lantern.name = 'bay-lantern';
  lantern.position.set(0.62, 0.62, 0.48);
  lantern.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.28, 8), brass));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), flame.clone());
  lantern.add(glow);
  group.add(lantern);
  group.userData.lanterns.push({ lantern, glow });
  return group;
}

export function updateWhiteBayCamp(group, dt = 0, night = false) {
  if (!group?.userData) return;
  const data = group.userData;
  data.elapsed = (data.elapsed || 0) + Math.max(0, Number(dt) || 0);
  for (const { lantern, glow } of data.lanterns || []) {
    const flicker = 0.82 + Math.sin(data.elapsed * 6.4 + lantern.position.x) * 0.18;
    glow.material.emissiveIntensity = night ? 1.28 * flicker : 0.22;
  }
}

export function disposeWhiteBayCamp(group) {
  group?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((mat) => mat.dispose?.());
  });
}

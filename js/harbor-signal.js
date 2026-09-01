import * as THREE from 'three';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02, ...options });
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

function addLookoutPlan(group, timber, darkTimber, brass) {
  box(group, 'lookout-table', [1.08, 0.08, 0.64], [-0.78, 0.82, 0.46], timber);
  box(group, 'lookout-leg-a', [0.08, 0.72, 0.08], [-1.18, 0.42, 0.2], darkTimber);
  box(group, 'lookout-leg-b', [0.08, 0.72, 0.08], [-0.38, 0.42, 0.7], darkTimber);
  box(group, 'lookout-spyglass', [0.66, 0.08, 0.08], [-0.62, 0.96, 0.46], brass, [0, 0.38, 0.16]);
  box(group, 'lookout-chart-weight', [0.16, 0.06, 0.16], [-0.96, 0.9, 0.28], brass);
}

function addLandingPlan(group, timber, darkTimber, rope) {
  box(group, 'landing-pier', [4.2, 0.18, 1.46], [0, 0.1, 1.62], timber);
  box(group, 'landing-post-left', [0.16, 1.18, 0.16], [-1.72, 0.74, 2.12], darkTimber);
  box(group, 'landing-post-right', [0.16, 1.18, 0.16], [1.72, 0.74, 2.12], darkTimber);
  box(group, 'landing-crate', [0.5, 0.38, 0.44], [-0.72, 0.42, 1.52], darkTimber);
  box(group, 'landing-mooring', [0.05, 0.9, 0.05], [-1.72, 1.18, 2.12], rope, [0.18, 0, 0.42]);
}

/** A compact harbor landmark unlocked after completing the Tidewatch return. */
export function createHarborSignal({ x = 0, y = 0, z = 0, choice = null } = {}) {
  const group = new THREE.Group();
  group.name = 'tidewatch-harbor-signal';
  group.position.set(x, y, z);
  group.userData = { elapsed: 0, lanterns: [], pennants: [], choice: choice || null };

  const timber = material(0x9a6338);
  const darkTimber = material(0x573321);
  const rope = material(0x9d8155);
  const brass = material(0xb98a3e, { metalness: 0.45, roughness: 0.44 });
  const chart = material(0xd8c99c, { side: THREE.DoubleSide });
  const flame = new THREE.MeshStandardMaterial({ color: 0xffbd61, emissive: 0xff8a32, emissiveIntensity: 0.35, roughness: 0.35 });

  box(group, 'signal-deck', [2.8, 0.24, 2.2], [0, 0.12, 0], timber);
  box(group, 'signal-mast', [0.18, 3.7, 0.18], [0, 1.98, 0], darkTimber, [0.03, 0, -0.05]);
  box(group, 'signal-crossbar', [2.25, 0.12, 0.12], [0, 3.12, 0], timber, [0.02, 0, -0.04]);
  box(group, 'signal-rope-left', [0.035, 2.2, 0.035], [-0.95, 2.08, 0], rope, [0, 0, 0.44]);
  box(group, 'signal-rope-right', [0.035, 2.2, 0.035], [0.95, 2.08, 0], rope, [0, 0, -0.44]);

  const chartBoard = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.58), chart);
  chartBoard.name = 'signal-chart-board';
  chartBoard.position.set(0.53, 1.45, 0.14);
  chartBoard.rotation.y = Math.PI;
  group.add(chartBoard);
  box(group, 'signal-chart-frame-top', [0.96, 0.05, 0.07], [0.53, 1.76, 0.18], timber);
  box(group, 'signal-chart-frame-bottom', [0.96, 0.05, 0.07], [0.53, 1.14, 0.18], timber);

  for (const [dx, dz] of [[-1.03, -0.63], [1.03, -0.63]]) {
    const lantern = new THREE.Group();
    lantern.name = 'signal-lantern';
    lantern.position.set(dx, 1.05, dz);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.32, 8), brass);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), flame.clone());
    lantern.add(cage, glow);
    group.add(lantern);
    group.userData.lanterns.push({ lantern, glow });
  }

  for (const [dx, color, phase] of [[-0.56, 0x315b71, 0], [0.5, 0xc06c38, Math.PI]]) {
    const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.3), material(color, { side: THREE.DoubleSide }));
    pennant.name = 'signal-pennant';
    pennant.position.set(dx, 2.98, 0.08);
    group.add(pennant);
    group.userData.pennants.push({ pennant, phase });
  }

  if (choice === 'lookout') addLookoutPlan(group, timber, darkTimber, brass);
  if (choice === 'landing') addLandingPlan(group, timber, darkTimber, rope);
  return group;
}

export function updateHarborSignal(group, dt = 0, night = false) {
  if (!group?.userData) return;
  const data = group.userData;
  data.elapsed = (data.elapsed || 0) + Math.max(0, Number(dt) || 0);
  for (const { lantern, glow } of data.lanterns || []) {
    const flicker = 0.82 + Math.sin(data.elapsed * 7.2 + lantern.position.x) * 0.18;
    lantern.visible = true;
    glow.material.emissiveIntensity = night ? 1.32 * flicker : 0.24;
  }
  for (const { pennant, phase } of data.pennants || []) {
    pennant.rotation.y = Math.sin(data.elapsed * 1.65 + phase) * 0.16;
  }
}

export function disposeHarborSignal(group) {
  group?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((mat) => mat.dispose?.());
  });
}

/** Deterministic low-poly first-person held-item family geometry. */

function rgb(THREE, color, fallback = [0.62, 0.46, 0.25]) {
  const c = Array.isArray(color) ? color : fallback;
  return new THREE.Color(c[0] ?? fallback[0], c[1] ?? fallback[1], c[2] ?? fallback[2]);
}

function material(THREE, color, rough = 0.78) {
  return new THREE.MeshLambertMaterial({ color: rgb(THREE, color), roughness: rough });
}

function addShaft(THREE, group, wood) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.18, 8), material(THREE, wood));
  shaft.position.y = -0.04;
  group.add(shaft);
  return shaft;
}

function addPick(THREE, group, headColor) {
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.72, 8), material(THREE, headColor, 0.62));
  head.position.set(0, 0.57, 0);
  head.rotation.z = Math.PI / 2 - 0.18;
  group.add(head);
  const point = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 0.42, 6), material(THREE, headColor, 0.62));
  point.rotation.z = -Math.PI / 2;
  point.position.set(0.42, 0.54, 0);
  group.add(point);
}

function addAxe(THREE, group, headColor) {
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.12), material(THREE, headColor, 0.62));
  head.position.set(0.16, 0.52, 0);
  head.rotation.z = -0.12;
  group.add(head);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.34, 4), material(THREE, headColor, 0.58));
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0.31, 0.52, 0);
  group.add(blade);
}

function addSpear(THREE, group, headColor) {
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 6), material(THREE, headColor, 0.58));
  tip.position.y = 0.76;
  group.add(tip);
}

function addBow(THREE, group, wood) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 6, 12, Math.PI), material(THREE, wood));
  arc.rotation.z = Math.PI / 2;
  arc.position.set(0.08, 0.2, 0);
  group.add(arc);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.34, 8), material(THREE, wood));
  grip.position.set(0.08, 0.2, 0);
  group.add(grip);
}

function addHandAnchor(THREE, group) {
  const skin = new THREE.MeshBasicMaterial({ color: rgb(THREE, [0.58, 0.3, 0.14]) });
  const cuffMat = new THREE.MeshBasicMaterial({ color: rgb(THREE, [0.1, 0.32, 0.3]) });
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 8), cuffMat);
  cuff.position.set(0.04, -0.08, -0.16);
  cuff.rotation.z = -0.12;
  cuff.material.depthTest = false;
  cuff.renderOrder = 10;
  group.add(cuff);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin);
  palm.position.set(0.04, 0.12, -0.18);
  palm.scale.set(0.78, 0.92, 0.72);
  palm.material.depthTest = false;
  palm.renderOrder = 10;
  group.add(palm);
  return { cuff, palm };
}

/** Return a fresh readable first-person group for a tool family. */
export function buildHeldItemGeometry(THREE, family, color = [0.62, 0.46, 0.25]) {
  const group = new THREE.Group();
  group.name = `held-${family}`;
  const wood = [0.55, 0.31, 0.14];
  const head = color;
  addHandAnchor(THREE, group);
  if (family === 'bow') {
    addBow(THREE, group, wood);
  } else {
    addShaft(THREE, group, wood);
    if (family === 'pick') addPick(THREE, group, head);
    else if (family === 'axe' || family === 'hoe' || family === 'spade' || family === 'mason') addAxe(THREE, group, head);
    else addSpear(THREE, group, head);
  }
  group.userData.heldFamily = family;
  group.userData.authoredGeometry = true;
  return group;
}

export function heldFamilyForProps(props) {
  const tool = props?.tool;
  if (['pick', 'axe', 'hoe', 'spade', 'mason', 'weapon', 'bow', 'shield'].includes(tool)) return tool;
  return null;
}

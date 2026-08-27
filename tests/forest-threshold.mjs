import assert from 'node:assert/strict';
import fs from 'node:fs';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

// Build a mock THREE environment to allow testing three.js component in Node.js without external dependencies.
const mockThreeCode = `
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
}

export class Group {
  constructor() {
    this.name = '';
    this.position = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.children = [];
    this.userData = {};
  }
  add(child) {
    this.children.push(child);
  }
}

export class Mesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = new Vector3();
    this.rotation = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.castShadow = false;
    this.receiveShadow = false;
  }
}

export class MeshStandardMaterial {
  constructor(opts = {}) {
    this.color = opts.color || 0xffffff;
    this.roughness = opts.roughness !== undefined ? opts.roughness : 0.5;
    this.metalness = opts.metalness !== undefined ? opts.metalness : 0.5;
    this.emissive = opts.emissive || 0x000000;
    this.emissiveIntensity = opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1.0;
    this.transparent = !!opts.transparent;
    this.opacity = opts.opacity !== undefined ? opts.opacity : 1.0;
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
  }
}

export class BoxGeometry {
  constructor(w, h, d) {
    this.type = 'BoxGeometry';
    this.parameters = { w, h, d };
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
  }
}

export class CylinderGeometry {
  constructor(rt, rb, h, s) {
    this.type = 'CylinderGeometry';
    this.parameters = { rt, rb, h, s };
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
  }
}
`;

const mockDataUri = 'data:text/javascript;base64,' + Buffer.from(mockThreeCode).toString('base64');
const sourceCode = fs.readFileSync('js/forest-threshold.js', 'utf8');
const instrumentedCode = sourceCode.replace(/from ['\"]three['\"]/g, `from '${mockDataUri}'`);
const modDataUri = 'data:text/javascript;base64,' + Buffer.from(instrumentedCode).toString('base64');

const mod = await import(modDataUri);

await asyncTest('forest-threshold: module exports essential helpers', () => {
  assert.equal(typeof mod.createForestThreshold, 'function', 'createForestThreshold must be exported');
  assert.equal(typeof mod.updateForestThreshold, 'function', 'updateForestThreshold must be exported');
  assert.equal(typeof mod.disposeForestThreshold, 'function', 'disposeForestThreshold must be exported');
});

await asyncTest('forest-threshold: child budget and bounds constraint (<= 12 renderable children)', () => {
  const position = { x: 10, y: 5, z: -20 };
  const group = mod.createForestThreshold(position, { seed: 42 });

  assert.ok(group, 'Group should be created');
  assert.equal(group.name, 'forest-threshold-module');
  assert.equal(group.position.x, 10);
  assert.equal(group.position.y, 5);
  assert.equal(group.position.z, -20);

  const childCount = group.children.length;
  assert.ok(childCount > 0, 'Group must contain renderable elements');
  assert.ok(childCount <= 12, `Child count ${childCount} must be <= 12 per budget requirement`);
});

await asyncTest('forest-threshold: layout is strictly deterministic for same seed', () => {
  const pos = { x: 0, y: 0, z: 0 };
  const g1 = mod.createForestThreshold(pos, { seed: 999 });
  const g2 = mod.createForestThreshold(pos, { seed: 999 });

  assert.equal(g1.children.length, g2.children.length, 'Child count must match for same seed');

  for (let i = 0; i < g1.children.length; i++) {
    const c1 = g1.children[i];
    const c2 = g2.children[i];
    assert.equal(c1.position.x, c2.position.x, `Child ${i} x-pos mismatch`);
    assert.equal(c1.position.y, c2.position.y, `Child ${i} y-pos mismatch`);
    assert.equal(c1.position.z, c2.position.z, `Child ${i} z-pos mismatch`);
    assert.equal(c1.rotation.z, c2.rotation.z, `Child ${i} z-rot mismatch`);
  }
});

await asyncTest('forest-threshold: different seeds yield varied layout parameters', () => {
  const pos = { x: 0, y: 0, z: 0 };
  const g1 = mod.createForestThreshold(pos, { seed: 111 });
  const g2 = mod.createForestThreshold(pos, { seed: 888 });

  // Compare step position (Child index 1)
  const step1 = g1.children[1];
  const step2 = g2.children[1];
  assert.notEqual(step1.position.x, step2.position.x, 'Step position should differ with seed');
});

await asyncTest('forest-threshold: update is safe and animates accents', () => {
  const group = mod.createForestThreshold({ x: 0, y: 0, z: 0 }, { seed: 42, enableAnimation: true });
  const initialEmissive = group.userData.glintMat.emissiveIntensity;

  // Safe against edge cases
  assert.doesNotThrow(() => mod.updateForestThreshold(null, 0.016));
  assert.doesNotThrow(() => mod.updateForestThreshold(group, 0));
  assert.doesNotThrow(() => mod.updateForestThreshold(group, -0.5));
  assert.doesNotThrow(() => mod.updateForestThreshold(group, undefined));

  // Advance time
  mod.updateForestThreshold(group, 0.5);
  const updatedEmissive = group.userData.glintMat.emissiveIntensity;
  assert.notEqual(initialEmissive, updatedEmissive, 'Glint emissive intensity should animate over time');
});

await asyncTest('forest-threshold: animation can be disabled', () => {
  const group = mod.createForestThreshold({ x: 0, y: 0, z: 0 }, { seed: 42, enableAnimation: false });
  const initialEmissive = group.userData.glintMat.emissiveIntensity;

  mod.updateForestThreshold(group, 1.0);
  assert.equal(group.userData.glintMat.emissiveIntensity, initialEmissive, 'Emissive should not change when animation disabled');
});

await asyncTest('forest-threshold: disposal cleans up materials, geometries, and children', () => {
  const group = mod.createForestThreshold({ x: 0, y: 0, z: 0 }, { seed: 42 });

  const geometries = [...group.userData.geometries];
  const materials = [...group.userData.materials];

  assert.ok(geometries.length > 0, 'Geometries array should exist');
  assert.ok(materials.length > 0, 'Materials array should exist');

  mod.disposeForestThreshold(group);

  for (const geo of geometries) {
    assert.equal(geo.disposed, true, 'Geometry must be disposed');
  }

  for (const mat of materials) {
    assert.equal(mat.disposed, true, 'Material must be disposed');
  }

  assert.equal(group.children.length, 0, 'Group children must be cleared upon disposal');
  assert.deepEqual(group.userData, {}, 'userData must be cleared upon disposal');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDisposalContext,
  disposeMaterial,
  disposeResource,
  disposeTree,
} from '../js/resource-disposal.js';

test('resource disposal releases shared GPU resources exactly once', () => {
  let textureDisposals = 0;
  let imageCloses = 0;
  let materialDisposals = 0;
  const texture = {
    isTexture: true,
    dispose() { textureDisposals += 1; },
    image: { close() { imageCloses += 1; } },
  };
  const material = {
    isMaterial: true,
    map: texture,
    dispose() { materialDisposals += 1; },
  };
  const context = createDisposalContext();

  assert.equal(disposeMaterial(material, context), true);
  assert.equal(disposeMaterial(material, context), false);
  assert.equal(textureDisposals, 1);
  assert.equal(imageCloses, 1);
  assert.equal(materialDisposals, 1);
});

test('resource disposal walks cyclic trees, clears children, and removes nodes', () => {
  let geometryDisposals = 0;
  let materialDisposals = 0;
  const sharedMaterial = { isMaterial: true, dispose() { materialDisposals += 1; } };
  const root = {
    children: [],
    remove(node) { this.children = this.children.filter((child) => child !== node); },
  };
  const child = {
    geometry: { isBufferGeometry: true, dispose() { geometryDisposals += 1; } },
    material: sharedMaterial,
    parent: root,
    children: [],
  };
  root.children.push(child);
  child.children.push(root); // defensive cycle

  const count = disposeTree(root, { clearChildren: true, removeFromParent: true });
  assert.ok(count >= 1);
  assert.equal(geometryDisposals, 1);
  assert.equal(materialDisposals, 1);
  assert.deepEqual(root.children, []);
  assert.equal(disposeResource(null), false);
});

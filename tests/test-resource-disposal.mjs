import assert from 'node:assert/strict';
import {
    createDisposalContext,
    disposeTexture,
    disposeMaterial,
    disposeGeometry,
    disposeObject,
    disposeTree,
    disposeObjectTree,
    disposeResource
} from '../js/resource-disposal.js';

console.log('Running resource-disposal unit tests...');

// 1. Null / Primitive / Plain Object tolerance
assert.equal(disposeTexture(null), false);
assert.equal(disposeTexture(undefined), false);
assert.equal(disposeTexture(42), false);
assert.equal(disposeMaterial(null), false);
assert.equal(disposeGeometry(undefined), false);
assert.equal(disposeObject(null), false);
assert.equal(disposeTree(null), 0);
assert.equal(disposeResource(null), false);

// Plain object without dispose functions
const plainObj = { foo: 'bar', baz: 123 };
assert.equal(disposeObject(plainObj), false);
assert.equal(disposeTree(plainObj), 0);

// 2. Texture disposal & image closing
let texDisposed = 0;
let imageClosed = 0;
const mockTexture = {
    isTexture: true,
    dispose() { texDisposed++; },
    image: {
        close() { imageClosed++; }
    }
};
assert.equal(disposeTexture(mockTexture), true);
assert.equal(texDisposed, 1);
assert.equal(imageClosed, 1);

// Repeated call on same texture without context re-disposes if not in context,
// but with context it disposes exactly once.
const ctx = createDisposalContext();
let texDisposed2 = 0;
const mockTex2 = { dispose() { texDisposed2++; } };
assert.equal(disposeTexture(mockTex2, ctx), true);
assert.equal(disposeTexture(mockTex2, ctx), false);
assert.equal(texDisposed2, 1);

// 3. Material & material array & material maps disposal
let matDisposed = 0;
let mapDisposed = 0;
let normMapDisposed = 0;
const mockMaterial = {
    isMaterial: true,
    map: { isTexture: true, dispose() { mapDisposed++; } },
    normalMap: { isTexture: true, dispose() { normMapDisposed++; } },
    dispose() { matDisposed++; }
};

assert.equal(disposeMaterial(mockMaterial, ctx), true);
assert.equal(matDisposed, 1);
assert.equal(mapDisposed, 1);
assert.equal(normMapDisposed, 1);

// Repeated call on same material with context does nothing
assert.equal(disposeMaterial(mockMaterial, ctx), false);
assert.equal(matDisposed, 1);
assert.equal(mapDisposed, 1);

// Array of materials
let matArrayCount1 = 0;
let matArrayCount2 = 0;
const mockMat1 = { dispose() { matArrayCount1++; } };
const mockMat2 = { dispose() { matArrayCount2++; } };
assert.equal(disposeMaterial([mockMat1, mockMat2]), true);
assert.equal(matArrayCount1, 1);
assert.equal(matArrayCount2, 1);

// 4. Geometry disposal
let geoDisposed = 0;
const mockGeo = {
    isBufferGeometry: true,
    dispose() { geoDisposed++; }
};
assert.equal(disposeGeometry(mockGeo, ctx), true);
assert.equal(disposeGeometry(mockGeo, ctx), false);
assert.equal(geoDisposed, 1);

// 5. Object Tree & Shared Resources
let sharedGeoDisposed = 0;
let sharedMatDisposed = 0;
let sharedTexDisposed = 0;

const sharedGeo = { dispose() { sharedGeoDisposed++; } };
const sharedTex = { isTexture: true, dispose() { sharedTexDisposed++; } };
const sharedMat = { isMaterial: true, map: sharedTex, dispose() { sharedMatDisposed++; } };

const childA = {
    isMesh: true,
    geometry: sharedGeo,
    material: sharedMat
};

const childB = {
    isMesh: true,
    geometry: sharedGeo,
    material: sharedMat
};

const parentGroup = {
    isGroup: true,
    children: [childA, childB]
};

const treeCtx = createDisposalContext();
const nodesDisposed = disposeObjectTree(parentGroup, { context: treeCtx });

// Node containing shared resources disposes on first visit
assert.equal(nodesDisposed, 1, '1 node triggered resource disposal; 2nd node skipped since resources were already disposed');
assert.equal(sharedGeoDisposed, 1, 'Shared geometry disposed exactly once');
assert.equal(sharedMatDisposed, 1, 'Shared material disposed exactly once');
assert.equal(sharedTexDisposed, 1, 'Shared texture disposed exactly once');

// Repeated call on whole tree with same context
const reDisposed = disposeObjectTree(parentGroup, { context: treeCtx });
assert.equal(reDisposed, 0, 'Second pass disposes 0 nodes');
assert.equal(sharedGeoDisposed, 1);
assert.equal(sharedMatDisposed, 1);

// Tree with distinct resources across nodes
let uniqueGeoCount = 0;
const groupUnique = {
    isGroup: true,
    children: [
        { geometry: { dispose() { uniqueGeoCount++; } } },
        { geometry: { dispose() { uniqueGeoCount++; } } }
    ]
};
assert.equal(disposeTree(groupUnique), 2);
assert.equal(uniqueGeoCount, 2);

// 6. Tree options: removeFromParent & clearChildren
let removedChild = null;
const parentObj = {
    remove(c) { removedChild = c; }
};
const childToDetach = {
    parent: parentObj,
    children: [{ name: 'grandchild' }],
    geometry: { dispose() {} }
};

disposeTree(childToDetach, { removeFromParent: true, clearChildren: true });
assert.equal(removedChild, childToDetach);
assert.equal(childToDetach.children.length, 0);

// 7. Shared material can be preserved while geometry is released
let sharedMaterialDisposed = 0;
let sharedGeometryDisposed = 0;
const sharedMaterial = { isMaterial: true, dispose() { sharedMaterialDisposed++; } };
const sharedTree = {
    children: [{ geometry: { dispose() { sharedGeometryDisposed++; } }, material: sharedMaterial }]
};
assert.equal(disposeTree(sharedTree, { disposeMaterials: false }), 1);
assert.equal(sharedGeometryDisposed, 1);
assert.equal(sharedMaterialDisposed, 0);

// 8. Generic disposeResource
let resGeoDisposed = 0;
assert.equal(disposeResource({ isBufferGeometry: true, dispose() { resGeoDisposed++; } }), true);
assert.equal(resGeoDisposed, 1);

let resTreeDisposed = 0;
assert.equal(disposeResource({
    children: [{ geometry: { dispose() { resTreeDisposed++; } } }]
}), true);
assert.equal(resTreeDisposed, 1);

// 8. Exception tolerance in user dispose callbacks
const throwingRes = {
    geometry: {
        dispose() { throw new Error('Simulated dispose failure'); }
    }
};
assert.doesNotThrow(() => {
    disposeObject(throwingRes);
});

console.log('All resource-disposal unit tests passed successfully!');

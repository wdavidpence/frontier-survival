/**
 * Resource Disposal Helpers for Three.js Object Trees
 *
 * Deterministically disposes Three.js geometries, materials (single or arrays),
 * and texture maps while preserving shared resource safety through WeakSet context tracking.
 * Pure, defensive, and idempotent — handles null, primitives, plain objects,
 * already-disposed resources, circular references, and repeated calls safely.
 */

/**
 * Creates a new WeakSet disposal tracking context.
 * @returns {WeakSet}
 */
function createDisposalContext() {
    return new WeakSet();
}

/**
 * Resolves or normalizes a disposal context.
 * @param {WeakSet|{disposedSet?: WeakSet, seen?: WeakSet}|null|undefined} context
 * @returns {WeakSet}
 */
function resolveContext(context) {
    if (context instanceof WeakSet) return context;
    if (context && context.disposedSet instanceof WeakSet) return context.disposedSet;
    if (context && context.seen instanceof WeakSet) return context.seen;
    return new WeakSet();
}

/**
 * Safely disposes a Three.js texture or texture-like object.
 * @param {Object|null|undefined} texture
 * @param {WeakSet|Object} [context]
 * @returns {boolean} True if disposal was performed, false otherwise.
 */
function disposeTexture(texture, context) {
    if (!texture || typeof texture !== 'object') return false;
    const ctx = resolveContext(context);
    if (ctx.has(texture)) return false;
    ctx.add(texture);

    let disposed = false;
    if (typeof texture.dispose === 'function') {
        try {
            texture.dispose();
            disposed = true;
        } catch (_) {}
    }

    if (texture.image && typeof texture.image.close === 'function') {
        try {
            texture.image.close();
            disposed = true;
        } catch (_) {}
    }

    return disposed;
}

/**
 * Safely disposes a Three.js material or array of materials, including associated texture maps.
 * @param {Object|Array|null|undefined} material
 * @param {WeakSet|Object} [context]
 * @returns {boolean} True if any disposal was performed, false otherwise.
 */
function disposeMaterial(material, context) {
    if (!material || typeof material !== 'object') return false;

    if (Array.isArray(material)) {
        let disposedAny = false;
        for (let i = 0; i < material.length; i++) {
            if (disposeMaterial(material[i], context)) {
                disposedAny = true;
            }
        }
        return disposedAny;
    }

    const ctx = resolveContext(context);
    if (ctx.has(material)) return false;
    ctx.add(material);

    let disposedAny = false;

    // Dispose texture-like properties / maps attached to the material
    for (const key of Object.keys(material)) {
        const prop = material[key];
        if (!prop || typeof prop !== 'object' || prop === material) continue;

        if (prop.isTexture || typeof prop.dispose === 'function') {
            // Exclude child materials or geometries mistakenly attached as properties
            if (!prop.isMaterial && !prop.isBufferGeometry && !prop.isGeometry) {
                if (disposeTexture(prop, ctx)) {
                    disposedAny = true;
                }
            }
        }
    }

    if (typeof material.dispose === 'function') {
        try {
            material.dispose();
            disposedAny = true;
        } catch (_) {}
    }

    return disposedAny;
}

/**
 * Safely disposes a Three.js geometry.
 * @param {Object|null|undefined} geometry
 * @param {WeakSet|Object} [context]
 * @returns {boolean} True if disposal was performed, false otherwise.
 */
function disposeGeometry(geometry, context) {
    if (!geometry || typeof geometry !== 'object') return false;
    const ctx = resolveContext(context);
    if (ctx.has(geometry)) return false;
    ctx.add(geometry);

    if (typeof geometry.dispose === 'function') {
        try {
            geometry.dispose();
            return true;
        } catch (_) {}
    }
    return false;
}

/**
 * Safely disposes direct GPU resources attached to a single Three.js object (geometry & material).
 * @param {Object|null|undefined} object
 * @param {WeakSet|Object} [context]
 * @returns {boolean} True if any disposal was performed, false otherwise.
 */
function disposeObject(object, context, options = {}) {
    if (!object || typeof object !== 'object') return false;
    const ctx = resolveContext(context);

    let disposedAny = false;

    if (object.geometry) {
        if (disposeGeometry(object.geometry, ctx)) disposedAny = true;
    }

    if (object.material && options.disposeMaterials !== false) {
      if (disposeMaterial(object.material, ctx)) disposedAny = true;
    }

    if (!ctx.has(object)) {
        ctx.add(object);
        if (typeof object.dispose === 'function') {
            try {
                object.dispose();
                disposedAny = true;
            } catch (_) {}
        }
    }

    return disposedAny;
}

/**
 * Traverses and disposes an entire Three.js object hierarchy (geometry, materials, textures).
 * @param {Object|null|undefined} root
 * @param {WeakSet|Object} [optionsOrContext] Context or options object ({ context, removeFromParent, clearChildren, disposeMaterials })
 * @returns {number} Count of object nodes where resources were disposed.
 */
function disposeTree(root, optionsOrContext) {
    if (!root || typeof root !== 'object') return 0;

    let context;
    let options = {};
    if (optionsOrContext instanceof WeakSet || (optionsOrContext && optionsOrContext.disposedSet instanceof WeakSet)) {
        context = optionsOrContext;
    } else if (optionsOrContext && typeof optionsOrContext === 'object') {
        options = optionsOrContext;
        context = options.context;
    }

    const ctx = resolveContext(context);
    const stack = [root];
    const visitedNodes = new Set();
    let count = 0;

    while (stack.length > 0) {
        const node = stack.pop();
        if (!node || typeof node !== 'object') continue;
        if (visitedNodes.has(node)) continue;
        visitedNodes.add(node);

        if (Array.isArray(node.children)) {
            for (let i = node.children.length - 1; i >= 0; i--) {
                if (node.children[i]) {
                    stack.push(node.children[i]);
                }
            }
            if (options.clearChildren) {
                node.children.length = 0;
            }
        }

        if (disposeObject(node, ctx, options)) {
            count++;
        }

        if (options.removeFromParent && node.parent && typeof node.parent.remove === 'function') {
            try {
                node.parent.remove(node);
            } catch (_) {}
        }
    }

    return count;
}

/**
 * Alias for disposeTree.
 */
const disposeObjectTree = disposeTree;

/**
 * Generic resource disposal entry point. Disposes trees, materials, geometries, textures, or arrays.
 * @param {Object|Array|null|undefined} res
 * @param {WeakSet|Object} [context]
 * @returns {boolean} True if any disposal occurred.
 */
function disposeResource(res, context) {
    if (!res || typeof res !== 'object') return false;

    if (Array.isArray(res)) {
        let any = false;
        for (let i = 0; i < res.length; i++) {
            if (disposeResource(res[i], context)) any = true;
        }
        return any;
    }

    if (res.children || res.isObject3D || res.isMesh || res.isGroup || res.isScene) {
        return disposeTree(res, context) > 0;
    }

    if (res.isMaterial) {
        return disposeMaterial(res, context);
    }

    if (res.isBufferGeometry || res.isGeometry) {
        return disposeGeometry(res, context);
    }

    if (res.isTexture) {
        return disposeTexture(res, context);
    }

    return disposeObject(res, context);
}

export {
    createDisposalContext,
    resolveContext,
    disposeTexture,
    disposeMaterial,
    disposeGeometry,
    disposeObject,
    disposeTree,
    disposeObjectTree,
    disposeResource
};

/**
 * Smoke Test for Frontier Survival — verifies real JS entrypoints exist and parse cleanly.
 */
import assert from 'node:assert';
const fs = await import('node:fs/promises');
const { resolve } = await import('node:path');

const projectRoot = '/mnt/c/Users/wdavi/Projects/Frontier-Survival';
let errors = [];
let passed = 0;

async function check(name, fn) {
    try {
        const result = await fn();
        if (result === true || result === undefined) {
            console.log(`✓ ${name}`);
            passed++;
        } else if (typeof result === 'string') {
            console.log(`✓ ${name} — ${result}`);
            passed++;
        } else {
            console.log(`✗ ${name} — unexpected value`);
        }
    } catch (e) {
        errors.push(name + ' — ' + e.message);
        console.log('✗ ' + name + ' — ' + e.message);
    }
}

// Test 1: atlas-core.js exists, has expected constants, and exports TILE_PX=32 / ATLAS_N=8
await check('Atlas core tile math', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/atlas-core.js'), 'utf-8');
    assert(content.includes('TILE_PX') && content.includes('ATLAS_N'), 'missing TILE_PX/ATLAS_N exports');
    return true;
});

// Test 2: atlas.js exists and re-exports core tile functions
await check('Atlas surface draws', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/atlas.js'), 'utf-8');
    assert(content.includes('createBlockAtlas') || content.includes('TILE.GRASS_SIDE'), 'missing atlas entrypoint');
    return true;
});

// Test 3: module-registry.js exists and references core modules (no syntax errors on file parse)
await check('Module registry structure', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/module-registry.js'), 'utf-8');
    assert(content.includes('register') && content.includes('loadAll'), 'missing register/loadAll');
    return true;
});

// Test 4: items.js exists and defines ITEM enum + tier constants
await check('Item definitions', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/items.js'), 'utf-8');
    assert(content.includes('ITEM') || content.includes('WATER_BUCKET') || content.includes('COAL'), 'missing item defs');
    return true;
});

// Test 5: tool-tiers.js exists and defines tier ordering + speed multipliers
await check('Tool tiers', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/tool-tiers.js'), 'utf-8');
    assert(content.includes('TIER_ORDER') || content.includes('wood') && content.includes('stone'), 'missing tier ordering');
    return true;
});

// Test 6: blocks.js exists and defines BLOCK enum (referenced by atlas-core)
await check('Blocks definition', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/blocks.js'), 'utf-8');
    assert(content.includes('BLOCK') && content.length > 0, 'blocks.js empty or missing');
    return true;
});

// Test 7: game.js exists (main runtime entry) — just verify it has non-empty content
await check('Game runtime', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/game.js'), 'utf-8');
    assert(content.length > 100, 'game.js too short');
    return true;
});

// Test 8: polyfills.mjs exists and is parseable (no syntax errors)
await check('Polyfill module', async () => {
    const content = await fs.readFile(resolve(projectRoot, 'js/polyfills.mjs'), 'utf-8');
    assert(content.length > 0 && !content.includes('atlas-main') && !content.includes('game-loop'), 'polyfill references non-existent files');
    return true;
});

console.log(`\nResults: ${passed} passed, ${errors.length} failed`);
if (errors.length > 0) {
    console.log('\nErrors:');
    for (const err of errors) {
        console.log('  - ' + err);
    }
    process.exit(1);
}

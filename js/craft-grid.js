/** Pure 3x3 crafting-grid helpers. The runtime owns inventory mutation and UI. */

export const CRAFT_GRID_SIZE = 9;

export function createCraftGrid() {
  return Array.from({ length: CRAFT_GRID_SIZE }, () => null);
}

export function placeCraftGridItem(grid, id, count = 1, index = -1) {
  if (!Array.isArray(grid) || grid.length !== CRAFT_GRID_SIZE || id == null || count <= 0) {
    return { ok: false, grid, error: 'invalid item' };
  }
  const next = grid.map((slot) => (slot ? { ...slot } : null));
  const target = index >= 0 ? index : next.findIndex((slot) => !slot);
  if (target < 0 || target >= CRAFT_GRID_SIZE) return { ok: false, grid, error: 'grid full' };
  const slot = next[target];
  if (slot && slot.id !== id) return { ok: false, grid, error: 'slot occupied' };
  if (slot) slot.count += count;
  else next[target] = { id, count };
  return { ok: true, grid: next, index: target };
}

export function removeCraftGridItem(grid, index) {
  if (!Array.isArray(grid) || index < 0 || index >= CRAFT_GRID_SIZE) return { ok: false, grid, error: 'invalid slot' };
  const next = grid.map((slot) => (slot ? { ...slot } : null));
  const slot = next[index];
  if (!slot) return { ok: false, grid, error: 'empty slot' };
  if (slot.count > 1) slot.count -= 1;
  else next[index] = null;
  return { ok: true, grid: next };
}

export function craftGridIngredients(grid) {
  const counts = new Map();
  for (const slot of grid || []) {
    if (!slot || slot.id == null || slot.count <= 0) continue;
    counts.set(slot.id, (counts.get(slot.id) || 0) + slot.count);
  }
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => a.id - b.id);
}

function sameIngredients(actual, required) {
  if (actual.length !== required.length) return false;
  return actual.every((entry, i) => entry.id === required[i].id && entry.count === required[i].count);
}

export function matchCraftRecipe(grid, recipes, preferredId = null) {
  const actual = craftGridIngredients(grid);
  if (!actual.length) return null;
  const matches = (recipes || []).filter((recipe) => {
    const required = [...(recipe.ingredients || [])].sort((a, b) => a.id - b.id);
    return sameIngredients(actual, required);
  });
  return matches.find((recipe) => recipe.id === preferredId) || matches[0] || null;
}

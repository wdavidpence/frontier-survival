/** Deterministic workbench presentation model. Pure data; no DOM or Three.js. */
import { RECIPES } from './crafting.js?v=422';

const PATTERNS = {
  crafting_table: [0, 1, 3, 4],
  wood_pick: [0, 1, 2, 4, 7],
  wood_axe: [0, 1, 3, 4, 7],
  wood_hoe: [0, 1, 4, 7],
  wood_spade: [1, 4, 7],
  torch: [1, 4],
  torch_plank: [1, 4],
  campfire: [0, 1, 2, 3, 4, 5],
};

function recipeFor(id) {
  return RECIPES.find(recipe => recipe.id === id) || null;
}

/** Return a nine-cell ingredient presentation for a recipe. */
export function workbenchGridForRecipe(id) {
  const recipe = recipeFor(id);
  const grid = Array(9).fill(null);
  if (!recipe) return grid;
  const positions = PATTERNS[id] || Array.from({ length: Math.min(9, recipe.ingredients.length) }, (_, i) => i);
  const expanded = [];
  for (const ingredient of recipe.ingredients) {
    for (let i = 0; i < ingredient.count && expanded.length < 9; i += 1) expanded.push(ingredient.id);
  }
  positions.forEach((position, index) => {
    if (index < expanded.length) grid[position] = expanded[index];
  });
  // Recipes with more ingredients than the named silhouette still get a
  // readable deterministic fill, without replacing the authored positions.
  let cursor = 0;
  for (const idValue of expanded) {
    if (grid.includes(idValue)) continue;
    while (cursor < 9 && grid[cursor] != null) cursor += 1;
    if (cursor >= 9) break;
    grid[cursor] = idValue;
  }
  return grid;
}

export function workbenchOutputForRecipe(id) {
  const result = recipeFor(id)?.results?.[0];
  return result ? { id: result.id, count: result.count } : null;
}

export function workbenchRecipeIds() {
  return RECIPES.map(recipe => recipe.id);
}

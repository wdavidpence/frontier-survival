/** Crafting recipes — pure data + craft helper */
import { BLOCK } from './blocks.js';
import { ITEM } from './items.js';
import { craftWith } from './inventory.js';

/**
 * @typedef {{ id: string, name: string, desc?: string, ingredients: {id:number,count:number}[], results: {id:number,count:number}[] }} Recipe
 */

/** @type {Recipe[]} */
export const RECIPES = [
  {
    id: 'planks',
    name: 'Planks',
    desc: '1 Log → 4 Planks',
    ingredients: [{ id: BLOCK.LOG, count: 1 }],
    results: [{ id: BLOCK.PLANKS, count: 4 }],
  },
  {
    id: 'sticks',
    name: 'Sticks',
    desc: '2 Planks → 4 Sticks',
    ingredients: [{ id: BLOCK.PLANKS, count: 2 }],
    results: [{ id: ITEM.STICK, count: 4 }],
  },
  {
    id: 'torch',
    name: 'Torches',
    desc: '1 Stick + 1 Coal → 4 Torches',
    ingredients: [
      { id: ITEM.STICK, count: 1 },
      { id: ITEM.COAL, count: 1 },
    ],
    results: [{ id: BLOCK.TORCH, count: 4 }],
  },
  {
    id: 'torch_plank',
    name: 'Emergency Torches',
    desc: '1 Stick + 1 Plank → 2 Torches (smoky)',
    ingredients: [
      { id: ITEM.STICK, count: 1 },
      { id: BLOCK.PLANKS, count: 1 },
    ],
    results: [{ id: BLOCK.TORCH, count: 2 }],
  },
  {
    id: 'campfire',
    name: 'Campfire',
    desc: '3 Logs + 3 Sticks → Campfire (heat!)',
    ingredients: [
      { id: BLOCK.LOG, count: 3 },
      { id: ITEM.STICK, count: 3 },
    ],
    results: [{ id: BLOCK.CAMPFIRE, count: 1 }],
  },
  {
    id: 'wood_pick',
    name: 'Wood Pickaxe',
    desc: 'Faster stone & ore. 3 Planks + 2 Sticks',
    ingredients: [
      { id: BLOCK.PLANKS, count: 3 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: ITEM.WOOD_PICK, count: 1 }],
  },
  {
    id: 'wood_axe',
    name: 'Wood Axe',
    desc: 'Faster wood. 3 Planks + 2 Sticks',
    ingredients: [
      { id: BLOCK.PLANKS, count: 3 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: ITEM.WOOD_AXE, count: 1 }],
  },
  {
    id: 'stone_pick',
    name: 'Stone Pickaxe',
    desc: 'Best early mining. 3 Cobble + 2 Sticks',
    ingredients: [
      { id: BLOCK.COBBLE, count: 3 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: ITEM.STONE_PICK, count: 1 }],
  },
  {
    id: 'wood_spear',
    name: 'Wood Spear',
    desc: 'Hunt at reach. 2 Sticks + 1 Plank',
    ingredients: [
      { id: ITEM.STICK, count: 2 },
      { id: BLOCK.PLANKS, count: 1 },
    ],
    results: [{ id: ITEM.WOOD_SPEAR, count: 1 }],
  },
  {
    id: 'stone_axe',
    name: 'Stone Axe',
    desc: 'Faster wood + stronger melee. 3 Cobble + 2 Sticks',
    ingredients: [
      { id: BLOCK.COBBLE, count: 3 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: ITEM.STONE_AXE, count: 1 }],
  },
  {
    id: 'cook_meat',
    name: 'Cook Meat',
    desc: '1 Raw Meat → Cooked Meat (need campfire heat nearby)',
    ingredients: [{ id: ITEM.RAW_MEAT, count: 1 }],
    results: [{ id: ITEM.COOKED_MEAT, count: 1 }],
    requiresHeat: 8,
  },
  {
    id: 'cloth',
    name: 'Cloth',
    desc: '2 Hide → 2 Cloth',
    ingredients: [{ id: ITEM.HIDE, count: 2 }],
    results: [{ id: ITEM.CLOTH, count: 2 }],
  },
  {
    id: 'fur_hat',
    name: 'Fur Hat',
    desc: 'Head warmth +4. 2 Cloth + 1 Hide',
    ingredients: [
      { id: ITEM.CLOTH, count: 2 },
      { id: ITEM.HIDE, count: 1 },
    ],
    results: [{ id: ITEM.FUR_HAT, count: 1 }],
  },
  {
    id: 'wool_coat',
    name: 'Wool Coat',
    desc: 'Chest warmth +8. 4 Cloth + 2 Hide',
    ingredients: [
      { id: ITEM.CLOTH, count: 4 },
      { id: ITEM.HIDE, count: 2 },
    ],
    results: [{ id: ITEM.WOOL_COAT, count: 1 }],
  },
  {
    id: 'fur_boots',
    name: 'Fur Boots',
    desc: 'Feet warmth +3. 2 Cloth + 1 Hide',
    ingredients: [
      { id: ITEM.CLOTH, count: 2 },
      { id: ITEM.HIDE, count: 1 },
    ],
    results: [{ id: ITEM.FUR_BOOTS, count: 1 }],
  },
  {
    id: 'bed',
    name: 'Bed',
    desc: 'Sleep at night (F on bed). 3 Planks + 3 Cloth',
    ingredients: [
      { id: BLOCK.PLANKS, count: 3 },
      { id: ITEM.CLOTH, count: 3 },
    ],
    results: [{ id: BLOCK.BED, count: 1 }],
  },
  {
    id: 'smelt_iron',
    name: 'Smelt Iron',
    desc: '1 Iron Ore → Iron Ingot (need campfire heat)',
    ingredients: [{ id: BLOCK.IRON_ORE, count: 1 }],
    results: [{ id: ITEM.IRON_INGOT, count: 1 }],
    requiresHeat: 10,
  },
  {
    id: 'iron_pick',
    name: 'Iron Pickaxe',
    desc: 'Fast mining. 3 Iron + 2 Sticks',
    ingredients: [
      { id: ITEM.IRON_INGOT, count: 3 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: ITEM.IRON_PICK, count: 1 }],
  },
  {
    id: 'iron_axe',
    name: 'Iron Axe',
    desc: 'Fast wood + hard melee. 3 Iron + 2 Sticks',
    ingredients: [
      { id: ITEM.IRON_INGOT, count: 3 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: ITEM.IRON_AXE, count: 1 }],
  },
  {
    id: 'bow',
    name: 'Bow',
    desc: 'Ranged hunt. 3 Sticks + 2 Hide',
    ingredients: [
      { id: ITEM.STICK, count: 3 },
      { id: ITEM.HIDE, count: 2 },
    ],
    results: [{ id: ITEM.BOW, count: 1 }],
  },
  {
    id: 'arrows',
    name: 'Arrows',
    desc: '4 Arrows. 2 Sticks + 1 Stone cobble',
    ingredients: [
      { id: ITEM.STICK, count: 2 },
      { id: BLOCK.COBBLE, count: 1 },
    ],
    results: [{ id: ITEM.ARROW, count: 4 }],
  },
  {
    id: 'bread',
    name: 'Bread',
    desc: '3 Wheat → Bread',
    ingredients: [{ id: ITEM.WHEAT, count: 3 }],
    results: [{ id: ITEM.BREAD, count: 1 }],
  },
];

export function visibleRecipes() {
  return RECIPES.filter((r) => !r.hidden);
}

export function craftRecipe(slots, recipeId, ctx = {}) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { ok: false, slots, error: 'unknown recipe' };
  if (recipe.requiresHeat && (ctx.heat || 0) < recipe.requiresHeat) {
    return { ok: false, slots, error: 'need campfire heat' };
  }
  return craftWith(slots, recipe.ingredients, recipe.results);
}

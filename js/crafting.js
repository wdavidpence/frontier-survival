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
  ];

export function visibleRecipes() {
  return RECIPES.filter((r) => !r.hidden);
}

export function craftRecipe(slots, recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { ok: false, slots, error: 'unknown recipe' };
  return craftWith(slots, recipe.ingredients, recipe.results);
}

/** Crafting recipes — pure data + craft helper */
import { BLOCK } from './blocks.js?v=202';
import { ITEM } from './items.js?v=202';
import { craftWith } from './inventory.js?v=202';

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
  {
    id: 'chest',
    name: 'Chest',
    desc: 'Storage box. 8 Planks',
    ingredients: [{ id: BLOCK.PLANKS, count: 8 }],
    results: [{ id: BLOCK.CHEST, count: 1 }],
  },
  {
    id: 'ladder',
    name: 'Ladders',
    desc: 'Climb walls. 3 Sticks + 2 Planks → 4',
    ingredients: [
      { id: ITEM.STICK, count: 3 },
      { id: BLOCK.PLANKS, count: 2 },
    ],
    results: [{ id: BLOCK.LADDER, count: 4 }],
  },
  {
    id: 'fence',
    name: 'Fence',
    desc: 'Shelter posts. 4 Planks + 2 Sticks → 4',
    ingredients: [
      { id: BLOCK.PLANKS, count: 4 },
      { id: ITEM.STICK, count: 2 },
    ],
    results: [{ id: BLOCK.FENCE, count: 4 }],
  },
  {
    id: 'boat',
    name: 'Boat',
    desc: 'Hold in water to swim fast. 5 Planks',
    ingredients: [{ id: BLOCK.PLANKS, count: 5 }],
    results: [{ id: ITEM.BOAT, count: 1 }],
  },
  {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    desc: 'F near water to fish. 3 Sticks + 2 Hide',
    ingredients: [
      { id: ITEM.STICK, count: 3 },
      { id: ITEM.HIDE, count: 2 },
    ],
    results: [{ id: ITEM.FISHING_ROD, count: 1 }],
  },
  {
    id: 'cook_fish',
    name: 'Cook Fish',
    desc: 'Raw Fish → Cooked (campfire heat)',
    ingredients: [{ id: ITEM.RAW_FISH, count: 1 }],
    results: [{ id: ITEM.COOKED_FISH, count: 1 }],
    requiresHeat: 8,
  },
  {
    id: 'fertilizer',
    name: 'Fertilizer',
    desc: '2 Rotten Meat → 2 Fertilizer (F on crop)',
    ingredients: [{ id: ITEM.ROTTEN_MEAT, count: 2 }],
    results: [{ id: ITEM.FERTILIZER, count: 2 }],
  },
  {
    id: 'compass',
    name: 'Compass',
    desc: 'Shows exact coords when held. 4 Iron + 1 Coal',
    ingredients: [
      { id: ITEM.IRON_INGOT, count: 4 },
      { id: ITEM.COAL, count: 1 },
    ],
    results: [{ id: ITEM.COMPASS, count: 1 }],
  },
  {
    id: 'shield',
    name: 'Shield',
    desc: 'Hold to blunt wolf bites. 6 Planks + 1 Iron',
    ingredients: [
      { id: BLOCK.PLANKS, count: 6 },
      { id: ITEM.IRON_INGOT, count: 1 },
    ],
    results: [{ id: ITEM.SHIELD, count: 1 }],
  },
  {
    id: 'salve',
    name: 'Healing Salve',
    desc: 'R to heal. 3 Berries + 1 Cloth',
    ingredients: [
      { id: ITEM.BERRIES, count: 3 },
      { id: ITEM.CLOTH, count: 1 },
    ],
    results: [{ id: ITEM.SALVE, count: 1 }],
  },
  {
    id: 'leather_vest',
    name: 'Leather Vest',
    desc: 'Chest armor +6. 5 Hide + 2 Cloth',
    ingredients: [
      { id: ITEM.HIDE, count: 5 },
      { id: ITEM.CLOTH, count: 2 },
    ],
    results: [{ id: ITEM.LEATHER_VEST, count: 1 }],
  },
  {
    id: 'snare',
    name: 'Snare Trap',
    desc: 'Place to wound wildlife. 4 Sticks + 1 Hide',
    ingredients: [
      { id: ITEM.STICK, count: 4 },
      { id: ITEM.HIDE, count: 1 },
    ],
    results: [{ id: BLOCK.SNARE, count: 2 }],
  },
  {
    id: 'arrows_feather',
    name: 'Fletched Arrows',
    desc: '4 Arrows. 2 Sticks + 2 Feathers',
    ingredients: [
      { id: ITEM.STICK, count: 2 },
      { id: ITEM.FEATHER, count: 2 },
    ],
    results: [{ id: ITEM.ARROW, count: 4 }],
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    desc: '1 Log → Charcoal (campfire heat)',
    ingredients: [{ id: BLOCK.LOG, count: 1 }],
    results: [{ id: ITEM.CHARCOAL, count: 2 }],
    requiresHeat: 10,
  },
  {
    id: 'torch_charcoal',
    name: 'Charcoal Torches',
    desc: '1 Stick + 1 Charcoal → 4 Torches',
    ingredients: [
      { id: ITEM.STICK, count: 1 },
      { id: ITEM.CHARCOAL, count: 1 },
    ],
    results: [{ id: BLOCK.TORCH, count: 4 }],
  },
  {
    id: 'pumpkin_soup',
    name: 'Pumpkin Soup',
    desc: 'Hearty meal. 1 Pumpkin + 1 Berries',
    ingredients: [
      { id: ITEM.PUMPKIN, count: 1 },
      { id: ITEM.BERRIES, count: 1 },
    ],
    results: [{ id: ITEM.PUMPKIN_SOUP, count: 1 }],
    requiresHeat: 6,
  },
  { id:'door', name:'Wooden Door', desc:'6 Planks → Door', ingredients:[{id:BLOCK.PLANKS,count:6}], results:[{id:BLOCK.DOOR_CLOSED,count:1}] },
  { id:'glass', name:'Glass', desc:'Smelt sand', ingredients:[{id:BLOCK.SAND,count:1}], results:[{id:BLOCK.GLASS,count:1}], requiresHeat:10 },
  { id:'brick_smelt', name:'Brick', desc:'Smelt clay', ingredients:[{id:ITEM.CLAY_BALL,count:1}], results:[{id:ITEM.BRICK,count:1}], requiresHeat:10 },
  { id:'bricks_block', name:'Bricks', desc:'4 Brick → Bricks block', ingredients:[{id:ITEM.BRICK,count:4}], results:[{id:BLOCK.BRICKS,count:1}] },
  { id:'furnace', name:'Furnace', desc:'8 Cobble → Furnace', ingredients:[{id:BLOCK.COBBLE,count:8}], results:[{id:BLOCK.FURNACE,count:1}] },
  { id:'bandage', name:'Bandage', desc:'2 Cloth → 2 Bandage', ingredients:[{id:ITEM.CLOTH,count:2}], results:[{id:ITEM.BANDAGE,count:2}] },
  { id:'wood_sword', name:'Wood Sword', desc:'2 Planks + 1 Stick', ingredients:[{id:BLOCK.PLANKS,count:2},{id:ITEM.STICK,count:1}], results:[{id:ITEM.WOOD_SWORD,count:1}] },
  { id:'wire', name:'Wire', desc:'1 Iron → 4 Wire (conducts power)', ingredients:[{id:ITEM.IRON_INGOT,count:1}], results:[{id:BLOCK.WIRE,count:4}] },
  { id:'lamp', name:'Lamp', desc:'1 Iron + 2 Glass → Lamp (powered light)', ingredients:[{id:ITEM.IRON_INGOT,count:1},{id:BLOCK.GLASS,count:2}], results:[{id:BLOCK.LAMP,count:1}] },
  { id:'bucket', name:'Bucket', desc:'3 Iron → Bucket', ingredients:[{id:ITEM.IRON_INGOT,count:3}], results:[{id:ITEM.BUCKET,count:1}] },
  { id:'map', name:'Map', desc:'Coords when held. 2 Hide + 1 Coal', ingredients:[{id:ITEM.HIDE,count:2},{id:ITEM.COAL,count:1}], results:[{id:ITEM.MAP,count:1}] },
  { id:'ice_box', name:'Ice Box', desc:'Slows spoilage nearby. 4 Ice + 4 Planks', ingredients:[{id:BLOCK.ICE,count:4},{id:BLOCK.PLANKS,count:4}], results:[{id:ITEM.ICE_BOX,count:1}] },
  { id:'wall', name:'Cobble Wall', desc:'6 Cobble → 6 Walls', ingredients:[{id:BLOCK.COBBLE,count:6}], results:[{id:BLOCK.WALL,count:6}] },
  { id:'generator', name:'Generator', desc:'Power source. 4 Iron + 1 Coal', ingredients:[{id:ITEM.IRON_INGOT,count:4},{id:ITEM.COAL,count:1}], results:[{id:BLOCK.GENERATOR,count:1}] },
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

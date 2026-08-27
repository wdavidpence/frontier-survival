/**
 * Pure crafting-station catalog (MC-breadth). Tags only — no UI/game tick.
 */
import { BLOCK } from './blocks.js?v=295';

/**
 * @typedef {{ id: string, name: string, blockId: number|null, recipeTags: string[], notes?: string }} Station
 */

/** @type {Station[]} */
export const STATIONS = [
  {
    id: 'hand',
    name: 'Hand crafting',
    blockId: null,
    recipeTags: ['basic', 'tools_wood'],
    notes: 'Always available; no block required',
  },
  {
    id: 'workbench',
    name: 'Workbench',
    blockId: BLOCK.PLANKS, // placeholder until dedicated bench block exists
    recipeTags: ['basic', 'tools_wood', 'tools_stone', 'building'],
    notes: 'Uses planks as interim bench marker; dedicated block follow-up',
  },
  {
    id: 'furnace',
    name: 'Furnace',
    blockId: BLOCK.FURNACE,
    recipeTags: ['smelting', 'heat'],
  },
  {
    id: 'campfire',
    name: 'Campfire',
    blockId: BLOCK.CAMPFIRE,
    recipeTags: ['heat', 'cooking'],
  },
  {
    id: 'anvil_stub',
    name: 'Anvil (stub)',
    blockId: null,
    recipeTags: ['repair', 'rename'],
    notes: 'Not placed yet — catalog reserved for progression',
  },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) ?? null;
}

export function stationsForBlock(blockId) {
  return STATIONS.filter((s) => s.blockId != null && s.blockId === blockId);
}

export function stationsWithTag(tag) {
  return STATIONS.filter((s) => s.recipeTags.includes(tag));
}

export function listStationIds() {
  return STATIONS.map((s) => s.id);
}

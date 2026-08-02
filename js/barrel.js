import { generateId, pickRandomColor } from './utils.js';

/**
 * Barrel State
 */
class BarrelState {
  constructor(x = 0, y = 0) {
    this.id = generateId('barrel-');
    this.x = x;
    this.y = y;
    
    // Visual state
    this.color = pickRandomColor();
    this.size = 38;
    this.isOpen = false;
    
    // Loot container for items spawned inside this barrel
    this.lootContainer = {
      items: []
    };
    
    // Track if opened at least once (so re-open doesn't duplicate)
    this._hasBeenOpened = false;
  }
  
  update() {
    return { ...this };
  }
}

/**
 * Barrel Visual Component
 */
class BarrelVisual extends BaseComponent {
  constructor(state, config) {
    super('barrel');
    
    // Store barrel state reference
    this.barrelState = state;
    this.config = config || {};
    
    // Get color from state (or use default if not set)
    this.color = state ? state.color : 'rgba(100, 60, 20, 0.7)';
    
    // Initialize visual properties
    this.x = state ? state.x : config?.x || 0;
    this.y = state ? state.y : config?.y || 0;
    this.size = state ? state.size : config?.size || 38;
    this.isOpen = false; // MC-breadth: whether barrel lid is up
    
    // Loot container reference from state (MC-breadth)
    this.lootContainer = state ? { items: [] } : null;
    
    // Track if opened at least once (so re-open doesn't duplicate)
    this._hasBeenOpened = false;
  }
  
  /**
   * Spawn an item from the barrel
   */
  spawnItem() {
    const state = this.barrelState;
    if (!state || !this.lootContainer) return null;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    // Return existing item or create new one
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: this.x + this.size / 2 + (Math.random() - 0.5) * 10,
      y: this.y + this.size / 2 + (Math.random() - 0.5) * 10,
      color: 'rgba(255, 255, 255, 0.8)',
      size: state.size - 2,
    };
  }
  
  /**
   * Open the barrel (MC-breadth: lid goes up)
   */
  open() {
    const state = this.barrelState;
    if (!state || this._hasBeenOpened) return false;
    
    // MC-breadth: set isOpen flag and mark as opened
    state.isOpen = true;
    this._hasBeenOpened = true;
    
    return true;
  }
  
  /**
   * Update barrel position on screen (px) — only used when rendered separately (e.g. in a queue)
   */
  updatePosition(x, y) {
    const state = this.barrelState;
    if (!state) return false;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      color: this.color,
      size: state.size - 2,
    };
  }
}

/**
 * Barrel UI Component
 */
class BarrelUI extends BaseComponent {
  constructor(state, config) {
    super('barrel-ui');
    
    // Store barrel state reference (MC-breadth)
    this.barrelState = state;
    this.config = config || {};
    
    // Get color from state (or use default if not set)
    this.color = state ? state.color : 'rgba(100, 60, 20, 0.7)';
    
    // Initialize visual properties
    this.x = state ? state.x : config?.x || 0;
    this.y = state ? state.y : config?.y || 0;
    this.size = state ? state.size : config?.size || 38;
    this.isOpen = false; // MC-breadth: whether barrel lid is up
    
    // Loot container reference from state (MC-breadth)
    this.lootContainer = state ? { items: [] } : null;
    
    // Track if opened at least once (so re-open doesn't duplicate)
    this._hasBeenOpened = false;
  }
  
  /**
   * Spawn an item from the barrel
   */
  spawnItem() {
    const state = this.barrelState;
    if (!state || !this.lootContainer) return null;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    // Return existing item or create new one
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: this.x + this.size / 2 + (Math.random() - 0.5) * 10,
      y: this.y + this.size / 2 + (Math.random() - 0.5) * 10,
      color: 'rgba(255, 255, 255, 0.8)',
      size: state.size - 2,
    };
  }
  
  /**
   * Open the barrel (MC-breadth: lid goes up)
   */
  open() {
    const state = this.barrelState;
    if (!state || this._hasBeenOpened) return false;
    
    // MC-breadth: set isOpen flag and mark as opened
    state.isOpen = true;
    this._hasBeenOpened = true;
    
    return true;
  }
  
  /**
   * Update barrel position on screen (px) — only used when rendered separately (e.g. in a queue)
   */
  updatePosition(x, y) {
    const state = this.barrelState;
    if (!state) return false;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      color: this.color,
      size: state.size - 2,
    };
  }
}

/**
 * Barrel HUD Component
 */
class BarrelHUD extends BaseComponent {
  constructor(state, config) {
    super('barrel-hud');
    
    // Store barrel state reference (MC-breadth)
    this.barrelState = state;
    this.config = config || {};
    
    // Get color from state (or use default if not set)
    this.color = state ? state.color : 'rgba(100, 60, 20, 0.7)';
    
    // Initialize visual properties
    this.x = state ? state.x : config?.x || 0;
    this.y = state ? state.y : config?.y || 0;
    this.size = state ? state.size : config?.size || 38;
    this.isOpen = false; // MC-breadth: whether barrel lid is up
    
    // Loot container reference from state (MC-breadth)
    this.lootContainer = state ? { items: [] } : null;
    
    // Track if opened at least once (so re-open doesn't duplicate)
    this._hasBeenOpened = false;
  }
  
  /**
   * Spawn an item from the barrel
   */
  spawnItem() {
    const state = this.barrelState;
    if (!state || !this.lootContainer) return null;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    // Return existing item or create new one
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: this.x + this.size / 2 + (Math.random() - 0.5) * 10,
      y: this.y + this.size / 2 + (Math.random() - 0.5) * 10,
      color: 'rgba(255, 255, 255, 0.8)',
      size: state.size - 2,
    };
  }
  
  /**
   * Open the barrel (MC-breadth: lid goes up)
   */
  open() {
    const state = this.barrelState;
    if (!state || this._hasBeenOpened) return false;
    
    // MC-breadth: set isOpen flag and mark as opened
    state.isOpen = true;
    this._hasBeenOpened = true;
    
    return true;
  }
  
  /**
   * Update barrel position on screen (px) — only used when rendered separately (e.g. in a queue)
   */
  updatePosition(x, y) {
    const state = this.barrelState;
    if (!state) return false;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      color: this.color,
      size: state.size - 2,
    };
  }
}

/**
 * Barrel Queue Component
 */
class BarrelQueue extends BaseComponent {
  constructor(config) {
    super('barrel-queue');
    
    // Store barrel state reference (MC-breadth)
    this.barrelState = config?.barrelState;
    this.config = config || {};
    
    // Get color from state (or use default if not set)
    this.color = config?.color || 'rgba(100, 60, 20, 0.7)';
    
    // Initialize visual properties
    this.x = config?.x || 0;
    this.y = config?.y || 0;
    this.size = config?.size || 38;
    this.isOpen = false; // MC-breadth: whether barrel lid is up
    
    // Loot container reference from state (MC-breadth)
    this.lootContainer = config ? { items: [] } : null;
    
    // Track if opened at least once (so re-open doesn't duplicate)
    this._hasBeenOpened = false;
  }
  
  /**
   * Spawn an item from the barrel
   */
  spawnItem() {
    const state = this.barrelState;
    if (!state || !this.lootContainer) return null;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    // Return existing item or create new one
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: this.x + this.size / 2 + (Math.random() - 0.5) * 10,
      y: this.y + this.size / 2 + (Math.random() - 0.5) * 10,
      color: 'rgba(255, 255, 255, 0.8)',
      size: state.size - 2,
    };
  }
  
  /**
   * Open the barrel (MC-breadth: lid goes up)
   */
  open() {
    const state = this.barrelState;
    if (!state || this._hasBeenOpened) return false;
    
    // MC-breadth: set isOpen flag and mark as opened
    state.isOpen = true;
    this._hasBeenOpened = true;
    
    return true;
  }
  
  /**
   * Update barrel position on screen (px) — only used when rendered separately (e.g. in a queue)
   */
  updatePosition(x, y) {
    const state = this.barrelState;
    if (!state) return false;
    
    // MC-breadth: check if already spawned something (prevents duplicates on re-open)
    const isAlreadyOpened = this._hasBeenOpened || state.isOpen;
    
    return {
      type: 'barrel-item',
      barrelId: state.id,
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      color: this.color,
      size: state.size - 2,
    };
  }
}

// Barrel system barrel registry — barrel inventory system
export const barrelRegistry = []; // barrel inventory system barrel list

/**
 * Create a new barrel instance (barrel inventory system)
 */
function createBarrel(x = 0, y = 0) {
  const state = new BarrelState(x, y);
  const visual = new BarrelVisual(state);
  
  return {
    // State management — barrel inventory system
    state: visual.barrelState,
    visual: visual,
    
    // Spawn an item from the barrel (barrel inventory system)
    spawnItem() {
      return visual.spawnItem();
    },
    
    // Open the barrel (MC-breadth: lid goes up — barrel inventory system)
    open() {
      const result = visual.open();
      
      if (result) {
        console.log('Barrel opened (barrel inventory system)');
      }
      
      return result;
    },
  };
}

/**
 * Get the barrel at position x, y — barrel inventory system
 */
export function getBarrelAt(x, y) {
  const state = new BarrelState();
  
  // Return existing item or create new one (barrel inventory system)
  return {
    type: 'barrel-item',
    barrelId: state.id,
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    color: state.color,
    size: state.size - 2,
  };
}

/**
 * Update barrel position on screen (px) — only used when rendered separately (e.g. in a queue)
 */
export function updateBarrelPosition(barrel, x, y) {
  const visual = new BarrelVisual(barrel.state);
  
  return visual.updatePosition(x, y);
}

// Export barrel system for use across modules
export default {
  createBarrel: createBarrel,
  getBarrelAt: getBarrelAt,
  updateBarrelPosition: updateBarrelPosition,
};

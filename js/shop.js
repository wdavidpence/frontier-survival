/**
 * Frontier Survival - Shop System
 * Manages item sales, currency, and player inventory upgrades
 */

const Shop = {
  // Currency types
  currencies: ['gold', 'gems'],
  
  // Shop categories with items
  categories: {
    tools: [
      {id: 'sword_basic', name: 'Basic Sword', desc: 'A simple iron sword', cost: {gold: 10, gems: 0}, stats: {attack: 5}, type: 'tool'},
      {id: 'sword_metal', name: 'Metal Sword', desc: 'Sharpened metal blade', cost: {gold: 30, gems: 2}, stats: {attack: 12}, type: 'tool'},
      {id: 'bow_basic', name: 'Basic Bow', desc: 'A simple wooden bow', cost: {gold: 20, gems: 0}, stats: {range: 40}, type: 'tool'},
      {id: 'crossbow', name: 'Crossbow', desc: 'Powerful repeating crossbow', cost: {gold: 60, gems: 5}, stats: {attack: 15, range: 80}, type: 'tool'}
    ],
    armor: [
      {id: 'leather_helmet', name: 'Leather Helmet', desc: 'Basic head protection', cost: {gold: 25, gems: 0}, stats: {defense: 3}, type: 'armor'},
      {id: 'chainmail', name: 'Chainmail', desc: 'Metal chain armor', cost: {gold: 80, gems: 10}, stats: {defense: 12}, type: 'armor'},
      {id: 'shield_basic', name: 'Basic Shield', desc: 'Wooden shield with metal rim', cost: {gold: 35, gems: 1}, stats: {defense: 8, block: true}, type: 'armor'}
    ],
    buildings: [
      {id: 'workbench', name: 'Workbench', desc: 'Craft better tools at home base', cost: {gold: 100, gems: 5}, stats: {}, type: 'building'},
      {id: 'furnace', name: 'Furnace', desc: 'Smelt metal and craft advanced gear', cost: {gold: 200, gems: 15}, stats: {}, type: 'building'},
      {id: 'blacksmith', name: 'Blacksmith', desc: 'Forge powerful weapons and armor', cost: {gold: 400, gems: 30}, stats: {}, type: 'building'}
    ],
    food: [
      {id: 'healing_potion_basic', name: 'Basic Healing Potion', desc: 'Restores 20 health', cost: {gold: 8, gems: 0}, effects: {healthRestore: 20}, type: 'consumable'},
      {id: 'strength_meal', name: 'Strength Meal', desc: 'Boosts attack for 30 minutes', cost: {gold: 15, gems: 1}, effects: {attackBonus: 10, duration: 30}, type: 'consumable'}
    ]
  },
  
  // Player's shop state
  playerShop: null,
  
  /**
   * Initialize the shop system
   */
  init() {
    this.playerShop = {
      gold: 50, gems: 10,
      inventory: {},
      purchasedItems: []
    };
    
    // Load saved progress if exists
    try {
      const saved = localStorage.getItem('frontier_survival_progress');
      if (saved) {
        const playerData = JSON.parse(saved);
        this.playerShop = {...this.playerShop, ...playerData.shop};
      }
    } catch(e) {}
  },
  
  /**
   * Buy an item from the shop
   */
  buyItem(itemId) {
    // Check if already owned
    if (this.playerShop.inventory[itemId]) {
      return {success: false, message: 'Already owns this item!'};
    }
    
    const categoryItems = Object.values(this.categories).flat();
    const item = categoryItems.find(i => i.id === itemId);
    
    if (!item) {
      return {success: false, message: 'Item not found!'};
    }
    
    // Check currency
    if (this.playerShop.gold < item.cost.gold || this.playerShop.gems < item.cost.gems) {
      return {success: false, message: 'Not enough gold/gems!'};
    }
    
    // Deduct currency
    this.playerShop.gold -= item.cost.gold;
    this.playerShop.gems -= item.cost.gems;
    
    // Add to inventory (or upgrade)
    if (!this.playerShop.inventory[itemId]) {
      this.playerShop.inventory[itemId] = {...item};
    } else {
      // Upgrade existing item
      const currentItem = this.playerShop.inventory[itemId];
      this.playerShop.inventory[itemId].stats = {...currentItem.stats, ...item.stats};
      if (item.effects) {
        this.playerShop.inventory[itemId].effects = {...currentItem.effects, ...item.effects};
      }
    }
    
    // Track purchase
    this.playerShop.purchasedItems.push(itemId);
    
    return {success: true, message: 'Purchased successfully!'};
  },
  
  /**
   * Get current gold/gems balance
   */
  getBalance() {
    return {...this.playerShop};
  },
  
  /**
   * Refresh shop items (for dynamic content)
   */
  refreshCategories() {
    // Called when loading the shop UI
  }
};

// Export for use with global scope or module
if (typeof window !== 'undefined') {
  window.Shop = Shop;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = Shop;
}

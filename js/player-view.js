// Pure logic for player view handling. No Three.js dependencies.

export class PlayerView {
  /**
   * @param {Object} options
   * @property {string|number} id - unique player identifier
   * @property {Object} cameraPose - {position: [x,y,z], rotation: [rx,ry,rz]}
   * @property {any} inventoryRef - reference to Inventory instance (opaque)
   * @property {any} survivalRef - reference to Survival instance (opaque)
   * @property {Object} inputDevice - e.g., keyboard/mouse mapping
   * @property {Object} viewportRect - {x, y, width, height}
   */
  constructor({ id, cameraPose = {}, inventoryRef = null, survivalRef = null, inputDevice = {}, viewportRect = {} }) {
    this.id = id;
    this.cameraPose = cameraPose;
    this.inventoryRef = inventoryRef;
    this.survivalRef = survivalRef; // keep original spelling? likely survival
    this.inputDevice = inputDevice;
    this.viewportRect = viewportRect;
  }

  /**
   * Return left half of viewport rect.
   */
  getLeftViewport() {
    const { x, y, width, height } = this.viewportRect;
    return { x: x, y: y, width: Math.floor(width / 2), height: height };
  }

  /**
   * Return right half of viewport rect.
   */
  getRightViewport() {
    const { x, y, width, height } = this.viewportRect;
    return { x: x + Math.floor(width / 2), y: y, width: Math.ceil(width / 2), height: height };
  }
}

// Helper pure functions (no side effects)
/**
 * Split a rect into left and right halves.
 */
export function splitViewport(rect) {
  const half = Math.floor(rect.width / 2);
  return [
    { x: rect.x, y: rect.y, width: half, height: rect.height },
    { x: rect.x + half, y: rect.y, width: rect.width - half, height: rect.height }
  ];
}

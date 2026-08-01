/**
 * Pure pressure-plate entity-on trigger (MC-breadth).
 */

/**
 * @typedef {{ pressed: boolean, power: number }} PressurePlateState
 */

export function createPressurePlate() {
  return { pressed: false, power: 0 };
}

/**
 * Update plate from entity occupancy.
 * @param {PressurePlateState} plate
 * @param {boolean} entityOn
 * @param {number} [powerWhenOn=15]
 */
export function updatePressurePlate(plate, entityOn, powerWhenOn = 15) {
  const on = !!entityOn;
  return {
    pressed: on,
    power: on ? Math.max(1, powerWhenOn | 0) : 0,
  };
}

/**
 * Rising edge: was up, now down.
 */
export function pressurePlatePressedEdge(prev, next) {
  return !!(!prev?.pressed && next?.pressed);
}

/**
 * Falling edge.
 */
export function pressurePlateReleasedEdge(prev, next) {
  return !!(prev?.pressed && !next?.pressed);
}

export function plateOutputsPower(plate) {
  return !!(plate && plate.pressed && (plate.power | 0) > 0);
}

/**
 * @file Pure crop growth table (MC-breadth). Game currently uses ~90s; this catalogs stages.
 */

export const CROP_STAGES = [
  { id: 'seed', min: 0, max: 0.25, label: 'sprout' },
  { id: 'young', min: 0.25, max: 0.6, label: 'growing' },
  { id: 'tall', min: 0.6, max: 1, label: 'almost ripe' },
  { id: 'ripe', min: 1, max: 2, label: 'ripe' },
];

/** Default seconds from plant (0) to ripe (1). */
export const CROP_MATURE_SECONDS = 90;

/**
 * Advance growth fraction.
 * @param {number} g 0..1
 * @param {number} dtSec
 * @param {number} [matureSec=CROP_MATURE_SECONDS]
 * @returns {number} new fraction, clamped to [0,1]
 */
export function advanceCropGrowth(g, dtSec, matureSec = CROP_MATURE_SECONDS) {
  const cur = Math.max(0, Math.min(1, Number(g) || 0));
  const dt = Math.max(0, Number(dtSec) || 0);
  const mature = Math.max(1, Number(matureSec) || CROP_MATURE_SECONDS);
  return Math.min(1, cur + dt / mature);
}

/**
 * Crop growth table with multiplier support.
 */

export function cropStageAt(g) {
  const v = Number(g) || 0;
  for (const s of CROP_STAGES) {
    if (v >= s.min && v < s.max) return s;
  }
  return CROP_STAGES[CROP_STAGES.length - 1];
}

export function isCropRipe(g) {
  return (Number(g) || 0) >= 1;
}

export class GrowthManager {
    constructor() {
        this._multipliers = {};
    }

    /** Set a per-type growth speed multiplier (applied to base time). 1.0 = default. */
    setMultiplier(type, factor) {
        const prev = this._multipliers[type];
        this._multipliers[type] = Number(factor);
        return prev;
    }

    /** Get the current multiplier for a crop type (default 1.0). */
    getMultiplier(type) {
        return this._multipliers[type] ?? 1.0;
    }

    /** Reset all multipliers to default (1.0). */
    resetMultipliers() {
        Object.keys(this._multipliers).forEach(k => delete this._multipliers[k]);
    }

    /** Clear a specific type's multiplier so it reverts to 1.0. */
    clearMultiplier(type) {
        const prev = this._multipliers[type];
        if (prev === undefined || prev === 1.0) return;
        delete this._multipliers[type];
        return prev;
    }

    /** Get effective growth time for a type in ms, accounting for multiplier. */
    getGrowthTime(type, baseMs = CROP_MATURE_SECONDS * 1000) {
        let effective = Number(baseMs);
        if (this._multipliers[type]) {
            effective = Math.round(effective * this._multipliers[type]);
        }
        return effective;
    }

    /** Get remaining time until crop matures. */
    getTimeUntilMature() {
        return this._remaining;
    }

    /**
     * Reset growth to default for the given crop type.
     */
    resetForType(type) {
        const prev = this._multipliers[type];
        if (prev !== undefined && prev !== 1.0) {
            delete this._multipliers[type];
            return true;
        }
        return false;
    }

    /** Get all active multipliers as a map-like object. */
    getMultipliers() {
        const result = {};
        for (const [k, v] of Object.entries(this._multipliers)) {
            if (v !== 1.0) result[k] = v;
        }
        return result;
    }

    /** Check if there are any non-default multipliers active. */
    hasActiveMultipliers() {
        for (const v of Object.values(this._multipliers)) {
            if (v !== 1.0) return true;
        }
        return false;
    }
}

export default { CROP_STAGES, CROP_MATURE_SECONDS, advanceCropGrowth, cropStageAt, isCropRipe, GrowthManager };

/**
 * Pure wetness helper — rain accumulation, fire drying, movement penalty.
 */

/**
 * Clamp value to [0, 1].
 */
export function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}

/**
 * Increase wetness from rain over dt seconds.
 * @param {number} wetness current wetness [0, 1]
 * @param {number} dtSec elapsed seconds
 * @param {number} rate rain rate per second (default 0.05)
 * @returns {number} new wetness clamped to [0, 1]
 */
export function applyRain(wetness, dtSec, rate = 0.05) {
    return clamp01(wetness + rate * dtSec);
}

/**
 * Decrease wetness near a fire source.
 * @param {number} wetness current wetness [0, 1]
 * @param {number} dtSec elapsed seconds
 * @param {number} rate dry rate per second (default 0.1)
 * @returns {number} new wetness clamped to [0, 1]
 */
export function dryNearFire(wetness, dtSec, rate = 0.1) {
    return clamp01(wetness - rate * dtSec);
}

/**
 * Movement speed penalty from wetness.
 * @param {number} wetness current wetness [0, 1]
 * @returns {number} speed multiplier in [0.7, 1]
 */
export function movePenalty(wetness) {
    return 1 - 0.3 * clamp01(wetness);
}

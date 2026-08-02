/**
 * Redstone dust signal helper — pure math for redstone line propagation.
 *
 * Contract:
 *   clampSignal(n)        -> int in [0, 15]
 *   dustFalloff(signal)   -> max(0, clampSignal(signal) - 1)
 *   propagateLine(startSignal, length) -> array of `length` values where each
 *     step subtracts 1 (clamped at 0).
 *
 *   Examples:
 *     dustFalloff(15) === 14
 *     dustFalloff(0)  === 0
 *     propagateLine(15, 3) === [15, 14, 13]
 */

/**
 * Clamp an integer to the redstone signal range [0, 15].
 * @param {number} n
 * @returns {number}
 */
function clampSignal(n) {
    return Math.max(0, Math.min(15, n | 0));
}

/**
 * One-step redstone dust falloff.
 * @param {number} signal
 * @returns {number}
 */
function dustFalloff(signal) {
    return clampSignal(signal) - 1;
}

/**
 * Propagate a redstone line: each step drops by one until it hits zero.
 * @param {number} startSignal
 * @param {number} length
 * @returns {number[]}
 */
function propagateLine(startSignal, length) {
    const out = new Array(length);
    let s = clampSignal(startSignal);
    for (let i = 0; i < length; i++) {
        out[i] = s;
        s = dustFalloff(s);
    }
    return out;
}

module.exports = { clampSignal, dustFalloff, propagateLine };

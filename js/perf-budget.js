/**
 * Pure frame-budget telemetry. No DOM, Three.js, timers, or I/O.
 * Samples write into a fixed ring; stats copy into a preallocated scratch buffer.
 */

/** Target frame times (ms) for each quality tier. */
export const FRAME_BUDGET_MS = Object.freeze({
  visual: 16.7,
  balanced: 22,
  performance: 33.3,
});

const TIER_RANK = Object.freeze({ visual: 0, balanced: 1, performance: 2 });
const DEFAULT_SIZE = 120;
const MAX_SIZE = 1024;

function finiteNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampSize(size) {
  const n = Math.floor(finiteNumber(size, DEFAULT_SIZE));
  if (n < 1) return DEFAULT_SIZE;
  return n > MAX_SIZE ? MAX_SIZE : n;
}

/**
 * Allocate a fixed-capacity ring of frame times (ms).
 * @param {number} [size=120]
 * @returns {{size:number,index:number,count:number,samples:Float64Array,scratch:Float64Array}}
 */
export function createFrameBudget(size = DEFAULT_SIZE) {
  const n = clampSize(size);
  return {
    size: n,
    index: 0,
    count: 0,
    samples: new Float64Array(n),
    scratch: new Float64Array(n),
  };
}

function isBudgetState(state) {
  return !!(
    state &&
    typeof state === 'object' &&
    state.samples instanceof Float64Array &&
    state.scratch instanceof Float64Array &&
    state.samples.length > 0 &&
    state.scratch.length >= state.samples.length
  );
}

/**
 * Record one frame time. Mutates only bounded numeric fields; no allocation.
 * Non-finite samples are ignored.
 * @param {ReturnType<typeof createFrameBudget>} state
 * @param {number} deltaMs
 */
export function recordFrameSample(state, deltaMs) {
  if (!isBudgetState(state)) return;
  const sample = Number(deltaMs);
  if (!Number.isFinite(sample)) return;
  const ms = sample < 0 ? 0 : sample;
  const cap = state.samples.length;
  const i = state.index | 0;
  const filled = state.count | 0;
  state.samples[i] = ms;
  state.index = i + 1 >= cap ? 0 : i + 1;
  if (filled < cap) state.count = filled + 1;
}

/**
 * Empty-safe summary of recorded frame times.
 * @param {ReturnType<typeof createFrameBudget>|null|undefined} state
 * @returns {{count:number,median:number,p95:number,max:number,average:number}}
 */
export function frameStats(state) {
  if (!isBudgetState(state)) {
    return { count: 0, median: 0, p95: 0, max: 0, average: 0 };
  }
  const count = state.count | 0;
  if (count <= 0) {
    return { count: 0, median: 0, p95: 0, max: 0, average: 0 };
  }
  const n = count > state.samples.length ? state.samples.length : count;
  const scratch = state.scratch;
  let max = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = state.samples[i];
    scratch[i] = v;
    sum += v;
    if (v > max) max = v;
  }
  const filled = scratch.subarray(0, n);
  filled.sort();
  const mid = n >> 1;
  const median = n & 1 ? filled[mid] : (filled[mid - 1] + filled[mid]) * 0.5;
  const p95Index = Math.min(n - 1, Math.max(0, Math.ceil(0.95 * n) - 1));
  const p95 = filled[p95Index];
  return {
    count: n,
    median,
    p95,
    max,
    average: sum / n,
  };
}

function normalizePreferred(preferred) {
  return TIER_RANK[preferred] != null ? preferred : 'balanced';
}

function measuredTier(p95, max) {
  const visual = FRAME_BUDGET_MS.visual;
  const balanced = FRAME_BUDGET_MS.balanced;
  const performance = FRAME_BUDGET_MS.performance;
  if (p95 <= visual && max <= balanced) return 'visual';
  if (p95 <= balanced && max <= performance) return 'balanced';
  return 'performance';
}

/**
 * Pick visual/balanced/performance from p95 and max.
 * Never upgrades above `preferred`. Never throws.
 * @param {{p95?:number,max?:number}|null|undefined} stats
 * @param {string} [preferred='balanced']
 * @returns {'visual'|'balanced'|'performance'}
 */
export function qualityTierForStats(stats, preferred = 'balanced') {
  const pref = normalizePreferred(preferred);
  if (!stats || typeof stats !== 'object') return pref;
  const p95 = finiteNumber(stats.p95, 0);
  const max = finiteNumber(stats.max, p95);
  const measured = measuredTier(p95, max);
  return TIER_RANK[measured] > TIER_RANK[pref] ? measured : pref;
}

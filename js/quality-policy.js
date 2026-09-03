/**
 * Graphics quality preset policy module for Frontier Survival.
 * Pure module without DOM, Three.js, timers, random, or side effects.
 */

export const GRAPHICS_QUALITY = Object.freeze({
  PERFORMANCE: 'performance',
  BALANCED: 'balanced',
  VISUAL: 'visual',
  performance: 'performance',
  balanced: 'balanced',
  visual: 'visual',
});

/**
 * Normalizes an arbitrary value into a valid graphics quality preset string.
 * Defaults safely to 'balanced' if invalid, missing, or null.
 *
 * @param {*} value
 * @returns {'performance'|'balanced'|'visual'}
 */
export function normalizeGraphicsQuality(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'performance' || normalized === 'balanced' || normalized === 'visual') {
      return normalized;
    }
  }
  return GRAPHICS_QUALITY.BALANCED;
}

/**
 * Quality settings definitions by environment profile and preset level.
 * Monotonic across presets (performance <= balanced <= visual)
 * and cost-reducing for mobile / coop environments.
 */
const QUALITY_PRESETS = Object.freeze({
  desktop: Object.freeze({
    performance: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 0,
      cloudDensity: 0.2,
      particleCap: 100,
      renderDistance: 32,
      streamRadius: 3,
      waterGlitter: false,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 512,
      cloudDensity: 0.35,
      particleCap: 160,
      renderDistance: 64,
      streamRadius: 5,
      waterGlitter: false,
    }),
    visual: Object.freeze({
      pixelRatioCap: 2.0,
      shadowMapSize: 1536,
      cloudDensity: 1.0,
      particleCap: 1000,
      renderDistance: 160,
      streamRadius: 12,
      waterGlitter: true,
    }),
  }),
  mobile: Object.freeze({
    performance: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 0,
      cloudDensity: 0.1,
      particleCap: 40,
      renderDistance: 32,
      streamRadius: 3,
      waterGlitter: false,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 512,
      cloudDensity: 0.25,
      particleCap: 120,
      renderDistance: 96,
      streamRadius: 6,
      waterGlitter: false,
    }),
    visual: Object.freeze({
      pixelRatioCap: 1.25,
      shadowMapSize: 1024,
      cloudDensity: 0.5,
      particleCap: 400,
      renderDistance: 192,
      streamRadius: 10,
      waterGlitter: false,
    }),
  }),
  coop: Object.freeze({
    performance: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 0,
      cloudDensity: 0.15,
      particleCap: 70,
      renderDistance: 32,
      streamRadius: 3,
      waterGlitter: false,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.25,
      shadowMapSize: 1024,
      cloudDensity: 0.4,
      particleCap: 210,
      renderDistance: 108,
      streamRadius: 8,
      waterGlitter: false,
    }),
    visual: Object.freeze({
      pixelRatioCap: 1.5,
      shadowMapSize: 1024,
      cloudDensity: 0.8,
      particleCap: 700,
      renderDistance: 216,
      streamRadius: 11,
      waterGlitter: false,
    }),
  }),
  mobile_coop: Object.freeze({
    performance: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 0,
      cloudDensity: 0.08,
      particleCap: 30,
      renderDistance: 40,
      streamRadius: 3,
      waterGlitter: false,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 256,
      cloudDensity: 0.2,
      particleCap: 90,
      renderDistance: 80,
      streamRadius: 7,
      waterGlitter: false,
    }),
    visual: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 512,
      cloudDensity: 0.4,
      particleCap: 300,
      renderDistance: 160,
      streamRadius: 12,
      waterGlitter: false,
    }),
  }),
});

/**
 * Returns deterministic graphics settings for a given quality level and optional environment flags.
 *
 * @param {*} value - Quality preset (e.g. 'performance', 'balanced', 'visual')
 * @param {Object} [options]
 * @param {boolean} [options.mobile=false] - If true, reduces rendering cost for mobile devices.
 * @param {boolean} [options.coop=false] - If true, reduces rendering cost for multiplayer/coop.
 * @returns {{pixelRatioCap: number, shadowMapSize: number, cloudDensity: number, particleCap: number, renderDistance: number, waterGlitter: boolean}}
 */
export function qualitySettings(value, { mobile = false, coop = false } = {}) {
  const quality = normalizeGraphicsQuality(value);
  const isMobile = Boolean(mobile);
  const isCoop = Boolean(coop);

  let profileKey = 'desktop';
  if (isMobile && isCoop) {
    profileKey = 'mobile_coop';
  } else if (isMobile) {
    profileKey = 'mobile';
  } else if (isCoop) {
    profileKey = 'coop';
  }

  return { ...QUALITY_PRESETS[profileKey][quality] };
}

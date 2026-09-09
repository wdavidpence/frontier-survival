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
      pbr: 0,
      volumetricFog: 0,
      waterReflect: 0.15,
      sunShafts: 0,
      sss: 0,
      voxelLight: 0.35,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 512,
      cloudDensity: 0.35,
      particleCap: 160,
      renderDistance: 64,
      streamRadius: 5,
      waterGlitter: false,
      pbr: 0.45,
      volumetricFog: 0.4,
      waterReflect: 0.55,
      sunShafts: 0.35,
      sss: 0.4,
      voxelLight: 0.7,
    }),
    visual: Object.freeze({
      pixelRatioCap: 2.0,
      shadowMapSize: 1536,
      cloudDensity: 1.0,
      particleCap: 1000,
      renderDistance: 160,
      streamRadius: 12,
      waterGlitter: true,
      pbr: 1,
      volumetricFog: 0.85,
      waterReflect: 1,
      sunShafts: 0.8,
      sss: 1,
      voxelLight: 1,
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
      pbr: 0,
      volumetricFog: 0,
      waterReflect: 0.1,
      sunShafts: 0,
      sss: 0,
      voxelLight: 0.3,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 512,
      cloudDensity: 0.25,
      particleCap: 120,
      renderDistance: 96,
      streamRadius: 6,
      waterGlitter: false,
      pbr: 0.3,
      volumetricFog: 0.25,
      waterReflect: 0.4,
      sunShafts: 0.2,
      sss: 0.25,
      voxelLight: 0.55,
    }),
    visual: Object.freeze({
      pixelRatioCap: 1.25,
      shadowMapSize: 1024,
      cloudDensity: 0.5,
      particleCap: 400,
      renderDistance: 192,
      streamRadius: 10,
      waterGlitter: false,
      pbr: 0.7,
      volumetricFog: 0.55,
      waterReflect: 0.7,
      sunShafts: 0.45,
      sss: 0.7,
      voxelLight: 0.85,
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
      pbr: 0,
      volumetricFog: 0,
      waterReflect: 0.12,
      sunShafts: 0,
      sss: 0,
      voxelLight: 0.3,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.25,
      shadowMapSize: 1024,
      cloudDensity: 0.4,
      particleCap: 210,
      renderDistance: 108,
      streamRadius: 8,
      waterGlitter: false,
      pbr: 0.35,
      volumetricFog: 0.3,
      waterReflect: 0.45,
      sunShafts: 0.22,
      sss: 0.3,
      voxelLight: 0.6,
    }),
    visual: Object.freeze({
      pixelRatioCap: 1.5,
      shadowMapSize: 1024,
      cloudDensity: 0.8,
      particleCap: 700,
      renderDistance: 216,
      streamRadius: 11,
      waterGlitter: false,
      pbr: 0.75,
      volumetricFog: 0.6,
      waterReflect: 0.8,
      sunShafts: 0.5,
      sss: 0.75,
      voxelLight: 0.9,
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
      pbr: 0,
      volumetricFog: 0,
      waterReflect: 0.08,
      sunShafts: 0,
      sss: 0,
      voxelLight: 0.25,
    }),
    balanced: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 256,
      cloudDensity: 0.2,
      particleCap: 90,
      renderDistance: 80,
      streamRadius: 7,
      waterGlitter: false,
      pbr: 0.22,
      volumetricFog: 0.18,
      waterReflect: 0.3,
      sunShafts: 0.12,
      sss: 0.18,
      voxelLight: 0.45,
    }),
    visual: Object.freeze({
      pixelRatioCap: 1.0,
      shadowMapSize: 512,
      cloudDensity: 0.4,
      particleCap: 300,
      renderDistance: 160,
      streamRadius: 12,
      waterGlitter: false,
      pbr: 0.5,
      volumetricFog: 0.4,
      waterReflect: 0.55,
      sunShafts: 0.28,
      sss: 0.45,
      voxelLight: 0.7,
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
      pbr: 0.5,
      volumetricFog: 0.4,
      waterReflect: 0.55,
      sunShafts: 0.28,
      sss: 0.45,
      voxelLight: 0.7,
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

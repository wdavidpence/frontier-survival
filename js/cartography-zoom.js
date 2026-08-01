/**
 * Pure cartography table map zoom levels (MC-breadth).
 */

export const MAP_ZOOM_MIN = 0;
export const MAP_ZOOM_MAX = 4;

export function clampMapZoom(zoom) {
  const z = Math.floor(Number(zoom) || 0);
  return Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, z));
}

/** Blocks per pixel at zoom level (approx). */
export function mapScaleBlocks(zoom) {
  const z = clampMapZoom(zoom);
  return 1 << z; // 1,2,4,8,16
}

/** Zoom out one step (paper). */
export function cartographyZoomOut(zoom) {
  return clampMapZoom(clampMapZoom(zoom) + 1);
}

/** Zoom in one step if possible. */
export function cartographyZoomIn(zoom) {
  return clampMapZoom(clampMapZoom(zoom) - 1);
}

export function canZoomOut(zoom) {
  return clampMapZoom(zoom) < MAP_ZOOM_MAX;
}

export function canZoomIn(zoom) {
  return clampMapZoom(zoom) > MAP_ZOOM_MIN;
}

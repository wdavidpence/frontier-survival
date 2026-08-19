/** Pure deterministic fish-school poses used by the fishing renderer. */

export const FISH_SCHOOL_COUNT = 5;

export function schoolFishPose(target, clock = 0, index = 0, phase = 'waiting') {
  const t = Math.max(0, Number(clock) || 0);
  const i = Math.max(0, Number(index) || 0);
  const bite = phase === 'bite';
  const angle = t * (bite ? 2.5 : 0.72) + i * (Math.PI * 2 / FISH_SCHOOL_COUNT);
  const radius = (bite ? 0.95 : 1.45) + (i % 2) * 0.34 + Math.sin(t * 1.4 + i) * 0.08;
  return {
    x: target.x + Math.cos(angle) * radius,
    y: target.y + (bite ? 0.12 : 0.07) + Math.sin(t * 2.1 + i) * (bite ? 0.1 : 0.06),
    z: target.z + Math.sin(angle) * radius,
    yaw: -angle + Math.PI / 2,
    scale: bite ? 1.25 : 0.98,
  };
}

export function schoolVisibility(phase) {
  return phase === 'waiting' || phase === 'bite';
}

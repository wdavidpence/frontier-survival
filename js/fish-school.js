/** Pure deterministic fish-school poses used by the fishing renderer. */

export const FISH_SCHOOL_COUNT = 5;

export function schoolFishPose(target, clock = 0, index = 0, phase = 'waiting') {
  const t = Math.max(0, Number(clock) || 0);
  const i = Math.max(0, Number(index) || 0);
  const bite = phase === 'bite';
  const angle = t * (bite ? 1.8 : 0.72) + i * (Math.PI * 2 / FISH_SCHOOL_COUNT);
  const radius = (bite ? 0.75 : 1.25) + (i % 2) * 0.42 + Math.sin(t * 1.4 + i) * 0.08;
  return {
    x: target.x + Math.cos(angle) * radius,
    y: target.y + (bite ? 0.03 : 0.07) + Math.sin(t * 2.1 + i) * 0.06,
    z: target.z + Math.sin(angle) * radius,
    yaw: -angle + Math.PI / 2,
    scale: bite ? 1.08 : 0.86,
  };
}

export function schoolVisibility(phase) {
  return phase === 'waiting' || phase === 'bite';
}

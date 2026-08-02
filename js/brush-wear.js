/**
 * Pure brush durability wear helper.
 */
export const BRUSH_MAX_DUR = 64;
export function brushWear(dur, amount = 1) {
  const d = Math.max(0, (dur == null ? BRUSH_MAX_DUR : dur | 0) - Math.max(0, amount | 0));
  return d;
}
export function brushBroken(dur) {
  return (dur | 0) <= 0;
}
export function brushUsesLeft(dur) {
  return Math.max(0, dur == null ? BRUSH_MAX_DUR : dur | 0);
}

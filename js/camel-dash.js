/**
 * Pure camel dash cooldown helper.
 */
export const CAMEL_DASH_COOLDOWN_SEC = 2.75;
export function camelCanDash(cooldownLeft) {
  return (Number(cooldownLeft) || 0) <= 0;
}
export function camelDashStart(cooldown = CAMEL_DASH_COOLDOWN_SEC) {
  return Math.max(0, Number(cooldown) || CAMEL_DASH_COOLDOWN_SEC);
}
export function camelDashTick(cooldownLeft, dt) {
  return Math.max(0, (Number(cooldownLeft) || 0) - Math.max(0, Number(dt) || 0));
}

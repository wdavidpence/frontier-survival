/**
 * Horse jump + palm-frond glider. Pure velocity helpers.
 */

export function horseJumpVelocity(mounted, wantsJump, onGround, vy, jumpSpeed = 8.2) {
  if (!mounted) return vy;
  if (wantsJump && onGround) return Math.max(Number(vy) || 0, jumpSpeed);
  return vy;
}

export function gliderVelocity(vy, holding, onGround, minSink = -2.4, lift = 6.5) {
  if (onGround || !holding) return vy;
  const v = Number(vy) || 0;
  if (v < minSink) return minSink;
  if (v < 0) return v * 0.72;
  return Math.min(lift, v);
}

export function gliderForwardBoost(holding, onGround, speed, boost = 1.35) {
  if (!holding || onGround) return speed;
  return (Number(speed) || 0) * boost;
}

export function canDeployGlider(heldId, gliderId, falling) {
  return heldId === gliderId && !!falling;
}

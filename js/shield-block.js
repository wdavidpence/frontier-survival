export function blockDamageMult(blocking, baseDamage) {
  return blocking ? baseDamage * 0.5 : baseDamage;
}

export function isBlockingReduced(blocking) {
  return !!blocking;
}

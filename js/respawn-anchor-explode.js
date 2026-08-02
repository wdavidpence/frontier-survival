/**
 * Pure respawn anchor explode-in-dimension helper.
 */
export function respawnAnchorExplodesIn(dimension) {
  const d = String(dimension || '').toLowerCase();
  // charges/explodes outside nether
  return d !== 'nether' && d !== 'the_nether';
}
export function respawnAnchorCanSetSpawn(dimension, charge) {
  if (respawnAnchorExplodesIn(dimension)) return false;
  return (charge | 0) > 0;
}

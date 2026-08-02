/**
 * Pure pottery sherd id catalog.
 */
export const POTTERY_SHERDS = [
  'angler', 'archer', 'arms_up', 'blade', 'brewer', 'burn', 'danger',
  'explorer', 'friend', 'heart', 'heartbreak', 'howl', 'miner', 'mourner',
  'plenty', 'prize', 'sheaf', 'shelter', 'skull', 'snort',
];
export function isPotterySherd(id) {
  return POTTERY_SHERDS.includes(String(id || '').toLowerCase());
}
export function potterySherdCount() {
  return POTTERY_SHERDS.length;
}

/** Small optional-module helpers used by the isolated barrel breadth component. */
let nextId = 0;

export function generateId(prefix = 'id-') {
  nextId = (nextId + 1) >>> 0;
  return `${prefix}${Date.now().toString(36)}-${nextId.toString(36)}`;
}

export function pickRandomColor() {
  const palette = [
    'rgba(116, 78, 42, 0.92)',
    'rgba(138, 88, 48, 0.92)',
    'rgba(92, 68, 44, 0.92)',
    'rgba(156, 102, 54, 0.92)',
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

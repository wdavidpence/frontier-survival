const LABELS = Object.freeze({
  warming: 'Streaming · warming',
  hitching: 'Streaming · hitching',
  playable: 'Streaming · playable',
  steady: 'Streaming · steady',
});

export function streamingConfidenceFromStats(stats, { meshCount = 0 } = {}) {
  const count = Number(stats?.count) || 0;
  if (count < 30) {
    return { id: 'warming', label: LABELS.warming };
  }
  const median = Number(stats?.median);
  const p95 = Number(stats?.p95);
  const max = Number(stats?.max);
  const meshes = Number(meshCount);
  const meshOk = !Number.isFinite(meshes) || meshes >= 0;
  if (!Number.isFinite(median) || !Number.isFinite(p95) || !Number.isFinite(max) || !meshOk) {
    return { id: 'warming', label: LABELS.warming };
  }
  if (max > 50 || p95 > 33.3) {
    return { id: 'hitching', label: LABELS.hitching };
  }
  if (median <= 16.7 && p95 <= 25) {
    return { id: 'steady', label: LABELS.steady };
  }
  return { id: 'playable', label: LABELS.playable };
}

export function streamingConfidenceHudLabel(confidence) {
  const id = confidence?.id;
  return LABELS[id] || LABELS.warming;
}

/**
 * Shareable world codes. Not a network server — clipboard/export continuation.
 */

export function encodeWorldCode(save = {}) {
  const seed = Number.isFinite(save.seed) ? save.seed : 0;
  const mode = String(save.mode || save.playMode || 'solo').slice(0, 8);
  const day = Number.isFinite(save.day) ? save.day : 0;
  const payload = JSON.stringify({
    v: 1,
    seed,
    mode,
    day,
    name: String(save.name || `seed-${seed}`).slice(0, 48),
  });
  if (typeof btoa === 'function') {
    return `FS1.${btoa(unescape(encodeURIComponent(payload))).replace(/=+$/, '')}`;
  }
  return `FS1.${payload}`;
}

export function decodeWorldCode(text) {
  const raw = String(text || '').trim();
  if (!raw.startsWith('FS1.')) return { ok: false, error: 'not-a-world-code' };
  const body = raw.slice(4);
  try {
    let json = body;
    if (typeof atob === 'function' && !body.startsWith('{')) {
      json = decodeURIComponent(escape(atob(body)));
    }
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return { ok: false, error: 'bad-json' };
    return {
      ok: true,
      seed: Number(data.seed) || 0,
      mode: data.mode === 'coop' ? 'coop' : 'solo',
      day: Number(data.day) || 0,
      name: String(data.name || ''),
    };
  } catch (err) {
    return { ok: false, error: 'parse' };
  }
}

export function shareLabel(code) {
  const n = String(code || '');
  if (n.length < 12) return n;
  return `${n.slice(0, 10)}…${n.slice(-4)}`;
}

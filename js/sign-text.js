/**
 * Pure sign text sanitize/truncate (MC-breadth).
 */

export const SIGN_MAX_LINES = 4;
export const SIGN_MAX_CHARS = 45;

/**
 * Sanitize one line: strip control chars, trim, clamp length.
 * @param {unknown} line
 * @param {number} [maxChars=SIGN_MAX_CHARS]
 */
export function sanitizeSignLine(line, maxChars = SIGN_MAX_CHARS) {
  const max = Math.max(1, maxChars | 0);
  let s = String(line ?? '');
  s = s.replace(/[\u0000-\u001F\u007F]/g, '');
  s = s.trim();
  if (s.length > max) s = s.slice(0, max);
  return s;
}

/**
 * Normalize multi-line sign body to at most maxLines sanitized lines.
 * @param {string|string[]} text
 * @param {{ maxLines?: number, maxChars?: number }} [opts]
 */
export function sanitizeSignText(text, opts = {}) {
  const maxLines = Math.max(1, opts.maxLines ?? SIGN_MAX_LINES);
  const maxChars = Math.max(1, opts.maxChars ?? SIGN_MAX_CHARS);
  const raw = Array.isArray(text) ? text.join('\n') : String(text ?? '');
  const parts = raw.split(/\r?\n/);
  const out = [];
  for (const p of parts) {
    if (out.length >= maxLines) break;
    const line = sanitizeSignLine(p, maxChars);
    out.push(line);
  }
  while (out.length < maxLines) out.push('');
  return out.slice(0, maxLines);
}

export function signTextJoined(lines, sep = '\n') {
  return (Array.isArray(lines) ? lines : sanitizeSignText(lines)).join(sep);
}

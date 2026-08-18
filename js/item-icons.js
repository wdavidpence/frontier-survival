const KINDS = Object.freeze(['log', 'tool', 'ore', 'block', 'food', 'map', 'clothing', 'plant', 'container', 'generic']);
const FALLBACK_COLOR = [0.38, 0.47, 0.55];

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

function colorFromInput(color) {
  if (Array.isArray(color) && color.length >= 3) {
    const scale = color.some((value) => Number(value) > 1) ? 255 : 1;
    return color.slice(0, 3).map((value) => clamp(Number(value) / scale));
  }
  if (typeof color === 'string') {
    const value = color.trim();
    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const digits = hex[1].length === 3 ? hex[1].split('').map((digit) => digit + digit).join('') : hex[1];
      return [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16) / 255);
    }
    const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i);
    if (rgb) return rgb.slice(1, 4).map((part) => clamp(Number(part) / 255));
  }
  return FALLBACK_COLOR.slice();
}

function hexChannel(value) {
  return Math.round(clamp(value) * 255).toString(16).padStart(2, '0');
}

function toHex(rgb) {
  return `#${rgb.map(hexChannel).join('')}`;
}

function shade(rgb, amount) {
  return rgb.map((channel) => clamp(channel + amount));
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function palette(color) {
  const base = colorFromInput(color);
  return {
    base: toHex(base),
    light: toHex(shade(base, 0.18)),
    mid: toHex(shade(base, 0.04)),
    dark: toHex(shade(base, -0.2)),
    deep: toHex(shade(base, -0.34)),
    glint: toHex(shade(base, 0.35)),
  };
}

function normalizedParts(itemId, name) {
  const idText = normalizeText(itemId);
  const nameText = normalizeText(name);
  return `${idText} ${nameText}`.trim();
}

/** Return the stable visual family used for an inventory item. */
export function iconKindForItem(itemId, name) {
  const text = normalizedParts(itemId, name);
  if (/(^| )(spruce|sequoia|palm|tree )?log(s)?( |$)/.test(text) || text.includes('wood log')) return 'log';
  if (/(pick|axe|spear|sword|bow|arrow|rod|shield|tool|hammer|scythe)/.test(text)) return 'tool';
  if (/(ore|ingot|coal|sulfur|oil seep|iron)/.test(text) && !text.includes('iron pick') && !text.includes('iron axe')) return 'ore';
  if (/(ration|meat|fish|berry|berries|bread|apple|pumpkin|coconut|egg|salve|bandage|wheat|soup|food)/.test(text)) return 'food';
  if (/(^| )(map|compass)( |$)/.test(text)) return 'map';
  if (/(hat|coat|boots|vest|clothing|cloth|fur|wool|leather|hide)/.test(text)) return 'clothing';
  if (/(seed|plant|crop|wheat|leaf|leaves|kelp|seagrass|mushroom|flower|root|bush)/.test(text)) return 'plant';
  if (/(bucket|chest|container|boat|furnace|ice box|barrel|box)/.test(text)) return 'container';
  if (/(block|stone|cobble|sand|dirt|brick|clay|glass|plank|wood slab|stairs|wall|pumpkin|snow|ice|lamp|wire|door|fence|bedrock|grass)/.test(text)) return 'block';
  return 'generic';
}

function shapeForKind(kind, p) {
  const common = `fill="url(#body)" stroke="${p.deep}" stroke-width="1.4" stroke-linejoin="round"`;
  switch (KINDS.includes(kind) ? kind : 'generic') {
    case 'log':
      return `<g filter="url(#shadow)"><path d="M16 18h30v27H16z" ${common}/><ellipse cx="31" cy="18" rx="15" ry="7" fill="${p.light}" stroke="${p.deep}" stroke-width="1.4"/><ellipse cx="31" cy="18" rx="9" ry="4" fill="${p.mid}" stroke="${p.dark}" stroke-width="1"/><path d="M22 21v19M31 23v17M40 21v18" stroke="${p.dark}" stroke-width="1.1" opacity=".65"/></g>`;
    case 'tool':
      return `<g filter="url(#shadow)"><path d="M29 13l6 2-8 33-6-2z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.4"/><path d="M10 14l11 2 5 7-4 8-8-3-6-8z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.4"/><path d="M13 16l10 2" stroke="${p.glint}" stroke-width="1.4" opacity=".75"/></g>`;
    case 'ore':
      return `<g filter="url(#shadow)"><path d="M11 22l22-10 20 9-22 11z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.3"/><path d="M11 22v22l20 9V32z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.3"/><path d="M31 32l22-11v22l-22 10z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.3"/><path d="M20 27l5-2 3 2-5 3zM39 24l5-2 3 2-5 3zM39 39l6-3v5l-6 3zM18 38l5 2v4l-5-2z" fill="${p.glint}" opacity=".9"/></g>`;
    case 'block':
      return `<g filter="url(#shadow)"><path d="M11 22l21-10 21 10-21 10z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.3"/><path d="M11 22v22l21 10V32z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.3"/><path d="M32 32l21-10v22L32 54z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.3"/><path d="M16 25l12 6M38 29l10-5" stroke="${p.glint}" stroke-width="1.2" opacity=".65"/></g>`;
    case 'food':
      return `<g filter="url(#shadow)"><path d="M17 25c0-7 6-12 14-12s15 5 15 12v11c0 9-6 14-15 14S17 45 17 36z" ${common}/><path d="M31 14c0-5 4-7 8-7" fill="none" stroke="${p.dark}" stroke-width="2.5" stroke-linecap="round"/><path d="M23 25c3-4 7-5 11-4" fill="none" stroke="${p.glint}" stroke-width="2" stroke-linecap="round" opacity=".85"/></g>`;
    case 'map':
      return `<g filter="url(#shadow)"><path d="M10 15l14-5 14 5 16-5v39l-16 5-14-5-14 5z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.5"/><path d="M24 10v39M38 15v39" stroke="${p.dark}" stroke-width="1.3"/><path d="M15 27c6-5 11 2 16-3s8 1 16-4" fill="none" stroke="${p.base}" stroke-width="2"/><path d="M16 35l7-2M40 34l10-3" stroke="${p.glint}" stroke-width="1.7"/></g>`;
    case 'clothing':
      return `<g filter="url(#shadow)"><path d="M21 13l10 5 10-5 9 10-6 7-4-4v22H20V26l-4 4-6-7z" ${common}/><path d="M25 15l6 8 6-8" fill="none" stroke="${p.glint}" stroke-width="1.8"/><path d="M24 34h14" stroke="${p.dark}" stroke-width="1.4"/></g>`;
    case 'plant':
      return `<g filter="url(#shadow)"><path d="M29 49V27" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/><path d="M29 34c-10 1-15-4-15-10 9-1 14 2 15 10zM30 28c2-10 8-14 16-13 0 8-5 13-16 13z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.3"/><path d="M29 48c-8 1-13-2-14-7 7-2 12 0 14 7z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.3"/></g>`;
    case 'container':
      return `<g filter="url(#shadow)"><path d="M15 19h34l-3 32H18z" ${common}/><path d="M12 17h40v8H12z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.4"/><path d="M27 25h10v6H27z" fill="${p.glint}" stroke="${p.dark}" stroke-width="1.1"/><path d="M23 39h18" stroke="${p.dark}" stroke-width="1.6"/></g>`;
    case 'generic':
    default:
      return `<g filter="url(#shadow)"><path d="M32 10l17 8 6 16-6 16-17 7-17-7-6-16 6-16z" ${common}/><path d="M23 25l9-5 9 5-9 5z" fill="${p.glint}" opacity=".8"/><path d="M23 38l9 5 9-5" fill="none" stroke="${p.dark}" stroke-width="1.6"/></g>`;
  }
}

/** Return a deterministic, dependency-free SVG icon without word labels. */
export function iconSvgForItem(itemId, name, color) {
  const kind = iconKindForItem(itemId, name);
  const p = palette(color);
  const title = escapeXml(String(name ?? `Item icon (${kind})`));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${title}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${escapeXml(p.light)}"/><stop offset=".48" stop-color="${escapeXml(p.base)}"/><stop offset="1" stop-color="${escapeXml(p.dark)}"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-color="#000000" flood-opacity=".48"/></filter></defs>${shapeForKind(kind, p)}</svg>`;
}

/** Return a URL-safe data URI for the same deterministic SVG icon. */
export function iconDataUriForItem(itemId, name, color) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvgForItem(itemId, name, color))}`;
}

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

function shapeForItemVariant(itemId, name, p) {
  const text = normalizedParts(itemId, name);
  if (/(pick|pickaxe)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="hero-pickaxe"><path d="M28 52 31 24h5l3 28z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.4"/><path d="M31 28h4l2 22h-4z" fill="${p.base}"/><path d="M12 18c8-8 25-9 39-1l-2 8c-13-5-25-5-35 2z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 19c10-4 20-4 31-1" fill="none" stroke="${p.glint}" stroke-width="2" stroke-linecap="round"/><path d="M23 22h9" stroke="${p.dark}" stroke-width="2" stroke-linecap="round"/><circle cx="33" cy="25" r="1.8" fill="${p.glint}"/></g>`;
  }
  if (/(axe|hatchet)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="hero-axe"><path d="M29 53 32 22h5l2 31z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.4"/><path d="M32 27h4l1 23h-4z" fill="${p.base}"/><path d="M33 15c8-4 16-1 21 5l-5 16c-7 1-13-2-18-7z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.5"/><path d="M37 17c6-1 10 1 14 5" fill="none" stroke="${p.glint}" stroke-width="2" stroke-linecap="round"/><path d="M39 23 49 25" stroke="${p.dark}" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }
  if (/(sword|mace|spear|hammer)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="hero-blade"><path d="M30 45 31 22h4l2 23z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.2"/><path d="M26 45h16v5H26z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.3"/><path d="M29 50h10v4H29z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.2"/><path d="M32 10h5l8 23-12-7z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.5"/><path d="M36 13 42 30l-5-3z" fill="${p.glint}" opacity=".9"/></g>`;
  }
  if (/(diamond|gem)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="diamond-gem"><path d="M12 25 24 12h16l12 13-20 29z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.5"/><path d="M12 25h40L32 54z" fill="${p.base}"/><path d="M24 12l8 13 8-13M12 25l20 2 20-2M24 12l-12 13 20 2 20-2-12-13z" fill="${p.light}" opacity=".9"/><path d="M29 29 22 42M35 29l8 14" stroke="${p.glint}" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  if (/(iron ore|iron ingot|copper ore|copper ingot|coal|charcoal|ore)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="faceted-ore"><path d="M11 28 22 14l18-3 14 14-8 25-20 5-17-13z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.5"/><path d="M11 28 22 14l10 11-7 18z" fill="${p.light}"/><path d="M32 25 40 11l14 14-12 10z" fill="${p.base}"/><path d="M25 43 32 25l10 10-4 20z" fill="${p.mid}"/><path d="M17 28 25 25M42 20l7 5M29 47l6 2" stroke="${p.glint}" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>`;
  }
  if (/(chest|barrel|crate|ice box)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="hero-chest"><path d="M12 25h40v25H12z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.5"/><path d="M12 25c2-10 10-15 20-15s18 5 20 15z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.5"/><path d="M16 27h32v18H16z" fill="url(#body)"/><path d="M21 25v21M43 25v21" stroke="${p.glint}" stroke-width="1.6" opacity=".8"/><rect x="29" y="28" width="7" height="9" rx="1.5" fill="${p.glint}" stroke="${p.deep}" stroke-width="1.2"/><path d="M16 43h32" stroke="${p.dark}" stroke-width="2"/></g>`;
  }
  if (/(furnace|kiln|smelter)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="hero-furnace"><path d="M12 17 32 10l20 7v32l-20 7-20-7z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.5"/><path d="M12 17l20 8 20-8-20-7z" fill="${p.light}"/><path d="M19 29h26v16H19z" fill="${p.deep}" stroke="${p.glint}" stroke-width="1.2"/><path d="M25 34h14v8H25z" fill="#1a2330" stroke="${p.dark}" stroke-width="1.2"/><path d="M28 38c2-5 6-5 8 0-2 4-6 4-8 0z" fill="#f47b38"/><path d="M22 21 32 25l10-4" fill="none" stroke="${p.glint}" stroke-width="1.4"/></g>`;
  }
  if (/(cooked tropical fish)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="tropical-fish"><path d="M11 34c8-12 23-15 38-7l9-5-3 12 3 11-9-6c-15 8-30 6-38 0z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M18 33h34" stroke="#ffd55c" stroke-width="3" stroke-linecap="round"/><path d="M25 25v18M33 23v20M41 26v15" stroke="#f06b45" stroke-width="2" opacity=".9"/><circle cx="19" cy="31" r="2" fill="#fff7d6" stroke="${p.deep}" stroke-width=".8"/><path d="M46 27l7 7-7 7" fill="none" stroke="${p.glint}" stroke-width="1.5"/></g>`;
  }
  if (/(cooked fish)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="cooked-fish"><path d="M12 35c8-12 24-14 39-5l7-5-2 10 2 10-7-5c-15 9-31 7-39-5z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M19 33c9-4 18-4 28 0" fill="none" stroke="#ffd27a" stroke-width="3" stroke-linecap="round"/><path d="M27 27c3 3 4 9 1 13M36 27c3 3 4 8 1 12" fill="none" stroke="${p.dark}" stroke-width="1.4"/><circle cx="19" cy="32" r="2" fill="#fff7d6" stroke="${p.deep}" stroke-width=".8"/></g>`;
  }
  if (/(cooked crab|raw crab)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="crab-claw"><path d="M32 27c-8-9-19-7-22 1-2 6 3 10 10 8l-6 10c-3 5 3 8 7 4l9-10 9 10c4 4 10 1 7-4l-6-10c7 2 12-2 10-8-3-8-14-10-22-1z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M20 30c7 4 17 4 24 0M27 27l5 8 5-8" fill="none" stroke="${p.light}" stroke-width="1.6" stroke-linecap="round"/><circle cx="26" cy="24" r="1.4" fill="${p.glint}"/><circle cx="38" cy="24" r="1.4" fill="${p.glint}"/></g>`;
  }
  if (/(raw fish|fish)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="fish-fillet"><path d="M12 34c8-13 24-15 38-5l7-5-2 10 2 10-7-5c-14 10-30 8-38-5z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5" stroke-linejoin="round"/><path d="M19 34c8-4 17-5 26-2" fill="none" stroke="${p.light}" stroke-width="3" stroke-linecap="round"/><path d="M26 28c4 3 5 9 1 13M33 27c4 4 5 10 1 14" fill="none" stroke="${p.dark}" stroke-width="1.3"/><circle cx="19" cy="32" r="2" fill="#f5fbff"/><circle cx="19" cy="32" r=".8" fill="${p.deep}"/><path d="M44 28l7 6-7 6" fill="none" stroke="${p.glint}" stroke-width="1.4"/></g>`;
  }
  if (/(bread|loaf)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="bread-loaf"><path d="M13 35c0-11 9-20 21-20s18 7 18 17v14H13z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M14 34c4-7 11-11 20-11 8 0 14 4 17 10" fill="${p.light}" stroke="${p.deep}" stroke-width="1.3"/><path d="M25 25l4 6M34 23l3 7M42 26l2 6" stroke="#fff0b3" stroke-width="2" stroke-linecap="round" opacity=".85"/><path d="M18 44h29" stroke="${p.dark}" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  if (/(cooked meat)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="cooked-meat"><path d="M16 28c3-10 13-15 24-11 10 3 15 13 11 23-3 10-14 15-24 11-10-3-15-13-11-23z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M22 29c7-4 15-3 22 2M24 38c6-3 12-2 17 2" fill="none" stroke="#ffd27a" stroke-width="2.3" stroke-linecap="round"/><path d="M27 23l3 5M38 25l-2 5" stroke="${p.light}" stroke-width="1.4" stroke-linecap="round"/><circle cx="42" cy="21" r="2" fill="${p.glint}"/></g>`;
  }
  if (/(raw meat|rotten meat|meat)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="meat-cut"><path d="M18 18c6-5 15-4 19 2 3 4 8 4 11 8 5 7 1 18-7 22-8 4-20 1-25-7-5-8-5-19 2-25z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M25 23c4 1 5 5 3 8M39 32c4 1 5 5 3 8M29 41c3-2 7-2 10 1" fill="none" stroke="${p.light}" stroke-width="1.7" stroke-linecap="round"/><circle cx="42" cy="23" r="2" fill="${p.glint}" opacity=".8"/><path d="M20 48h25" stroke="${p.dark}" stroke-width="1.8" stroke-linecap="round"/></g>`;
  }
  if (/(pumpkin soup|soup)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="pumpkin-soup"><path d="M13 26h38c-2 15-9 23-19 23S15 41 13 26z" fill="#d8762d" stroke="${p.deep}" stroke-width="1.5"/><ellipse cx="32" cy="26" rx="19" ry="7" fill="#f5a33d" stroke="${p.deep}" stroke-width="1.4"/><ellipse cx="32" cy="25" rx="14" ry="4" fill="#ffc967"/><path d="M23 22c4-3 10-3 15 0M27 19c-2-3-1-5 1-7M34 19c-1-3 0-5 2-7" fill="none" stroke="#ffe7a0" stroke-width="1.4" stroke-linecap="round" opacity=".82"/></g>`;
  }
  if (/(egg)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="egg"><path d="M32 10c-9 0-16 12-16 24 0 12 7 19 16 19s16-7 16-19c0-12-7-24-16-24z" fill="#f8f0d5" stroke="${p.deep}" stroke-width="1.5"/><path d="M23 25c3-5 8-7 13-6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".8"/><ellipse cx="38" cy="39" rx="3" ry="5" fill="#e4c98e" opacity=".7"/></g>`;
  }
  if (/(apple|coconut)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="fruit"><path d="M32 19c-13-5-22 5-20 17 2 13 10 20 20 20s18-7 20-20c2-12-7-22-20-17z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M32 19c0-5 4-9 9-10" fill="none" stroke="${p.dark}" stroke-width="2.5" stroke-linecap="round"/><path d="M37 11c5-4 9-3 12 0-5 4-9 4-12 0z" fill="#75b85c" stroke="#386b3b" stroke-width="1"/><path d="M22 27c4-4 9-5 14-4" fill="none" stroke="${p.glint}" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  if (/(wheat)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="wheat-sheaf"><path d="M31 52V22M31 38 20 24M31 33l12-15M31 44l-10-8M31 28l11-8" fill="none" stroke="${p.deep}" stroke-width="2.5" stroke-linecap="round"/><path d="M20 24c-5-5-9-6-13-5 3 6 7 8 13 8zM43 18c4-6 8-8 12-7-2 7-6 10-12 10zM21 36c-5-5-10-6-14-4 3 6 8 8 14 7zM42 27c5-5 10-6 14-4-3 6-8 8-14 7z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.2"/><path d="M31 27 18 24M32 31 45 20M31 39 18 35M33 28 45 27" stroke="${p.glint}" stroke-width="1" stroke-linecap="round" opacity=".8"/></g>`;
  }
  if (/(mushroom)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="mushroom-cap"><path d="M28 29h8v20h-8z" fill="#f6e7bd" stroke="${p.deep}" stroke-width="1.3"/><path d="M13 29c1-12 10-19 19-19s18 7 19 19z" fill="#c74a43" stroke="${p.deep}" stroke-width="1.5"/><circle cx="24" cy="20" r="2" fill="#fff0c5"/><circle cx="36" cy="16" r="2.4" fill="#fff0c5"/><circle cx="43" cy="23" r="1.8" fill="#fff0c5"/><path d="M25 49h14" stroke="#e2c98f" stroke-width="1.5" stroke-linecap="round"/></g>`;
  }
  if (/(palm frond)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="palm-frond"><path d="M31 52c1-12 3-24 7-34" fill="none" stroke="${p.deep}" stroke-width="3" stroke-linecap="round"/><path d="M34 27C23 23 14 16 11 8c12 1 20 7 24 16zM36 24c2-11 8-19 18-23-1 12-7 20-18 23zM37 31c10-5 19-5 27-1-8 8-17 9-27 5zM31 35c-10-1-18 2-24 9 10 3 18 0 24-6z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.25"/><path d="M34 28 17 12M37 25 50 8M38 34 57 31M31 37 13 43" stroke="${p.glint}" stroke-width="1.2" stroke-linecap="round" opacity=".82"/></g>`;
  }
  if (/(seed|seeds|mushroom|flower|plant|leaf|leaves)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="seedling"><path d="M31 51V27" stroke="${p.deep}" stroke-width="3" stroke-linecap="round"/><path d="M31 35c-10 1-16-4-16-11 10-2 16 3 16 11zM32 31c2-10 9-15 17-13-1 9-7 14-17 13z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.4"/><path d="M31 44c-7-2-12-1-15 4 6 4 12 2 15-4z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.2"/><path d="M31 34l-10-7M32 31l11-10" stroke="${p.glint}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>`;
  }
  if (/(fur hat|hat)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="fur-hat"><path d="M14 32c1-13 8-22 18-22s17 9 18 22z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M10 31h44v9H10z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.4"/><path d="M20 25c4-5 13-7 23-3" fill="none" stroke="${p.light}" stroke-width="2" stroke-linecap="round"/><path d="M16 35h32" stroke="${p.glint}" stroke-width="1.6" stroke-linecap="round"/><circle cx="32" cy="20" r="1.6" fill="${p.glint}"/></g>`;
  }
  if (/(fur boots|boots)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="fur-boots"><path d="M15 13h15v25l7 5c4 3 3 9-2 10H13c-5 0-7-5-4-9l6-7z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5"/><path d="M34 13h15v25l7 5c4 3 3 9-2 10H32c-5 0-7-5-4-9l6-7z" fill="${p.dark}" stroke="${p.deep}" stroke-width="1.5"/><path d="M16 22h13M35 22h13" stroke="${p.glint}" stroke-width="2" stroke-linecap="round"/><path d="M12 46h20M34 46h20" stroke="${p.light}" stroke-width="1.5" stroke-linecap="round"/></g>`;
  }
  if (/(leather vest|vest)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="leather-vest"><path d="M22 12l10 7 10-7 10 12-7 7v21H19V31l-7-7z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5" stroke-linejoin="round"/><path d="M22 13l10 17 10-17M32 30v22" fill="none" stroke="${p.light}" stroke-width="2"/><path d="M24 37h16M24 43h16" stroke="${p.glint}" stroke-width="1.2" stroke-linecap="round" opacity=".72"/><circle cx="32" cy="35" r="1.4" fill="${p.glint}"/><circle cx="32" cy="42" r="1.4" fill="${p.glint}"/></g>`;
  }
  if (/(wool coat|coat|clothing|cloth|fur|wool|leather|hide)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="tailored-clothing"><path d="M21 15l11 6 11-6 8 11-6 7-4-4v22H20V29l-4 4-6-7z" fill="${p.base}" stroke="${p.deep}" stroke-width="1.5" stroke-linejoin="round"/><path d="M26 17l6 10 6-10" fill="none" stroke="${p.light}" stroke-width="2"/><path d="M25 33h14M25 39h14M27 45h10" stroke="${p.glint}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/><circle cx="32" cy="34" r="1.2" fill="${p.glint}"/><path d="M20 48h24" stroke="${p.dark}" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  if (/(ration|soup|stew|bowl)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="ration-bowl"><path d="M13 25h38c-2 15-9 24-19 24S15 40 13 25z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.4"/><path d="M17 26h30c-2 10-7 17-15 17S19 36 17 26z" fill="url(#body)" stroke="${p.dark}" stroke-width="1.2"/><ellipse cx="32" cy="25" rx="19" ry="7" fill="${p.light}" stroke="${p.deep}" stroke-width="1.4"/><ellipse cx="32" cy="24" rx="14" ry="4" fill="${p.base}"/><path d="M23 21c4-2 9-2 14 0" stroke="#fff1bf" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></g>`;
  }
  if (/(^| )torch( |$)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="torch-flame"><path d="M27 51 30 27h6l4 24z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.2"/><path d="M30 49 32 28h3l3 21z" fill="${p.base}"/><path d="M32 30c-9-8-4-17 1-23 7 7 13 15 4 23z" fill="#f06a35" stroke="#9b3426" stroke-width="1.1"/><path d="M34 29c-5-5-2-11 0-15 4 5 7 10 2 15z" fill="#ffd266"/><path d="M30 39 36 37" stroke="${p.glint}" stroke-width="1.5" stroke-linecap="round"/></g>`;
  }
  if (/(^| )stick( |$)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="stick"><path d="M14 48 43 15l6 5-29 33z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.3"/><path d="M18 47 45 17l3 3-27 30z" fill="url(#body)"/><path d="M27 36 35 40M35 27 43 31" stroke="${p.dark}" stroke-width="1.4" stroke-linecap="round"/><path d="M42 20 47 18" stroke="${p.glint}" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }
  if (/(berries|berry)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="berry-cluster"><path d="M31 48c-2-8-1-15 4-22" fill="none" stroke="#486b3c" stroke-width="2.5" stroke-linecap="round"/><path d="M34 29c-7 1-12-2-14-7 8-2 13 0 14 7zM35 27c2-7 7-10 13-9-1 7-5 10-13 9z" fill="#5f9e55" stroke="#315c39" stroke-width="1"/><circle cx="22" cy="37" r="8" fill="${p.deep}"/><circle cx="33" cy="36" r="9" fill="${p.dark}"/><circle cx="43" cy="39" r="8" fill="${p.deep}"/><circle cx="27" cy="44" r="8" fill="${p.base}"/><circle cx="38" cy="46" r="8" fill="${p.base}"/><circle cx="24" cy="34" r="2.2" fill="${p.glint}"/><circle cx="35" cy="33" r="2.4" fill="${p.glint}"/><circle cx="45" cy="36" r="2" fill="${p.glint}"/></g>`;
  }
  if (/(water bucket|bucket)/.test(text)) {
    return `<g filter="url(#shadow)" data-item-variant="handled-bucket"><path d="M16 23h33l-4 28H20z" fill="${p.deep}" stroke="${p.deep}" stroke-width="1.4"/><path d="M20 25h25l-3 22H23z" fill="url(#body)"/><path d="M17 22h31v7H17z" fill="${p.light}" stroke="${p.deep}" stroke-width="1.3"/><path d="M22 23c0-13 22-16 27-2" fill="none" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/><path d="M23 35h20" stroke="#8de3ff" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M27 39h12" stroke="${p.glint}" stroke-width="1.5" stroke-linecap="round"/></g>`;
  }
  return '';
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

function materialOverlay(kind, p) {
  const glint = p.glint;
  const light = p.light;
  const dark = p.dark;
  switch (KINDS.includes(kind) ? kind : 'generic') {
    case 'log':
      return `<g data-material-pass="wood-grain" fill="none" stroke-linecap="round"><path d="M19 27c7-3 15-3 24 0M19 34c7-3 15-3 24 0M19 41c7-3 15-3 24 0" stroke="${dark}" stroke-width="1.1" opacity=".78"/><path d="M19 20c5-2 10-2 15 0" stroke="${glint}" stroke-width="1.5" opacity=".85"/></g>`;
    case 'tool':
      return `<g data-material-pass="forged-edge" fill="none" stroke-linecap="round"><path d="M31 15 24 44" stroke="${glint}" stroke-width="1.6" opacity=".9"/><path d="M12 16 22 18" stroke="#e9f5ff" stroke-width="1.4" opacity=".72"/><path d="M15 27 22 29" stroke="${dark}" stroke-width="1.2" opacity=".72"/></g>`;
    case 'ore':
      return `<g data-material-pass="mineral-facets"><path d="m15 24 10-4 4 5-9 5zM36 23l8-4 5 4-8 5zM36 39l8-4 4 4-9 5z" fill="${glint}" opacity=".6"/><path d="M20 30 25 27M39 29 44 26" stroke="${light}" stroke-width="1.4" stroke-linecap="round" opacity=".84"/></g>`;
    case 'block':
      return `<g data-material-pass="block-bevel" fill="none" stroke-linecap="round"><path d="M15 25 32 33 49 25M15 40 32 48 49 40" stroke="${dark}" stroke-width="1.1" opacity=".7"/><path d="M19 23 30 28M38 29 47 25" stroke="${glint}" stroke-width="1.5" opacity=".82"/></g>`;
    case 'food':
      return `<g data-material-pass="food-gloss"><ellipse cx="25" cy="24" rx="7" ry="3" fill="#fff4d6" opacity=".48"/><path d="M22 29c5-3 10-3 15-1" fill="none" stroke="${glint}" stroke-width="1.8" stroke-linecap="round" opacity=".88"/><circle cx="41" cy="39" r="1.4" fill="#ffd27a" opacity=".8"/></g>`;
    case 'map':
      return `<g data-material-pass="paper-fold" fill="none" stroke-linecap="round"><path d="M12 22 22 19M42 21 51 18M13 44 22 41M42 45 50 42" stroke="${glint}" stroke-width="1.5" opacity=".86"/><path d="M25 14v30M39 18v30" stroke="${dark}" stroke-width="1" opacity=".68"/></g>`;
    case 'clothing':
      return `<g data-material-pass="cloth-seams" fill="none" stroke-linecap="round"><path d="M22 29h18M22 34h18M25 39h12" stroke="${glint}" stroke-width="1.2" opacity=".62"/><path d="M31 24v20" stroke="${dark}" stroke-width="1" opacity=".72"/></g>`;
    case 'plant':
      return `<g data-material-pass="leaf-veins" fill="none" stroke="${glint}" stroke-linecap="round"><path d="M16 25 27 29M32 24 43 18M16 40 27 39" stroke-width="1.4" opacity=".8"/></g>`;
    case 'container':
      return `<g data-material-pass="container-rim" fill="none" stroke-linecap="round"><path d="M14 22h36" stroke="${light}" stroke-width="1.5" opacity=".88"/><path d="M20 45h24" stroke="${dark}" stroke-width="1.6" opacity=".8"/><path d="M30 27h5v4h-5z" fill="${glint}" stroke="${dark}" stroke-width=".8"/></g>`;
    default:
      return `<g data-material-pass="generic-facet"><path d="m19 24 13-7 13 7-13 7z" fill="${glint}" opacity=".52"/><path d="M20 40 32 46 44 40" fill="none" stroke="${dark}" stroke-width="1.5" opacity=".74"/></g>`;
  }
}

function itemTextureOverlay(itemId, name, p) {
  const text = normalizedParts(itemId, name);
  if (/(pick|pickaxe|axe|hatchet|sword|mace|spear|hammer)/.test(text)) {
    return `<g data-item-texture="tool-wrap" fill="none" stroke-linecap="round"><path d="M29 35h8M29 40h8M30 45h8" stroke="${p.glint}" stroke-width="1.2" opacity=".72"/><circle cx="33" cy="28" r="1.5" fill="${p.glint}" stroke="${p.deep}" stroke-width=".7"/><path d="M42 18h6M43 22h6" stroke="#f7fbff" stroke-width="1" opacity=".55"/></g>`;
  }
  if (/(diamond|gem)/.test(text)) {
    return `<g data-item-texture="gem-facets" fill="none" stroke="${p.glint}" stroke-linecap="round" opacity=".9"><path d="M24 13 28 25M40 13 36 25M18 27l10 1M46 27l-10 1M27 29l-4 13M37 29l4 13" stroke-width="1.25"/><path d="M29 16 32 22l3-6" stroke="#ffffff" stroke-width="1" opacity=".72"/></g>`;
  }
  if (/(iron ore|iron ingot|copper ore|copper ingot|coal|charcoal|ore)/.test(text)) {
    return `<g data-item-texture="ore-inclusions"><path d="M18 31l4-2 3 2-4 3zM38 17l4-2 3 3-5 2zM38 43l4-2 3 2-4 3z" fill="${p.glint}" opacity=".82"/><path d="M20 38l4-2M43 31l4-2M29 20l4-2" stroke="#f4f8ff" stroke-width="1.1" stroke-linecap="round" opacity=".58"/></g>`;
  }
  if (/(chest|barrel|crate|ice box)/.test(text)) {
    return `<g data-item-texture="container-bands" fill="none" stroke-linecap="round"><path d="M17 31h30M17 39h30" stroke="${p.dark}" stroke-width="1.4" opacity=".72"/><path d="M22 28v18M42 28v18" stroke="${p.glint}" stroke-width="1.1" opacity=".58"/><circle cx="32.5" cy="32" r="1.2" fill="${p.glint}"/></g>`;
  }
  if (/(furnace|kiln|smelter)/.test(text)) {
    return `<g data-item-texture="furnace-vents" fill="${p.glint}" opacity=".74"><circle cx="22" cy="23" r="1.2"/><circle cx="27" cy="25" r="1.2"/><circle cx="37" cy="25" r="1.2"/><circle cx="42" cy="23" r="1.2"/><path d="M21 48h22" stroke="${p.dark}" stroke-width="1.5" stroke-linecap="round"/></g>`;
  }
  if (/(seed|plant|leaf|leaves|kelp|seagrass|mushroom|flower|root|bush)/.test(text)) {
    return `<g data-item-texture="leaf-veins" fill="none" stroke="#d6f29b" stroke-linecap="round" opacity=".72"><path d="M31 47V27M31 34l-10-7M31 31l10-9M31 40l-9-3M31 39l10-5" stroke-width="1.25"/><path d="M25 24c-4-4-8-4-11-2 3 4 7 5 11 2zM37 24c3-5 7-7 11-6-1 5-5 8-11 6z" stroke="#9ed66e" stroke-width="1"/></g>`;
  }
  if (/(hat|coat|boots|vest|clothing|cloth|fur|wool|leather|hide)/.test(text)) {
    return `<g data-item-texture="cloth-stitch" fill="none" stroke-linecap="round"><path d="M22 30h18M22 35h18M25 40h13" stroke="${p.glint}" stroke-width="1.1" opacity=".72"/><path d="M31 24v21M21 28l-5 3M41 28l5 3" stroke="${p.dark}" stroke-width="1.15" opacity=".76"/><circle cx="31" cy="29" r="1" fill="${p.glint}"/></g>`;
  }
  if (/(ration|soup|stew|bowl|food|meat|fish|bread|berry|berries)/.test(text)) {
    return `<g data-item-texture="food-detail" fill="none" stroke="#fff1bf" stroke-linecap="round" opacity=".62"><path d="M26 18c-2-3-1-5 1-7M32 18c-1-3 0-5 2-7M38 18c-1-2 0-4 2-5" stroke-width="1.1"/></g>`;
  }
  return '';
}

function rarityForItem(itemId, name) {
  const text = normalizedParts(itemId, name);
  if (/(diamond|gem|legendary)/.test(text)) return { name: 'legendary', color: '#8fe8ff', dark: '#2d73b4' };
  if (/(iron|map|compass|rare)/.test(text)) return { name: 'rare', color: '#d9a7ff', dark: '#7047a6' };
  if (/(ore|coal|charcoal|chest|furnace|stone pick|stone axe|uncommon)/.test(text)) return { name: 'uncommon', color: '#8de0b0', dark: '#2e765b' };
  return { name: 'common', color: '#000000', dark: '#000000' };
}

function rarityOverlay(rarity) {
  if (rarity.name === 'common') return '';
  if (rarity.name === 'uncommon') {
    return `<g data-rarity-accent="uncommon" fill="none" stroke="${rarity.color}" stroke-linecap="round" opacity=".8"><path d="M14 19v-4h4M50 19v-4h-4M14 45v4h4M50 45v-4h-4" stroke-width="1.5"/><path d="M18 15h5M46 15h-5" stroke="${rarity.dark}" stroke-width="1" opacity=".75"/></g>`;
  }
  if (rarity.name === 'rare') {
    return `<g data-rarity-accent="rare" fill="none" stroke-linecap="round"><path d="M13 21v-6h6M51 21v-6h-6M13 43v6h6M51 43v-6h-6" stroke="${rarity.color}" stroke-width="1.7" opacity=".9"/><path d="M32 10v3M32 51v3M10 32h3M51 32h3" stroke="${rarity.dark}" stroke-width="1.2" opacity=".8"/></g>`;
  }
  return `<g data-rarity-accent="legendary"><circle cx="32" cy="32" r="24" fill="none" stroke="${rarity.dark}" stroke-width="1.2" opacity=".48"/><path d="M32 8v5M32 51v5M8 32h5M51 32h5" stroke="${rarity.color}" stroke-width="1.6" stroke-linecap="round" opacity=".95"/><path d="m48 14 1.8 3.8 3.8 1.8-3.8 1.8L48 25.2l-1.8-3.8-3.8-1.8 3.8-1.8zM16 39l1.3 2.7 2.7 1.3-2.7 1.3-1.3 2.7-1.3-2.7-2.7-1.3 2.7-1.3z" fill="${rarity.color}" opacity=".85"/></g>`;
}

/** Return a deterministic, dependency-free SVG icon without word labels. */
export function iconSvgForItem(itemId, name, color) {
  const kind = iconKindForItem(itemId, name);
  const p = palette(color);
  const title = escapeXml(String(name ?? `Item icon (${kind})`));
  const shadowMode = kind === 'food' || kind === 'plant' || kind === 'map' ? 'soft' : kind === 'container' ? 'grounded' : 'hard';
  const rarity = rarityForItem(itemId, name);
  const itemTexture = itemTextureOverlay(itemId, name, p);
  const groundShadow = `<ellipse data-ground-shadow="${shadowMode}" cx="32" cy="55" rx="19" ry="3.2" fill="#07101d" opacity="${shadowMode === 'soft' ? '.28' : '.42'}"/>`;
  const itemShape = shapeForItemVariant(itemId, name, p) || shapeForKind(kind, p);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${title}" data-rarity="${rarity.name}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${escapeXml(p.light)}"/><stop offset=".48" stop-color="${escapeXml(p.base)}"/><stop offset="1" stop-color="${escapeXml(p.dark)}"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.6" stdDeviation="${shadowMode === 'soft' ? '1.8' : '1.2'}" flood-color="#000000" flood-opacity=".54"/></filter></defs>${groundShadow}${rarityOverlay(rarity)}${itemShape}${itemTexture}${materialOverlay(kind, p)}</svg>`;
}

/** Return a URL-safe data URI for the same deterministic SVG icon. */
export function iconDataUriForItem(itemId, name, color) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvgForItem(itemId, name, color))}`;
}

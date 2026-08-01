/**
 * Pure auto-crafter 3x3 recipe stub (MC 1.21).
 */

/**
 * Flatten 3x3 grid of item ids (null empty) and match simple shaped recipes.
 * @param {(number|null)[]} grid length 9
 * @param {{ pattern: (number|null)[], output: { id: number, count: number } }[]} recipes
 */
export function crafterMatch(grid, recipes = []) {
  const g = Array.isArray(grid) ? grid.slice(0, 9) : [];
  while (g.length < 9) g.push(null);
  const list = Array.isArray(recipes) ? recipes : [];
  for (const r of list) {
    const p = r?.pattern;
    if (!Array.isArray(p) || p.length !== 9) continue;
    let ok = true;
    for (let i = 0; i < 9; i++) {
      const want = p[i] == null ? null : p[i];
      const got = g[i] == null ? null : g[i];
      if (want !== got) {
        ok = false;
        break;
      }
    }
    if (ok && r.output?.id != null) {
      return { id: r.output.id, count: r.output.count || 1 };
    }
  }
  return null;
}

/** Whether crafter should craft this tick (powered edge). */
export function crafterShouldCraft(powered, wasPowered) {
  return !!powered && !wasPowered;
}

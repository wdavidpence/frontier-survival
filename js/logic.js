/**
 * Pure electricity / logic graph helpers (SC-inspired).
 * No DOM, no Three.js — just adjacency graphs and BFS.
 */

// Component types for a logic circuit node.
export const COMPONENT = {
  SOURCE: 'SOURCE', // Emits power unconditionally.
  WIRE: 'WIRE',     // Carries power to neighbours.
  LAMP: 'LAMP',     // Consumer — "on" when powered.
};

/**
 * Run one tick of power propagation over a logic graph.
 *
 * @param {Map<string, {type: string}>} nodes - id → {type}
 * @param {Array<[string, string]>}       edges - bidirectional connections [fromId, toId]
 * @returns {Set<string>} set of node ids that are powered after this tick.
 */
export function tickLogic(nodes, edges) {
  // Build adjacency list (undirected).
  const adj = new Map();

  for (const [from, to] of edges) {
    if (!adj.has(from)) adj.set(from, []);
    if (!adj.has(to)) adj.set(to, []);
    adj.get(from).push(to);
    adj.get(to).push(from);
  }

  const powered = new Set();
  const queue = [];

  // Seed from every SOURCE node.
  for (const [id, node] of nodes) {
    if (node.type === COMPONENT.SOURCE) {
      powered.add(id);
      queue.push(id);
    }
  }

  // BFS: power spreads through every connected edge.
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const neighbors = adj.get(current);
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (!powered.has(neighbor)) {
        powered.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return powered;
}

/**
 * Check whether a specific node id is powered.
 */
export function isPowered(powered, nodeId) {
  return powered.has(nodeId);
}

import type { InventoryItem } from "../api";

export type InventoryTreeRow = InventoryItem & {
  subRows?: InventoryTreeRow[];
};

export function buildItemTree(items: InventoryItem[]): InventoryTreeRow[] {
  const byParent = new Map<string | null, InventoryItem[]>();
  for (const item of items) {
    const key = item.parent_id;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }

  function attach(parentId: string | null): InventoryTreeRow[] {
    const nodes = byParent.get(parentId) ?? [];
    return nodes.map((item) => {
      const children = attach(item.id);
      return {
        ...item,
        subRows: children.length > 0 ? children : undefined,
      };
    });
  }

  return attach(null);
}

export function buildPathMap(items: InventoryItem[]): Map<string, string> {
  const byId = new Map(items.map((it) => [it.id, it]));
  const cache = new Map<string, string>();

  function pathFor(id: string): string {
    const cached = cache.get(id);
    if (cached !== undefined) return cached;

    const parts: string[] = [];
    let cur: InventoryItem | undefined = byId.get(id);
    const seen = new Set<string>();

    while (cur) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      parts.unshift(cur.name ?? "(bez názvu)");
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }

    const result = parts.join(" › ");
    cache.set(id, result);
    return result;
  }

  for (const item of items) {
    pathFor(item.id);
  }
  return cache;
}

export function collectExpandableIds(rows: InventoryTreeRow[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  const walk = (nodes: InventoryTreeRow[]) => {
    for (const node of nodes) {
      if (node._count.children > 0) {
        out[node.id] = true;
        if (node.subRows?.length) walk(node.subRows);
      }
    }
  };
  walk(rows);
  return out;
}

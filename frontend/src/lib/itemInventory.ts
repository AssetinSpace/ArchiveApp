import type { InventoryItem } from "../api";

export type InventoryTreeRow = InventoryItem & {
  subRows?: InventoryTreeRow[];
};

export function buildItemTree(items: InventoryItem[]): InventoryTreeRow[] {
  const idSet = new Set(items.map((it) => it.id));
  const byParent = new Map<string | null, InventoryItem[]>();
  for (const item of items) {
    const key =
      item.parent_id && idSet.has(item.parent_id) ? item.parent_id : null;
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

/** Pri fulltext filtri v strome ponechaj aj predkov zhodných položiek. */
export function includeAncestors(
  allItems: InventoryItem[],
  matching: InventoryItem[],
): InventoryItem[] {
  if (matching.length === 0) return [];
  const byId = new Map(allItems.map((it) => [it.id, it]));
  const include = new Set(matching.map((m) => m.id));
  for (const m of matching) {
    let pid = m.parent_id;
    while (pid) {
      include.add(pid);
      pid = byId.get(pid)?.parent_id ?? null;
    }
  }
  return allItems.filter((it) => include.has(it.id));
}

/** Všetci potomkovia zhodných položiek (celé podstromy). */
export function includeDescendants(
  allItems: InventoryItem[],
  matching: InventoryItem[],
): InventoryItem[] {
  if (matching.length === 0) return [];
  const byParent = new Map<string, InventoryItem[]>();
  for (const item of allItems) {
    if (!item.parent_id) continue;
    const list = byParent.get(item.parent_id) ?? [];
    list.push(item);
    byParent.set(item.parent_id, list);
  }
  const include = new Set(matching.map((m) => m.id));
  const queue = [...matching];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const child of byParent.get(cur.id) ?? []) {
      if (!include.has(child.id)) {
        include.add(child.id);
        queue.push(child);
      }
    }
  }
  return allItems.filter((it) => include.has(it.id));
}

/**
 * Položky viditeľné v strome pri filtroch: predkovia (kontext) + zhody + potomkovia (ďalšie úrovne).
 */
export function itemsForFilteredTree(
  allItems: InventoryItem[],
  matching: InventoryItem[],
): InventoryItem[] {
  if (matching.length === 0) return [];
  const ids = new Set<string>();
  for (const it of includeAncestors(allItems, matching)) ids.add(it.id);
  for (const it of includeDescendants(allItems, matching)) ids.add(it.id);
  return allItems.filter((it) => ids.has(it.id));
}

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function metadataHaystack(metadata: InventoryItem["metadata"]): string {
  if (!metadata || typeof metadata !== "object") return "";
  return Object.values(metadata)
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .join(" ");
}

export function itemMatchesQuery(item: InventoryItem, query: string): boolean {
  const q = stripDiacritics(query.trim());
  if (!q) return true;
  const hay = stripDiacritics(
    [item.name, item.qr_code, item.note, item.ocr_text, metadataHaystack(item.metadata)]
      .filter(Boolean)
      .join(" "),
  );
  return hay.includes(q);
}

/** Vráti snippet z OCR textu ±60 znakov okolo prvého výskytu query. */
export function ocrSnippet(item: InventoryItem, query: string): string | null {
  if (!item.ocr_text || !query.trim()) return null;
  const q = stripDiacritics(query.trim());
  const normOcr = stripDiacritics(item.ocr_text);
  const idx = normOcr.indexOf(q);
  if (idx < 0) return null;
  const start = Math.max(0, idx - 60);
  const end = Math.min(item.ocr_text.length, idx + q.length + 60);
  const raw = item.ocr_text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${raw}${end < item.ocr_text.length ? "…" : ""}`;
}

/** @deprecated use itemMatchesQuery */
export function itemMatchesGlobalFilter(
  item: InventoryItem,
  query: string,
  _labels: unknown,
): boolean {
  return itemMatchesQuery(item, query);
}

/** Počet všetkých nezmazaných potomkov (bez samotnej položky). */
export function countDescendants(
  items: Pick<InventoryItem, "id" | "parent_id">[],
  rootId: string,
): number {
  const byParent = new Map<string, string[]>();
  for (const it of items) {
    if (!it.parent_id) continue;
    const list = byParent.get(it.parent_id) ?? [];
    list.push(it.id);
    byParent.set(it.parent_id, list);
  }
  let count = 0;
  const queue = [...(byParent.get(rootId) ?? [])];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    count++;
    const kids = byParent.get(cur);
    if (kids) queue.push(...kids);
  }
  return count;
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

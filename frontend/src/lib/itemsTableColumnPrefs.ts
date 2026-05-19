const STORAGE_KEY = "archiveapp_items_table_columns_v1";

export type ItemsTableColumnPrefs = {
  hidden: string[];
  shown: string[];
  /** Všetky metadata kľúče, ktoré sa už objavili v inventári alebo po potvrdení v detaile. */
  metadataKeys: string[];
  /** Poradie stĺpcov (bez pinovaných expand/delete — tie sa doplnia automaticky). */
  columnOrder?: string[];
  /** Šírky stĺpcov v px (TanStack columnSizing). */
  columnSizing?: Record<string, number>;
};

const PINNED_COLUMN_START = ["expand"] as const;
const PINNED_COLUMN_END = ["delete"] as const;

const EMPTY: ItemsTableColumnPrefs = {
  hidden: [],
  shown: [],
  metadataKeys: [],
};

function parseColumnSizing(
  raw: unknown,
): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [id, size] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof size === "number" && Number.isFinite(size) && size > 0) {
      out[id] = Math.round(size);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parsePrefs(raw: string | null): ItemsTableColumnPrefs {
  if (!raw) return { ...EMPTY, metadataKeys: [], hidden: [], shown: [] };
  try {
    const data = JSON.parse(raw) as Partial<ItemsTableColumnPrefs>;
    return {
      hidden: Array.isArray(data.hidden)
        ? data.hidden.filter((x): x is string => typeof x === "string" && !!x)
        : [],
      shown: Array.isArray(data.shown)
        ? data.shown.filter((x): x is string => typeof x === "string" && !!x)
        : [],
      metadataKeys: Array.isArray(data.metadataKeys)
        ? data.metadataKeys.filter((x): x is string => typeof x === "string" && !!x.trim())
        : [],
      columnOrder: Array.isArray(data.columnOrder)
        ? data.columnOrder.filter((x): x is string => typeof x === "string" && !!x)
        : undefined,
      columnSizing: parseColumnSizing(data.columnSizing),
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Predvolené poradie dátových stĺpcov (expand/delete sa doplnia v resolveColumnOrder). */
export function defaultItemsTableColumnOrder(metadataKeys: string[]): string[] {
  const meta = metadataKeys.map((k) => `meta_${k}`);
  return [
    "expand",
    "level",
    "kind",
    "name",
    "name_source",
    ...meta,
    "metadata_status",
    "qr_code",
    "status",
    "note",
    "children",
    "photos",
    "created_at",
    "updated_at",
    "delete",
  ];
}

/** Zlúči uložené poradie s aktuálnym zoznamom stĺpcov (nové stĺpce na predvolené miesto). */
export function resolveColumnOrder(
  saved: string[] | undefined,
  defaultOrder: string[],
): string[] {
  const pinnedStart = new Set<string>(PINNED_COLUMN_START);
  const pinnedEnd = new Set<string>(PINNED_COLUMN_END);
  const movableDefaults = defaultOrder.filter(
    (id) => !pinnedStart.has(id) && !pinnedEnd.has(id),
  );

  const orderedMovable: string[] = [];
  const seen = new Set<string>();

  if (saved?.length) {
    for (const id of saved) {
      if (pinnedStart.has(id) || pinnedEnd.has(id)) continue;
      if (movableDefaults.includes(id) && !seen.has(id)) {
        orderedMovable.push(id);
        seen.add(id);
      }
    }
  }

  for (const id of movableDefaults) {
    if (!seen.has(id)) {
      orderedMovable.push(id);
      seen.add(id);
    }
  }

  const endPinned = PINNED_COLUMN_END.filter((id) => defaultOrder.includes(id));
  return [...PINNED_COLUMN_START, ...orderedMovable, ...endPinned];
}

export function isPinnedTableColumn(id: string): boolean {
  return (
    (PINNED_COLUMN_START as readonly string[]).includes(id) ||
    (PINNED_COLUMN_END as readonly string[]).includes(id)
  );
}

export function reorderTableColumns(
  order: string[],
  fromId: string,
  toId: string,
): string[] {
  if (fromId === toId || isPinnedTableColumn(fromId) || isPinnedTableColumn(toId)) {
    return order;
  }
  const movable = order.filter((id) => !isPinnedTableColumn(id));
  const fromIdx = movable.indexOf(fromId);
  const toIdx = movable.indexOf(toId);
  if (fromIdx < 0 || toIdx < 0) return order;
  const nextMovable = [...movable];
  const [removed] = nextMovable.splice(fromIdx, 1);
  nextMovable.splice(toIdx, 0, removed);
  return resolveColumnOrder(nextMovable, order);
}

export function loadItemsTableColumnPrefs(): ItemsTableColumnPrefs {
  try {
    return parsePrefs(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...EMPTY };
  }
}

export function saveItemsTableColumnPrefs(prefs: ItemsTableColumnPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}

/** Po potvrdení metadát v detaile — kľúče ostávajú v ponuke stĺpcov tabuľky. */
export function registerMetadataColumnKeys(keys: string[]): void {
  const trimmed = keys.map((k) => k.trim()).filter(Boolean);
  if (trimmed.length === 0) return;
  const prefs = loadItemsTableColumnPrefs();
  const set = new Set(prefs.metadataKeys);
  for (const k of trimmed) set.add(k);
  saveItemsTableColumnPrefs({
    ...prefs,
    metadataKeys: [...set].sort((a, b) => a.localeCompare(b, "sk")),
  });
}

export function registerMetadataFromRecord(metadata: Record<string, unknown> | undefined): void {
  if (!metadata) return;
  const keys = Object.keys(metadata).filter((k) => {
    const v = metadata[k];
    return typeof v === "string" && v.trim() !== "";
  });
  registerMetadataColumnKeys(keys);
}

/** Jednorazová migrácia starých URL parametrov hide/show → localStorage. */
export function migrateColumnPrefsFromUrl(
  hiddenFromUrl: Set<string>,
  shownFromUrl: Set<string>,
): ItemsTableColumnPrefs {
  const prefs = loadItemsTableColumnPrefs();
  if (hiddenFromUrl.size === 0 && shownFromUrl.size === 0) return prefs;
  const hidden = new Set(prefs.hidden);
  const shown = new Set(prefs.shown);
  for (const id of hiddenFromUrl) hidden.add(id);
  for (const id of shownFromUrl) shown.add(id);
  const next: ItemsTableColumnPrefs = {
    ...prefs,
    hidden: [...hidden],
    shown: [...shown],
  };
  saveItemsTableColumnPrefs(next);
  return next;
}

const STORAGE_KEY = "archiveapp_items_table_columns_v1";

export type ItemsTableColumnPrefs = {
  hidden: string[];
  shown: string[];
  /** Všetky metadata kľúče, ktoré sa už objavili v inventári alebo po potvrdení v detaile. */
  metadataKeys: string[];
};

const EMPTY: ItemsTableColumnPrefs = {
  hidden: [],
  shown: [],
  metadataKeys: [],
};

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
    };
  } catch {
    return { ...EMPTY };
  }
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

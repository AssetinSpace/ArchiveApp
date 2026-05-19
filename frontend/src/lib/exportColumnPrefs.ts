import type { ExportJsonFormat } from "../api";
import { loadItemsTableColumnPrefs } from "./itemsTableColumnPrefs";

const TABLE_DEFAULT_HIDDEN = new Set([
  "updated_at",
  "name_source",
  "metadata_status",
]);

const STORAGE_KEY = "archiveapp_export_columns_v1";

export type ExportColumnPrefs = {
  selected: string[];
  jsonFormat: ExportJsonFormat;
};

const DEFAULT_JSON_FORMAT: ExportJsonFormat = "tree";

const DEFAULT_BASE_IDS = [
  "id",
  "qr_code",
  "name",
  "level",
  "kind",
  "status",
  "path",
  "metadata_status",
];

function parsePrefs(raw: string | null): ExportColumnPrefs | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ExportColumnPrefs>;
    const selected = Array.isArray(data.selected)
      ? data.selected.filter((x): x is string => typeof x === "string" && !!x)
      : [];
    const jsonFormat =
      data.jsonFormat === "flat" || data.jsonFormat === "tree"
        ? data.jsonFormat
        : DEFAULT_JSON_FORMAT;
    return { selected, jsonFormat };
  } catch {
    return null;
  }
}

export function loadExportColumnPrefs(): ExportColumnPrefs | null {
  try {
    return parsePrefs(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveExportColumnPrefs(prefs: ExportColumnPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}

/** Predvolený výber: základné položkové + všetky meta_* z katalógu, bez metadata_json. */
export function defaultExportColumnSelection(catalogIds: string[]): string[] {
  const catalogSet = new Set(catalogIds);
  const base = DEFAULT_BASE_IDS.filter((id) => catalogSet.has(id));
  const meta = catalogIds.filter(
    (id) => id.startsWith("meta_") && catalogSet.has(id),
  );
  return [...base, ...meta];
}

export function resolveInitialExportSelection(
  catalogIds: string[],
): string[] {
  const saved = loadExportColumnPrefs();
  if (saved?.selected.length) {
    const catalogSet = new Set(catalogIds);
    const valid = saved.selected.filter((id) => catalogSet.has(id));
    if (valid.length > 0) return valid;
  }
  return defaultExportColumnSelection(catalogIds);
}

/** Viditeľné stĺpce tabuľky podľa localStorage (rovnaká logika ako ItemsDataTable). */
export function visibleTableColumnIds(tableColumnIds: string[]): Set<string> {
  const prefs = loadItemsTableColumnPrefs();
  const hidden = new Set(prefs.hidden);
  const shown = new Set(prefs.shown);
  const visible = new Set<string>();
  for (const id of tableColumnIds) {
    if (id === "expand" || id === "delete") continue;
    if (shown.has(id)) {
      visible.add(id);
      continue;
    }
    if (hidden.has(id)) continue;
    if (TABLE_DEFAULT_HIDDEN.has(id) && !id.startsWith("meta_")) continue;
    visible.add(id);
  }
  return visible;
}

/** Mapovanie viditeľných stĺpcov inventárnej tabuľky na export ids. */
export function exportColumnsFromTablePrefs(
  catalogIds: string[],
  tableColumnIds: string[],
): string[] {
  const visible = visibleTableColumnIds(tableColumnIds);
  const picked = new Set<string>();
  for (const id of visible) {
    if (id === "children") continue;
    if (id === "photos" && catalogIds.includes("photos")) {
      picked.add("photos");
      continue;
    }
    if (catalogIds.includes(id)) picked.add(id);
  }
  return catalogIds.filter((id) => picked.has(id));
}

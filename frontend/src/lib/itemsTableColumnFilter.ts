import type { InventoryItem } from "../api";
import type { InventoryTreeRow } from "./itemInventory";
import {
  COLUMN_FILTER_EMPTY,
  compareItemsForSort,
  formatCellFilterLabel,
  getCellFilterValue,
} from "./itemsTableCellValue";

export type ColumnFiltersState = Record<string, string[]>;

export type TableSortState = {
  columnId: string;
  desc: boolean;
} | null;

export function normalizeFilterValue(raw: string): string {
  const t = raw.trim();
  return t === "" ? COLUMN_FILTER_EMPTY : t;
}

export function itemPassesColumnFilters(
  item: InventoryItem,
  filters: ColumnFiltersState,
): boolean {
  for (const [columnId, selected] of Object.entries(filters)) {
    if (!selected || selected.length === 0) continue;
    const cell = normalizeFilterValue(getCellFilterValue(item, columnId));
    if (!selected.includes(cell)) return false;
  }
  return true;
}

/** Unikátne hodnoty stĺpca z aktuálnej množiny (pred filtrami tohto stĺpca). */
export function collectColumnUniqueValues(
  items: InventoryItem[],
  columnId: string,
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const v = normalizeFilterValue(getCellFilterValue(item, columnId));
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: formatCellFilterLabel(columnId, value),
      count,
    }))
    .sort((a, b) => {
      if (a.value === COLUMN_FILTER_EMPTY) return 1;
      if (b.value === COLUMN_FILTER_EMPTY) return -1;
      return a.label.localeCompare(b.label, "sk", { sensitivity: "base", numeric: true });
    });
}

export function sortInventoryTree(
  rows: InventoryTreeRow[],
  sort: TableSortState,
): InventoryTreeRow[] {
  if (!sort) return rows;
  const { columnId, desc } = sort;
  const sorted = [...rows].sort((a, b) => compareItemsForSort(a, b, columnId));
  if (desc) sorted.reverse();
  return sorted.map((row) => ({
    ...row,
    subRows:
      row.subRows && row.subRows.length > 0
        ? sortInventoryTree(row.subRows, sort)
        : row.subRows,
  }));
}

const CF_KEY = "cf";
const SORT_KEY = "sort";

function encodeFilterValue(v: string): string {
  return encodeURIComponent(v);
}

function decodeFilterValue(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** URL: cf=kind~SKLAD,KRABICA;name~foo */
export function parseColumnFiltersFromSearchParams(
  params: URLSearchParams,
): ColumnFiltersState {
  const raw = params.get(CF_KEY);
  if (!raw) return {};
  const out: ColumnFiltersState = {};
  for (const part of raw.split(";")) {
    const sep = part.indexOf("~");
    if (sep < 1) continue;
    const colId = part.slice(0, sep);
    const vals = part
      .slice(sep + 1)
      .split(",")
      .map(decodeFilterValue)
      .filter((v) => v.length > 0);
    if (vals.length > 0) out[colId] = vals;
  }
  return out;
}

export function serializeColumnFiltersToParam(filters: ColumnFiltersState): string | null {
  const parts: string[] = [];
  for (const [colId, vals] of Object.entries(filters)) {
    if (!vals.length) continue;
    parts.push(`${colId}~${vals.map(encodeFilterValue).join(",")}`);
  }
  return parts.length > 0 ? parts.join(";") : null;
}

/** URL: sort=name alebo sort=-created_at */
export function parseSortFromSearchParams(
  params: URLSearchParams,
): TableSortState {
  const raw = params.get(SORT_KEY);
  if (!raw) return null;
  const desc = raw.startsWith("-");
  const columnId = desc ? raw.slice(1) : raw;
  if (!columnId) return null;
  return { columnId, desc };
}

export function serializeSortToParam(sort: TableSortState): string | null {
  if (!sort) return null;
  return sort.desc ? `-${sort.columnId}` : sort.columnId;
}

export function hasColumnFilters(filters: ColumnFiltersState): boolean {
  return Object.values(filters).some((v) => v.length > 0);
}

export const COLUMN_FILTER_URL_KEYS = { cf: CF_KEY, sort: SORT_KEY } as const;

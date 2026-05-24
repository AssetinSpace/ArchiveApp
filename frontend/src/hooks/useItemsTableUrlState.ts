import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ITEM_LEVELS } from "../api";
import {
  COLUMN_FILTER_URL_KEYS,
  hasColumnFilters,
  parseColumnFiltersFromSearchParams,
  parseSortFromSearchParams,
  serializeColumnFiltersToParam,
  serializeSortToParam,
  type ColumnFiltersState,
  type TableSortState,
} from "../lib/itemsTableColumnFilter";

const SEARCH_KEY = "s";
const LEVELS_KEY = "levels";
const STATUS_KEY = "status";
const HAS_QR_KEY = "hasQr";
const HAS_PHOTO_KEY = "hasPhoto";
const ALL_LEVELS = ITEM_LEVELS;

function parseLevelFilters(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => ALL_LEVELS.includes(n as (typeof ALL_LEVELS)[number]));
}

export function useItemsTableUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(SEARCH_KEY) ?? "";
  const levelFilters = useMemo(
    () => parseLevelFilters(searchParams.get(LEVELS_KEY)),
    [searchParams],
  );
  const statusFilter = searchParams.get(STATUS_KEY) ?? "";
  const hasQr = searchParams.get(HAS_QR_KEY) === "1";
  const hasPhoto = searchParams.get(HAS_PHOTO_KEY) === "1";
  const columnFilters = useMemo(
    () => parseColumnFiltersFromSearchParams(searchParams),
    [searchParams],
  );
  const tableSort = useMemo(
    () => parseSortFromSearchParams(searchParams),
    [searchParams],
  );
  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === "") next.delete(key);
            else next.set(key, value);
          }
          // Legacy URL params — odstrán pri každom update
          next.delete("mode");
          next.delete("group");
          next.delete("q");
          next.delete("types");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSearch = useCallback(
    (q: string) => patchParams({ [SEARCH_KEY]: q || null }),
    [patchParams],
  );
  const setLevelFilters = useCallback(
    (levels: number[]) =>
      patchParams({
        [LEVELS_KEY]: levels.length > 0 ? levels.join(",") : null,
      }),
    [patchParams],
  );
  const setStatusFilter = useCallback(
    (s: string) => patchParams({ [STATUS_KEY]: s || null }),
    [patchParams],
  );
  const setHasQr = useCallback(
    (v: boolean) => patchParams({ [HAS_QR_KEY]: v ? "1" : null }),
    [patchParams],
  );
  const setHasPhoto = useCallback(
    (v: boolean) => patchParams({ [HAS_PHOTO_KEY]: v ? "1" : null }),
    [patchParams],
  );
  const setColumnFilters = useCallback(
    (filters: ColumnFiltersState) =>
      patchParams({
        [COLUMN_FILTER_URL_KEYS.cf]: serializeColumnFiltersToParam(filters),
      }),
    [patchParams],
  );

  const setColumnFilter = useCallback(
    (columnId: string, values: string[] | null) => {
      const next = { ...columnFilters };
      if (!values || values.length === 0) delete next[columnId];
      else next[columnId] = values;
      setColumnFilters(next);
    },
    [columnFilters, setColumnFilters],
  );

  const setTableSort = useCallback(
    (sort: TableSortState) =>
      patchParams({
        [COLUMN_FILTER_URL_KEYS.sort]: serializeSortToParam(sort),
      }),
    [patchParams],
  );

  const clearFilters = useCallback(() => {
    patchParams({
      [SEARCH_KEY]: null,
      [LEVELS_KEY]: null,
      [STATUS_KEY]: null,
      [HAS_QR_KEY]: null,
      [HAS_PHOTO_KEY]: null,
      [COLUMN_FILTER_URL_KEYS.cf]: null,
      [COLUMN_FILTER_URL_KEYS.sort]: null,
    });
  }, [patchParams]);

  const hasActiveFilters =
    !!search.trim() ||
    levelFilters.length > 0 ||
    !!statusFilter ||
    hasQr ||
    hasPhoto ||
    hasColumnFilters(columnFilters);

  return {
    search,
    levelFilters,
    statusFilter,
    hasQr,
    hasPhoto,
    columnFilters,
    tableSort,
    hasActiveFilters,
    setSearch,
    setLevelFilters,
    setStatusFilter,
    setHasQr,
    setHasPhoto,
    setColumnFilter,
    setTableSort,
    clearFilters,
    ALL_LEVELS,
  };
}

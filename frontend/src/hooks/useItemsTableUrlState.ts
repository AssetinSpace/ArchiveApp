import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ITEM_LEVELS } from "../api";

const SEARCH_KEY = "s";
const LEVELS_KEY = "levels";
const STATUS_KEY = "status";
const HAS_QR_KEY = "hasQr";
const HAS_PHOTO_KEY = "hasPhoto";
const HIDDEN_COLS_KEY = "hide";

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
  const hiddenColumns = useMemo(() => {
    const raw = searchParams.get(HIDDEN_COLS_KEY);
    if (!raw) return new Set<string>();
    return new Set(raw.split(",").filter(Boolean));
  }, [searchParams]);

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
  const setHiddenColumns = useCallback(
    (cols: Set<string>) =>
      patchParams({
        [HIDDEN_COLS_KEY]: cols.size > 0 ? [...cols].join(",") : null,
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
    });
  }, [patchParams]);

  const hasActiveFilters =
    !!search.trim() || levelFilters.length > 0 || !!statusFilter || hasQr || hasPhoto;

  return {
    search,
    levelFilters,
    statusFilter,
    hasQr,
    hasPhoto,
    hiddenColumns,
    hasActiveFilters,
    setSearch,
    setLevelFilters,
    setStatusFilter,
    setHasQr,
    setHasPhoto,
    setHiddenColumns,
    clearFilters,
    ALL_LEVELS,
  };
}

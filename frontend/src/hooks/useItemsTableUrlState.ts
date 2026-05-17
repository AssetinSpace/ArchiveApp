import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const SEARCH_KEY = "s";
const TYPES_KEY = "types";
const STATUS_KEY = "status";
const HAS_QR_KEY = "hasQr";
const HAS_PHOTO_KEY = "hasPhoto";
const HIDDEN_COLS_KEY = "hide";

const ALL_TYPES = ["SKLAD", "PALETA", "KRABICA", "ZLOZKA"] as const;

export function useItemsTableUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(SEARCH_KEY) ?? "";
  const typeFilters = useMemo(() => {
    const raw = searchParams.get(TYPES_KEY);
    if (!raw) return [] as string[];
    return raw.split(",").filter((t) => ALL_TYPES.includes(t as (typeof ALL_TYPES)[number]));
  }, [searchParams]);
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
  const setTypeFilters = useCallback(
    (types: string[]) =>
      patchParams({ [TYPES_KEY]: types.length > 0 ? types.join(",") : null }),
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
      [TYPES_KEY]: null,
      [STATUS_KEY]: null,
      [HAS_QR_KEY]: null,
      [HAS_PHOTO_KEY]: null,
    });
  }, [patchParams]);

  const hasActiveFilters =
    !!search.trim() || typeFilters.length > 0 || !!statusFilter || hasQr || hasPhoto;

  return {
    search,
    typeFilters,
    statusFilter,
    hasQr,
    hasPhoto,
    hiddenColumns,
    hasActiveFilters,
    setSearch,
    setTypeFilters,
    setStatusFilter,
    setHasQr,
    setHasPhoto,
    setHiddenColumns,
    clearFilters,
    ALL_TYPES,
  };
}

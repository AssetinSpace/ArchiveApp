import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type TableMode = "tree" | "flat";
export type GroupBy = "" | "type_code" | "status";

const MODE_KEY = "mode";
const Q_KEY = "q";
const TYPES_KEY = "types";
const STATUS_KEY = "status";
const HAS_QR_KEY = "hasQr";
const HAS_PHOTO_KEY = "hasPhoto";
const GROUP_KEY = "group";
const HIDDEN_COLS_KEY = "hide";

const ALL_TYPES = ["SKLAD", "PALETA", "KRABICA", "ZLOZKA"] as const;

export function useItemsTableUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const mode: TableMode = searchParams.get(MODE_KEY) === "flat" ? "flat" : "tree";
  const globalFilter = searchParams.get(Q_KEY) ?? "";
  const typeFilters = useMemo(() => {
    const raw = searchParams.get(TYPES_KEY);
    if (!raw) return [] as string[];
    return raw.split(",").filter((t) => ALL_TYPES.includes(t as (typeof ALL_TYPES)[number]));
  }, [searchParams]);
  const statusFilter = searchParams.get(STATUS_KEY) ?? "";
  const hasQr = searchParams.get(HAS_QR_KEY) === "1";
  const hasPhoto = searchParams.get(HAS_PHOTO_KEY) === "1";
  const groupBy: GroupBy = useMemo(() => {
    const g = searchParams.get(GROUP_KEY);
    if (g === "type_code" || g === "status") return g;
    return "";
  }, [searchParams]);
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
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setMode = useCallback(
    (m: TableMode) => patchParams({ [MODE_KEY]: m === "tree" ? null : m }),
    [patchParams],
  );
  const setGlobalFilter = useCallback(
    (q: string) => patchParams({ [Q_KEY]: q.trim() ? q : null }),
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
  const setGroupBy = useCallback(
    (g: GroupBy) => patchParams({ [GROUP_KEY]: g || null }),
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
      [Q_KEY]: null,
      [TYPES_KEY]: null,
      [STATUS_KEY]: null,
      [HAS_QR_KEY]: null,
      [HAS_PHOTO_KEY]: null,
      [GROUP_KEY]: null,
    });
  }, [patchParams]);

  return {
    mode,
    globalFilter,
    typeFilters,
    statusFilter,
    hasQr,
    hasPhoto,
    groupBy,
    hiddenColumns,
    setMode,
    setGlobalFilter,
    setTypeFilters,
    setStatusFilter,
    setHasQr,
    setHasPhoto,
    setGroupBy,
    setHiddenColumns,
    clearFilters,
    ALL_TYPES,
  };
}

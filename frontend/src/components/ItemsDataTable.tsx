import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  api,
  KNOWN_METADATA_KEYS,
  METADATA_LABELS,
  TYPE_LABEL,
  type InventoryItem,
  type MetadataStatus,
  type Status,
} from "../api";
import {
  buildItemTree,
  collectExpandableIds,
  includeAncestors,
  itemMatchesQuery,
  ocrSnippet,
  type InventoryTreeRow,
} from "../lib/itemInventory";
import { useItemsTableUrlState } from "../hooks/useItemsTableUrlState";

const STATUS_LABEL: Record<string, string> = {
  NA_MIESTE: "Na mieste",
  VYNESENE: "Vynesené",
  NEZNAME: "Neznáme",
};

const COLUMN_LABELS: Record<string, string> = {
  type_code: "Typ",
  name: "Názov",
  auto_name: "Auto-name",
  meta_stavba: "Stavba",
  meta_cast: "Časť",
  meta_projektant: "Projektant",
  meta_adresa: "Adresa",
  meta_cislo: "Číslo",
  meta_datum: "Dátum",
  meta_stupen: "Stupeň",
  metadata_status: "Meta status",
  qr_code: "QR",
  status: "Status",
  note: "Poznámka",
  children: "Podradené",
  photos: "Fotky",
  created_at: "Vytvorené",
  updated_at: "Upravené",
};

// Sprint 7: nové stĺpce sú default skryté aby tabuľka neexplodovala. Konzultant
// si ich zapne v "Stĺpce ▾". Auto-name je len debug pomôcka, metadata polia
// (cislo/datum/stupen) sú obvykle krátke ale na úzkych obrazovkách nepotrebné
// na prvý pohľad.
const DEFAULT_HIDDEN = new Set([
  "updated_at",
  "auto_name",
  "meta_stavba",
  "meta_cast",
  "meta_projektant",
  "meta_adresa",
  "meta_cislo",
  "meta_datum",
  "meta_stupen",
  "metadata_status",
]);

const METADATA_STATUS_LABEL: Record<MetadataStatus, string> = {
  NONE: "—",
  EXTRACTED: "Návrh",
  REVIEWED: "Potvrd.",
};
/** Odsadenie podľa úrovne stromu (px na úroveň). */
const TREE_INDENT_PX = 18;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ItemsDataTable() {
  const url = useItemsTableUrlState();
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inventoryQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });
  const fullscreenPinnedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteItem(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["items"] });
      // Po confirm() prehliadač často vypne natívny fullscreen — obnov, ak používateľ
      // stále chce celú obrazovku (CSS overlay medzitým ostáva).
      if (
        fullscreenPinnedRef.current &&
        rootRef.current &&
        document.fullscreenElement !== rootRef.current
      ) {
        try {
          await rootRef.current.requestFullscreen();
        } catch {
          /* CSS režim stačí */
        }
      }
    },
    onError: (e: Error) => {
      window.alert(e.message);
    },
  });

  const handleDeleteItem = useCallback(
    (item: InventoryTreeRow) => {
      if (item._count.children > 0) return;
      const label = item.name ?? item.auto_name ?? "(bez názvu)";
      const type = TYPE_LABEL[item.type_code] ?? item.type_code;
      if (confirm(`Naozaj zmazať položku „${label}" (${type})?`)) {
        deleteMut.mutate(item.id);
      }
    },
    [deleteMut],
  );

  const allItems = inventoryQ.data ?? [];
  const searchQ = url.search.trim();
  const hasAnyFilter =
    url.typeFilters.length > 0 || !!url.statusFilter || url.hasQr || url.hasPhoto || !!searchQ;

  // ── Krok 1: primárne filtre (typ, status, qr, foto) ─────────────────────
  // Typ chip = chcem vidieť položky tohto TYPU (predkovia sa pridajú ako kontext).
  const primaryMatches = useMemo<InventoryItem[]>(() => {
    let items = allItems;
    if (url.typeFilters.length > 0)
      items = items.filter((it) => url.typeFilters.includes(it.type_code));
    if (url.statusFilter)
      items = items.filter((it) => it.status === url.statusFilter);
    if (url.hasQr) items = items.filter((it) => !!it.qr_code);
    if (url.hasPhoto) items = items.filter((it) => it._count.photos > 0);
    return items;
  }, [allItems, url.typeFilters, url.statusFilter, url.hasQr, url.hasPhoto]);

  // ── Krok 2: textové hľadanie ─────────────────────────────────────────────
  const coreMatches = useMemo<InventoryItem[]>(() => {
    if (!searchQ) return primaryMatches;
    return primaryMatches.filter((it) => itemMatchesQuery(it, searchQ));
  }, [primaryMatches, searchQ]);

  const directMatchIds = useMemo(
    () => new Set(coreMatches.map((it) => it.id)),
    [coreMatches],
  );

  // ── Krok 3: zostav strom ─────────────────────────────────────────────────
  // Keď sú aktívne filtre: zobraz zhodné položky + ich predkovia (Sklad > Paleta > …).
  // Bez filtrov: celý strom.
  const treeData = useMemo<InventoryTreeRow[]>(() => {
    if (!hasAnyFilter) return buildItemTree(allItems);
    if (coreMatches.length === 0) return [];
    // Pridaj predkov ako kontext, potom postav strom.
    const withAncestors = includeAncestors(allItems, coreMatches);
    return buildItemTree(withAncestors);
  }, [allItems, hasAnyFilter, coreMatches]);

  // ── Expand state ─────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    if (!hasAnyFilter) {
      setExpanded({});
    } else if (treeData.length > 0) {
      setExpanded(collectExpandableIds(treeData));
    }
  }, [hasAnyFilter, treeData]);

  // ── Stĺpce dropdown ──────────────────────────────────────────────────────
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!columnsOpen) return;
    function onDown(e: MouseEvent) {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [columnsOpen]);

  useEffect(() => {
    function onFullscreenChange() {
      const nativeActive =
        document.fullscreenElement === rootRef.current ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ===
          rootRef.current;
      if (nativeActive) {
        setIsFullscreen(true);
        return;
      }
      // Prehliadač opustil natívny fullscreen (confirm, alert, Esc) — CSS overlay
      // necháme, ak používateľ explicitne neukončil celú obrazovku tlačidlom.
      if (!fullscreenPinnedRef.current) {
        setIsFullscreen(false);
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  // Druhé Esc ukončí CSS režim, keď natívny fullscreen už nie je aktívny.
  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.fullscreenElement === rootRef.current) return;
      fullscreenPinnedRef.current = false;
      setIsFullscreen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

  // iOS/Android v landscape menia visualViewport — bez toho flex scroll nefunguje.
  useEffect(() => {
    if (!isFullscreen) return;
    const el = rootRef.current;
    if (!el) return;

    function syncViewportHeight() {
      const node = rootRef.current;
      if (!node) return;
      const h = window.visualViewport?.height ?? window.innerHeight;
      node.style.setProperty("--items-fs-height", `${Math.round(h)}px`);
    }

    syncViewportHeight();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncViewportHeight);
    vv?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("orientationchange", syncViewportHeight);
    return () => {
      vv?.removeEventListener("resize", syncViewportHeight);
      vv?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
      rootRef.current?.style.removeProperty("--items-fs-height");
    };
  }, [isFullscreen]);

  async function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;

    if (isFullscreen) {
      fullscreenPinnedRef.current = false;
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          /* CSS režim */
        }
      }
      setIsFullscreen(false);
      return;
    }

    fullscreenPinnedRef.current = true;
    setIsFullscreen(true);
    try {
      await el.requestFullscreen();
    } catch {
      // iOS / staršie prehliadače — len CSS overlay
    }
  }

  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {};
    for (const col of url.hiddenColumns) vis[col] = false;
    for (const id of DEFAULT_HIDDEN) {
      if (!url.hiddenColumns.has(id)) vis[id] = false;
    }
    return vis;
  }, [url.hiddenColumns]);

  // ── Definícia stĺpcov ─────────────────────────────────────────────────────
  const columns = useMemo((): ColumnDef<InventoryTreeRow>[] => [
    {
      id: "expand",
      header: () => null,
      size: 40,
      enableHiding: false,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <button
            type="button"
            className="items-table-icon-btn"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? "Zbaliť" : "Rozbaliť"}
          >
            {row.getIsExpanded() ? "▼" : "▶"}
          </button>
        ) : (
          <span className="data-table-expand-spacer" aria-hidden />
        ),
    },
    {
      accessorKey: "type_code",
      header: "Typ",
      size: 100,
      cell: ({ row, getValue }) => {
        const code = getValue<string>();
        return (
          <div
            className="data-table-type-cell"
            style={{ paddingLeft: row.depth * TREE_INDENT_PX }}
          >
            <span className={`badge badge-${code.toLowerCase()}`}>
              {TYPE_LABEL[code] ?? code}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Názov",
      cell: ({ row, getValue }) => {
        const name = getValue<string | null>();
        const item = row.original;
        const snippet = searchQ ? ocrSnippet(item, searchQ) : null;
        return (
          <div>
            <Link to={`/items/${item.id}`} className="data-table-name-link">
              {name ?? <em className="muted">(bez názvu)</em>}
            </Link>
            {snippet && (
              <p className="data-table-ocr-snippet">
                <span className="data-table-ocr-label">OCR</span> {snippet}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "auto_name",
      header: "Auto-name",
      size: 160,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v
          ? <code className="data-table-qr">{v}</code>
          : <span className="muted">—</span>;
      },
    },
    ...KNOWN_METADATA_KEYS.map<ColumnDef<InventoryTreeRow>>((key) => ({
      id: `meta_${key}`,
      header: METADATA_LABELS[key],
      size: 160,
      accessorFn: (row) => row.metadata?.[key] ?? null,
      cell: ({ row, getValue }) => {
        const value = getValue<string | null | undefined>();
        const isExtracted = row.original.metadata_status === "EXTRACTED";
        if (!value) {
          return <span className="muted">—</span>;
        }
        return (
          <span
            className={`data-table-note${isExtracted ? " data-table-meta-suggested" : ""}`}
            style={{ display: "inline-block" }}
            title={value}
          >
            {value}
            {isExtracted && (
              <span className="data-table-meta-suggested-badge">návrh</span>
            )}
          </span>
        );
      },
    })),
    {
      accessorKey: "metadata_status",
      header: "Meta status",
      size: 110,
      cell: ({ getValue }) => {
        const v = getValue<MetadataStatus>();
        return (
          <span
            className={`metadata-status-badge metadata-status-${v.toLowerCase()}`}
          >
            {METADATA_STATUS_LABEL[v] ?? v}
          </span>
        );
      },
    },
    {
      accessorKey: "qr_code",
      header: "QR",
      size: 110,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v
          ? <code className="data-table-qr">{v}</code>
          : <span className="muted">—</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ getValue }) =>
        STATUS_LABEL[getValue<Status>()] ?? getValue<string>(),
    },
    {
      accessorKey: "note",
      header: "Poznámka",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        if (!v) return <span className="muted">—</span>;
        return <span className="data-table-note" title={v}>{v}</span>;
      },
    },
    {
      id: "children",
      header: "Podradené",
      size: 72,
      accessorFn: (row) => row._count.children,
      cell: ({ getValue }) => {
        const n = getValue<number>();
        return n > 0 ? String(n) : <span className="muted">0</span>;
      },
    },
    {
      id: "photos",
      header: "Fotky",
      size: 56,
      accessorFn: (row) => row._count.photos,
      cell: ({ getValue }) => {
        const n = getValue<number>();
        return n > 0 ? String(n) : <span className="muted">0</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Vytvorené",
      size: 100,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "updated_at",
      header: "Upravené",
      size: 100,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "delete",
      header: () => <span className="sr-only">Zmazať</span>,
      size: 48,
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        const childCount = item._count.children;
        const isDeleting = deletingId === item.id;
        const blocked = childCount > 0;
        return (
          <button
            type="button"
            className={`items-table-icon-btn data-table-delete-btn${blocked ? " data-table-delete-btn--blocked" : ""}`}
            title={
              blocked
                ? `Najprv zmazať ${childCount} podradených položiek`
                : "Zmazať položku"
            }
            disabled={blocked || isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteItem(item);
            }}
            aria-label={blocked ? "Nemožno zmazať — má podradené položky" : "Zmazať položku"}
          >
            {isDeleting ? "…" : "✕"}
          </button>
        );
      },
    },
  ], [searchQ, deletingId, handleDeleteItem]);

  const table = useReactTable({
    data: treeData,
    columns,
    state: { expanded, columnVisibility },
    onExpandedChange: setExpanded,
    getSubRows: (row: InventoryTreeRow) => row.subRows,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  function toggleTypeFilter(code: string) {
    const next = url.typeFilters.includes(code)
      ? url.typeFilters.filter((t) => t !== code)
      : [...url.typeFilters, code];
    url.setTypeFilters(next);
  }

  function toggleColumn(colId: string) {
    const col = table.getColumn(colId);
    if (!col) return;
    const next = new Set(url.hiddenColumns);
    if (col.getIsVisible()) next.add(colId);
    else next.delete(colId);
    url.setHiddenColumns(next);
  }

  if (inventoryQ.isLoading) return <p className="muted">Načítavam inventár…</p>;
  if (inventoryQ.error) {
    return <p className="error">Chyba: {(inventoryQ.error as Error).message}</p>;
  }

  const toggleableColumns = table
    .getAllLeafColumns()
    .filter((c) => c.id !== "expand" && c.id !== "delete" && c.getCanHide());

  const matchCount = coreMatches.length;

  return (
    <div
      ref={rootRef}
      className={`items-data-table${isFullscreen ? " items-data-table--fullscreen" : ""}`}
    >
      <div className="items-table-toolbar card">

        {/* Hľadanie */}
        <div className="items-table-toolbar-row">
          <label className="items-table-search-label">
            <span className="sr-only">Hľadať</span>
            <input
              type="search"
              className="items-table-search-input"
              value={url.search}
              onChange={(e) => url.setSearch(e.target.value)}
              placeholder="Hľadať — názov, QR, poznámka, OCR text z fotiek…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
        </div>

        {/* Filtre typov */}
        <div className="items-table-toolbar-row items-table-filters">
          <span className="items-table-filter-label">Zobraziť úrovne</span>
          {url.ALL_TYPES.map((code) => (
            <button
              key={code}
              type="button"
              className={`items-table-chip ${
                url.typeFilters.length === 0 || url.typeFilters.includes(code)
                  ? "items-table-chip-active"
                  : ""
              }`}
              onClick={() => toggleTypeFilter(code)}
            >
              {TYPE_LABEL[code]}
            </button>
          ))}
        </div>

        {/* Sekundárne filtre */}
        <div className="items-table-toolbar-row items-table-filters-secondary">
          <select
            className="items-table-select"
            value={url.statusFilter}
            onChange={(e) => url.setStatusFilter(e.target.value)}
            aria-label="Filter status"
          >
            <option value="">Všetky statusy</option>
            {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <label className="items-table-check">
            <input
              type="checkbox"
              checked={url.hasQr}
              onChange={(e) => url.setHasQr(e.target.checked)}
            />
            Má QR
          </label>
          <label className="items-table-check">
            <input
              type="checkbox"
              checked={url.hasPhoto}
              onChange={(e) => url.setHasPhoto(e.target.checked)}
            />
            Má foto
          </label>
        </div>

        {/* Akcie */}
        <div className="items-table-toolbar-row items-table-actions">
          <div className="items-table-icon-group" role="group">
            <button
              type="button"
              className="items-table-icon-btn"
              onClick={() => setExpanded(collectExpandableIds(treeData))}
              title="Rozbaliť všetko"
            >⬇</button>
            <button
              type="button"
              className="items-table-icon-btn"
              onClick={() => setExpanded({})}
              title="Zbaliť všetko"
            >⬆</button>
          </div>

          <div className="items-table-columns-wrap" ref={columnsRef}>
            <button
              type="button"
              className={`items-table-chip ${columnsOpen ? "items-table-chip-active" : ""}`}
              onClick={() => setColumnsOpen((v) => !v)}
            >
              Stĺpce ▾
            </button>
            {columnsOpen && (
              <div className="items-table-columns-menu">
                {toggleableColumns.map((col) => (
                  <label key={col.id} className="items-table-check">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={() => toggleColumn(col.id)}
                    />
                    {COLUMN_LABELS[col.id] ?? col.id}
                  </label>
                ))}
              </div>
            )}
          </div>

          {hasAnyFilter && (
            <button type="button" className="items-table-chip" onClick={url.clearFilters}>
              Zrušiť filtre
            </button>
          )}

          <button
            type="button"
            className={`items-table-chip ${isFullscreen ? "items-table-chip-active" : ""}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Ukončiť celú obrazovku (Esc)" : "Tabuľka na celú obrazovku"}
          >
            {isFullscreen ? "✕ Zavrieť" : "⛶ Celá obrazovka"}
          </button>

          <span className="items-table-count muted">
            {hasAnyFilter ? (
              <><strong>{matchCount}</strong> {matchCount === 1 ? "zhoda" : matchCount < 5 ? "zhody" : "zhôd"}</>
            ) : (
              <><strong>{allItems.length}</strong> položiek</>
            )}
          </span>
        </div>
      </div>

      {/* Tabuľka */}
      <div className="data-table-wrap card">
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="data-table-empty">
                    {hasAnyFilter
                      ? "Žiadne položky nevyhovujú filtrom."
                      : "Žiadne položky."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isMatch = hasAnyFilter && directMatchIds.has(row.original.id);
                  const isContext = hasAnyFilter && !isMatch;
                  return (
                    <tr
                      key={row.id}
                      className={[
                        row.depth > 0 ? "data-table-row-child" : "",
                        isMatch ? "data-table-row-match" : "",
                        isContext ? "data-table-row-context" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

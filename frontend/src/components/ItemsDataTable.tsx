import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type ExpandedState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  defaultItemsTableColumnOrder,
  isPinnedTableColumn,
  reorderTableColumns,
  resolveColumnOrder,
} from "../lib/itemsTableColumnPrefs";
import {
  api,
  levelKindHint,
  TYPE_LABEL,
  type InventoryItem,
  type InventoryPhotoPreview,
  type MetadataStatus,
  type Status,
} from "../api";
import { PhotoLightbox } from "./PhotoLightbox";
import { openPhotoBeside, photoCountLabel } from "../lib/openPhotoBeside";
import {
  buildItemTree,
  collectExpandableIds,
  countDescendants,
  includeAncestors,
  itemMatchesQuery,
  ocrSnippet,
  type InventoryTreeRow,
} from "../lib/itemInventory";
import {
  metadataColumnId,
  metadataFieldLabel,
} from "../lib/metadataDraft";
import { useItemsTableColumnPrefs } from "../hooks/useItemsTableColumnPrefs";
import { useItemsTableUrlState } from "../hooks/useItemsTableUrlState";
import {
  ItemsTableColumnsModal,
  type ColumnPickerEntry,
} from "./ItemsTableColumnsModal";

const STATUS_LABEL: Record<string, string> = {
  NA_MIESTE: "Na mieste",
  VYNESENE: "Vynesené",
  NEZNAME: "Neznáme",
};

const COLUMN_LABELS: Record<string, string> = {
  level: "Úroveň",
  kind: "Typ",
  name: "Názov",
  name_source: "Zdroj názvu",
  metadata_status: "Meta status",
  qr_code: "QR",
  status: "Status",
  note: "Poznámka",
  children: "Podradené",
  photos: "Fotky",
  created_at: "Vytvorené",
  updated_at: "Upravené",
};

function columnDisplayLabel(colId: string): string {
  if (COLUMN_LABELS[colId]) return COLUMN_LABELS[colId];
  if (colId.startsWith("meta_")) return metadataFieldLabel(colId.slice(5));
  return colId;
}

// Sprint 7: metadata a pomocné stĺpce sú default skryté; zapnú sa v „Stĺpce ▾“
// (URL ?show=meta_stavba,…). Všetky kľúče z JSONB metadata (aj AI navyše) majú stĺpec.
const NAME_SOURCE_LABEL: Record<string, string> = {
  GENERATED: "auto",
  OCR: "z OCR",
  MANUAL: "ručne",
};

const DEFAULT_HIDDEN = new Set(["updated_at", "name_source", "metadata_status"]);

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

type TableLightboxState = {
  photos: InventoryPhotoPreview[];
  index: number;
  totalCount: number;
};

function InventoryPhotosCell({
  previews,
  totalCount,
  onOpenModal,
  onOpenBeside,
}: {
  previews: InventoryPhotoPreview[];
  totalCount: number;
  onOpenModal: (index: number) => void;
  onOpenBeside: (index: number) => void;
}): React.JSX.Element {
  if (totalCount === 0) {
    return <span className="muted">—</span>;
  }
  const label = photoCountLabel(totalCount);
  const canOpen = previews.length > 0;
  return (
    <div className="data-table-photos-cell">
      {canOpen ? (
        <button
          type="button"
          className="data-table-photo-link"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(0);
          }}
          title="Otvoriť fotky v okne"
        >
          {label}
        </button>
      ) : (
        <span className="muted" title="Náhľad sa načíta po obnovení stránky">
          {label}
        </span>
      )}
      {canOpen ? (
        <button
          type="button"
          className="data-table-photo-link data-table-photo-link-beside"
          onClick={(e) => {
            e.stopPropagation();
            onOpenBeside(0);
          }}
          title="Otvoriť prvú fotku v okne vedľa tabuľky"
        >
          vedľa
        </button>
      ) : null}
    </div>
  );
}

export function ItemsDataTable() {
  const url = useItemsTableUrlState();
  const qc = useQueryClient();
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tableLightbox, setTableLightbox] = useState<TableLightboxState | null>(null);
  const inventoryQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });
  const fullscreenPinnedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const modalPortalRef = useRef<HTMLDivElement>(null);
  const deleteTouchHandledRef = useRef(false);

  const deleteMut = useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      api.deleteItem(id, { cascade }),
    onMutate: ({ id }) => setDeletingId(id),
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

  const allItems = inventoryQ.data ?? [];

  const columnPrefs = useItemsTableColumnPrefs(allItems);
  const {
    hiddenColumns,
    shownColumns,
    metadataColumnKeys,
    columnOrder: savedColumnOrder,
    columnSizing,
    applyColumnVisibility,
    setColumnOrder,
    setColumnSizing,
  } = columnPrefs;

  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);

  const descendantCountById = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of allItems) {
      if (it._count.children > 0) {
        map.set(it.id, countDescendants(allItems, it.id));
      }
    }
    return map;
  }, [allItems]);

  const handleDeleteItem = useCallback(
    (item: InventoryTreeRow) => {
      const label = item.name ?? "(bez názvu)";
      const type = TYPE_LABEL[item.kind] ?? item.kind;
      const descendantCount = descendantCountById.get(item.id) ?? 0;
      const cascade = descendantCount > 0;

      const msg = cascade
        ? `Naozaj zmazať „${label}" (${type}) a všetkých ${descendantCount} podradených položiek (vrátane vnorených)?\n\nPoložky pôjdu do koša (soft delete).`
        : `Naozaj zmazať položku „${label}" (${type})?`;

      if (confirm(msg)) {
        deleteMut.mutate({ id: item.id, cascade });
      }
    },
    [deleteMut, descendantCountById],
  );
  const searchQ = url.search.trim();
  const hasAnyFilter =
    url.levelFilters.length > 0 || !!url.statusFilter || url.hasQr || url.hasPhoto || !!searchQ;

  // ── Krok 1: primárne filtre (úroveň, status, qr, foto) ──────────────────
  // Úroveň chip = chcem vidieť položky na danej úrovni (predkovia ako kontext).
  const primaryMatches = useMemo<InventoryItem[]>(() => {
    let items = allItems;
    if (url.levelFilters.length > 0)
      items = items.filter((it) => url.levelFilters.includes(it.level));
    if (url.statusFilter)
      items = items.filter((it) => it.status === url.statusFilter);
    if (url.hasQr) items = items.filter((it) => !!it.qr_code);
    if (url.hasPhoto) items = items.filter((it) => it._count.photos > 0);
    return items;
  }, [allItems, url.levelFilters, url.statusFilter, url.hasQr, url.hasPhoto]);

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

  const [isFullscreen, setIsFullscreen] = useState(false);

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
      if (columnsModalOpen) {
        setColumnsModalOpen(false);
        return;
      }
      if (document.fullscreenElement === rootRef.current) return;
      fullscreenPinnedRef.current = false;
      setIsFullscreen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen, columnsModalOpen]);

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
    for (const col of hiddenColumns) vis[col] = false;
    for (const id of DEFAULT_HIDDEN) {
      if (!shownColumns.has(id)) vis[id] = false;
    }
    for (const key of metadataColumnKeys) {
      const id = metadataColumnId(key);
      if (!shownColumns.has(id)) vis[id] = false;
    }
    return vis;
  }, [hiddenColumns, shownColumns, metadataColumnKeys]);

  const columnPickerEntries = useMemo((): ColumnPickerEntry[] => {
    const baseOrder = [
      "level",
      "kind",
      "name",
      "name_source",
      "metadata_status",
      "qr_code",
      "status",
      "note",
      "children",
      "photos",
      "created_at",
      "updated_at",
    ];
    const base: ColumnPickerEntry[] = baseOrder.map((id) => ({
      id,
      label: columnDisplayLabel(id),
      group: "base",
    }));
    const meta: ColumnPickerEntry[] = metadataColumnKeys.map((key) => ({
      id: metadataColumnId(key),
      label: metadataFieldLabel(key),
      group: "metadata",
    }));
    return [...base, ...meta];
  }, [metadataColumnKeys]);

  const visibleColumnIds = useMemo(() => {
    const visible = new Set<string>();
    for (const entry of columnPickerEntries) {
      const id = entry.id;
      if (hiddenColumns.has(id)) continue;
      if (DEFAULT_HIDDEN.has(id) && !shownColumns.has(id)) continue;
      if (id.startsWith("meta_") && !shownColumns.has(id)) continue;
      visible.add(id);
    }
    return visible;
  }, [columnPickerEntries, hiddenColumns, shownColumns]);

  const toggleableIds = useMemo(
    () => columnPickerEntries.map((e) => e.id),
    [columnPickerEntries],
  );

  const defaultColumnOrder = useMemo(
    () => defaultItemsTableColumnOrder(metadataColumnKeys),
    [metadataColumnKeys],
  );

  const columnOrder = useMemo(
    () => resolveColumnOrder(savedColumnOrder, defaultColumnOrder),
    [savedColumnOrder, defaultColumnOrder],
  );

  const handleColumnOrderChange = useCallback(
    (fromId: string, toId: string) => {
      setColumnOrder(reorderTableColumns(columnOrder, fromId, toId));
    },
    [columnOrder, setColumnOrder],
  );

  const handleColumnSizingChange = useCallback(
    (updater: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState)) => {
      setColumnSizing(
        typeof updater === "function" ? updater(columnSizing) : updater,
      );
    },
    [columnSizing, setColumnSizing],
  );

  // ── Definícia stĺpcov ─────────────────────────────────────────────────────
  const columns = useMemo((): ColumnDef<InventoryTreeRow>[] => [
    {
      id: "expand",
      header: () => null,
      size: 40,
      minSize: 36,
      maxSize: 56,
      enableResizing: false,
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
      accessorKey: "level",
      header: "L",
      size: 48,
      minSize: 40,
      cell: ({ getValue }) => <span>{getValue<number>()}</span>,
    },
    {
      accessorKey: "kind",
      header: "Typ",
      size: 100,
      minSize: 80,
      cell: ({ getValue }) => {
        const code = getValue<string>();
        return (
          <div className="data-table-type-cell">
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
          <div
            className="data-table-name-cell"
            style={{ paddingLeft: row.depth * TREE_INDENT_PX }}
          >
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
      accessorKey: "name_source",
      header: "Zdroj názvu",
      size: 90,
      cell: ({ getValue }) => {
        const src = getValue<string>();
        return (
          <span className={`badge badge-name-source-${src.toLowerCase()}`}>
            {NAME_SOURCE_LABEL[src] ?? src}
          </span>
        );
      },
    },
    ...metadataColumnKeys.map<ColumnDef<InventoryTreeRow>>((key) => ({
      id: metadataColumnId(key),
      header: metadataFieldLabel(key),
      size: 160,
      accessorFn: (row) => {
        const v = row.metadata?.[key];
        if (v === null || v === undefined) return null;
        return typeof v === "string" ? v : String(v);
      },
      cell: ({ row, getValue }) => {
        const value = getValue<string | null | undefined>();
        const isExtracted = row.original.metadata_status === "EXTRACTED";
        if (!value || value.trim() === "") {
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
      size: 96,
      minSize: 80,
      accessorFn: (row) => row._count.photos,
      cell: ({ row }) => {
        const previews = row.original.photo_previews ?? [];
        return (
          <InventoryPhotosCell
            previews={previews}
            totalCount={row.original._count.photos}
            onOpenModal={(index) =>
              setTableLightbox({
                photos: previews,
                index,
                totalCount: row.original._count.photos,
              })
            }
            onOpenBeside={(index) => {
              const p = previews[index];
              if (p) openPhotoBeside(p.signed_url);
            }}
          />
        );
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
      minSize: 44,
      maxSize: 64,
      enableResizing: false,
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        const descendantCount = descendantCountById.get(item.id) ?? 0;
        const hasDescendants = descendantCount > 0;
        const isDeleting = deletingId === item.id;
        return (
          <button
            type="button"
            className={`items-table-icon-btn data-table-delete-btn${hasDescendants ? " data-table-delete-btn--cascade" : ""}`}
            title={
              hasDescendants
                ? `Zmazať položku a ${descendantCount} podradených (vrátane vnorených)`
                : "Zmazať položku"
            }
            disabled={isDeleting}
            onPointerDown={(e) => {
              // Na mobile inak scroll kontajnera „zožerie“ tap pred clickom.
              e.stopPropagation();
              if (e.pointerType === "touch") {
                e.currentTarget.setPointerCapture(e.pointerId);
              }
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (isDeleting) return;
              if (e.pointerType !== "touch") return;
              e.preventDefault();
              deleteTouchHandledRef.current = true;
              handleDeleteItem(item);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isDeleting) return;
              if (deleteTouchHandledRef.current) {
                deleteTouchHandledRef.current = false;
                return;
              }
              handleDeleteItem(item);
            }}
            aria-label={
              hasDescendants
                ? `Zmazať položku a ${descendantCount} podradených`
                : "Zmazať položku"
            }
          >
            {isDeleting ? "…" : "✕"}
          </button>
        );
      },
    },
  ], [searchQ, deletingId, handleDeleteItem, descendantCountById, metadataColumnKeys]);

  const table = useReactTable({
    data: treeData,
    columns,
    state: { expanded, columnVisibility, columnOrder, columnSizing },
    onExpandedChange: setExpanded,
    onColumnSizingChange: handleColumnSizingChange,
    columnResizeMode: "onEnd",
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 48,
      maxSize: 640,
      size: 150,
    },
    getSubRows: (row: InventoryTreeRow) => row.subRows,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  function toggleLevelFilter(level: number) {
    const next = url.levelFilters.includes(level)
      ? url.levelFilters.filter((l) => l !== level)
      : [...url.levelFilters, level];
    url.setLevelFilters(next);
  }

  if (inventoryQ.isLoading) return <p className="muted">Načítavam inventár…</p>;
  if (inventoryQ.error) {
    return <p className="error">Chyba: {(inventoryQ.error as Error).message}</p>;
  }

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
          {url.ALL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={`items-table-chip items-table-chip-level ${
                url.levelFilters.length === 0 || url.levelFilters.includes(level)
                  ? "items-table-chip-active"
                  : ""
              }`}
              onClick={() => toggleLevelFilter(level)}
              aria-label={`Úroveň ${level}, ${levelKindHint(level)}`}
            >
              <span className="items-table-chip-level-title">Úroveň {level}</span>
              <span className="items-table-chip-level-sub">{levelKindHint(level)}</span>
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

          <button
            type="button"
            className={`items-table-chip ${columnsModalOpen ? "items-table-chip-active" : ""}`}
            onClick={() => setColumnsModalOpen(true)}
          >
            Stĺpce…
          </button>

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
          <table
            className="data-table"
            style={{ width: table.getTotalSize() }}
          >
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const colId = header.column.id;
                    const canDrag =
                      !isPinnedTableColumn(colId) && !header.isPlaceholder;
                    const isDragging = dragColumnId === colId;
                    const isDropTarget =
                      dropColumnId === colId && dragColumnId !== colId;

                    return (
                      <th
                        key={header.id}
                        className={[
                          canDrag ? "data-table-th--draggable" : "",
                          isDragging ? "data-table-th--dragging" : "",
                          isDropTarget ? "data-table-th--drop-target" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ width: header.getSize() }}
                        draggable={canDrag}
                        title={
                          canDrag
                            ? "Presuň pre zmenu poradia stĺpcov"
                            : undefined
                        }
                        onDragStart={(e) => {
                          if (!canDrag) return;
                          setDragColumnId(colId);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", colId);
                        }}
                        onDragEnd={() => {
                          setDragColumnId(null);
                          setDropColumnId(null);
                        }}
                        onDragOver={(e) => {
                          if (!canDrag || !dragColumnId || dragColumnId === colId) {
                            return;
                          }
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDropColumnId(colId);
                        }}
                        onDragLeave={() => {
                          if (dropColumnId === colId) setDropColumnId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromId =
                            dragColumnId ?? e.dataTransfer.getData("text/plain");
                          if (fromId && fromId !== colId) {
                            handleColumnOrderChange(fromId, colId);
                          }
                          setDragColumnId(null);
                          setDropColumnId(null);
                        }}
                      >
                        <span className="data-table-th-inner">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </span>
                        {header.column.getCanResize() && (
                          <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label={`Zmeniť šírku stĺpca ${columnDisplayLabel(colId)}`}
                            className={`data-table-col-resizer${
                              header.column.getIsResizing()
                                ? " data-table-col-resizer--active"
                                : ""
                            }`}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onClick={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.preventDefault()}
                          />
                        )}
                      </th>
                    );
                  })}
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
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                        >
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

      <div ref={modalPortalRef} className="items-table-modal-portal" />

      <ItemsTableColumnsModal
        open={columnsModalOpen}
        entries={columnPickerEntries}
        visibleIds={visibleColumnIds}
        portalTarget={modalPortalRef.current}
        fullscreen={isFullscreen}
        onClose={() => setColumnsModalOpen(false)}
        onApply={(visible) => {
          applyColumnVisibility(visible, toggleableIds);
          setColumnsModalOpen(false);
        }}
      />

      {tableLightbox && tableLightbox.photos.length > 0 && (
        <PhotoLightbox
          photo={tableLightbox.photos[tableLightbox.index]!}
          caption={`${tableLightbox.index + 1} / ${tableLightbox.totalCount}${
            tableLightbox.totalCount > tableLightbox.photos.length
              ? " (náhľad z inventára)"
              : ""
          }`}
          onClose={() => setTableLightbox(null)}
          onPrev={
            tableLightbox.index > 0
              ? () =>
                  setTableLightbox((s) =>
                    s ? { ...s, index: s.index - 1 } : null,
                  )
              : undefined
          }
          onNext={
            tableLightbox.index < tableLightbox.photos.length - 1
              ? () =>
                  setTableLightbox((s) =>
                    s ? { ...s, index: s.index + 1 } : null,
                  )
              : undefined
          }
        />
      )}
    </div>
  );
}

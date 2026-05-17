import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type VisibilityState,
} from "@tanstack/react-table";
import { api, TYPE_LABEL, type InventoryItem, type Status } from "../api";
import {
  buildItemTree,
  collectExpandableIds,
  itemMatchesQuery,
  itemsForFilteredTree,
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
  expand: "",
  type_code: "Typ",
  name: "Názov / OCR",
  qr_code: "QR",
  status: "Status",
  note: "Poznámka",
  children: "Deti",
  photos: "Fotky",
  created_at: "Vytvorené",
  updated_at: "Upravené",
};

const DEFAULT_HIDDEN = new Set(["updated_at"]);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function applyStructuredFilters(
  items: InventoryItem[],
  opts: { typeFilters: string[]; statusFilter: string; hasQr: boolean; hasPhoto: boolean },
): InventoryItem[] {
  return items.filter((item) => {
    if (opts.typeFilters.length > 0 && !opts.typeFilters.includes(item.type_code)) return false;
    if (opts.statusFilter && item.status !== opts.statusFilter) return false;
    if (opts.hasQr && !item.qr_code) return false;
    if (opts.hasPhoto && item._count.photos === 0) return false;
    return true;
  });
}

export function ItemsDataTable() {
  const url = useItemsTableUrlState();
  const inventoryQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });

  const allItems = inventoryQ.data ?? [];

  const hasStructuredFilters =
    url.typeFilters.length > 0 || !!url.statusFilter || url.hasQr || url.hasPhoto;

  // 1. Aplikuj štruktúrované filtre (typ, status, checkboxy).
  const structuredMatches = useMemo(
    () =>
      hasStructuredFilters
        ? applyStructuredFilters(allItems, {
            typeFilters: url.typeFilters,
            statusFilter: url.statusFilter,
            hasQr: url.hasQr,
            hasPhoto: url.hasPhoto,
          })
        : allItems,
    [allItems, hasStructuredFilters, url.typeFilters, url.statusFilter, url.hasQr, url.hasPhoto],
  );

  // 2. Aplikuj textové hľadanie (name + qr + note + ocr_text) na výsledok z kroku 1.
  const searchQ = url.search.trim();
  const coreMatches = useMemo(() => {
    if (!searchQ) return structuredMatches;
    return structuredMatches.filter((item) => itemMatchesQuery(item, searchQ));
  }, [structuredMatches, searchQ]);

  // 3. Pre každú zhodu zahrň predkov (kontext v strome) aj celý podstrom.
  const directMatchIds = useMemo(() => new Set(coreMatches.map((it) => it.id)), [coreMatches]);

  const treeData = useMemo(() => {
    if (url.hasActiveFilters && coreMatches.length === 0) return [];
    const visible =
      url.hasActiveFilters ? itemsForFilteredTree(allItems, coreMatches) : allItems;
    return buildItemTree(visible);
  }, [allItems, coreMatches, url.hasActiveFilters]);

  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  // Zavrieť dropdown stĺpcov pri kliknutí von.
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

  // Pri zmene filtrov automaticky rozbaľ strom na úrovne kde sú zhody.
  useEffect(() => {
    if (!url.hasActiveFilters) {
      setExpanded({});
    } else if (treeData.length > 0) {
      setExpanded(collectExpandableIds(treeData));
    }
  }, [url.hasActiveFilters, treeData]);

  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {};
    for (const col of url.hiddenColumns) vis[col] = false;
    for (const id of DEFAULT_HIDDEN) {
      if (!url.hiddenColumns.has(id)) vis[id] = false;
    }
    return vis;
  }, [url.hiddenColumns]);

  const columns = useMemo((): ColumnDef<InventoryTreeRow>[] => [
    {
      id: "expand",
      header: () => null,
      size: 40,
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
      cell: ({ getValue }) => {
        const code = getValue<string>();
        return (
          <span className={`badge badge-${code.toLowerCase()}`}>
            {TYPE_LABEL[code] ?? code}
          </span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Názov / OCR",
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
      accessorKey: "qr_code",
      header: "QR",
      size: 110,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? <code className="data-table-qr">{v}</code> : <span className="muted">—</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ getValue }) => STATUS_LABEL[getValue<Status>()] ?? getValue<string>(),
    },
    {
      accessorKey: "note",
      header: "Poznámka",
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        if (!v) return <span className="muted">—</span>;
        return (
          <span className="data-table-note" title={v}>
            {v}
          </span>
        );
      },
    },
    {
      id: "children",
      header: "Deti",
      size: 56,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- searchQ used inside cell renderer
  ], [searchQ]);

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

  function expandAll() {
    setExpanded(collectExpandableIds(treeData));
  }

  function collapseAll() {
    setExpanded({});
  }

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
    .filter((c) => c.id !== "expand" && c.getCanHide());

  return (
    <div className="items-data-table">
      <div className="items-table-toolbar card">

        {/* ── Hľadanie ── */}
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

        {/* ── Filtre typov ── */}
        <div className="items-table-toolbar-row items-table-filters">
          <span className="items-table-filter-label">Zobraziť</span>
          {url.ALL_TYPES.map((code) => (
            <button
              key={code}
              type="button"
              className={`items-table-chip ${
                url.typeFilters.includes(code) ? "items-table-chip-active" : ""
              }`}
              onClick={() => toggleTypeFilter(code)}
              title={`Zobraziť ${TYPE_LABEL[code].toLowerCase()}y a ich podstrom`}
            >
              {TYPE_LABEL[code]}
            </button>
          ))}
        </div>

        {/* ── Sekundárne filtre ── */}
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

        {/* ── Akcie ── */}
        <div className="items-table-toolbar-row items-table-actions">
          <div className="items-table-icon-group" role="group" aria-label="Rozbalenie stromu">
            <button
              type="button"
              className="items-table-icon-btn"
              onClick={expandAll}
              title="Rozbaliť všetko"
            >
              ⬇
            </button>
            <button
              type="button"
              className="items-table-icon-btn"
              onClick={collapseAll}
              title="Zbaliť všetko"
            >
              ⬆
            </button>
          </div>

          <div className="items-table-columns-wrap" ref={columnsRef}>
            <button
              type="button"
              className={`items-table-chip ${columnsOpen ? "items-table-chip-active" : ""}`}
              onClick={() => setColumnsOpen((v) => !v)}
              aria-expanded={columnsOpen}
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

          {url.hasActiveFilters && (
            <button type="button" className="items-table-chip" onClick={url.clearFilters}>
              Zrušiť filtre
            </button>
          )}

          <span className="items-table-count muted">
            {url.hasActiveFilters ? (
              <>
                Zhôd: <strong>{coreMatches.length}</strong>
                {rows.length !== coreMatches.length && ` · v strome: ${rows.length}`}
              </>
            ) : (
              <><strong>{allItems.length}</strong> položiek</>
            )}
          </span>
        </div>
      </div>

      {/* ── Tabuľka ── */}
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
                    {url.hasActiveFilters
                      ? "Žiadne položky nevyhovujú filtrom."
                      : "Žiadne položky."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isMatch = url.hasActiveFilters && directMatchIds.has(row.original.id);
                  return (
                    <tr
                      key={row.id}
                      className={[
                        row.depth > 0 ? "data-table-row-child" : "",
                        isMatch ? "data-table-row-match" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{
                            paddingLeft:
                              cell.column.id === "name"
                                ? `${8 + row.depth * 16}px`
                                : undefined,
                          }}
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
    </div>
  );
}

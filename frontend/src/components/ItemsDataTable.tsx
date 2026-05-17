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
  buildPathMap,
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
  name: "Názov",
  path: "Cesta",
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

export function ItemsDataTable() {
  const url = useItemsTableUrlState();
  const inventoryQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });

  const allItems = inventoryQ.data ?? [];
  const searchQ = url.search.trim();

  // Keď sú aktívne chipy typov → plochý zoznam iba týchto typov.
  // Keď nie sú chipy → strom (príp. s rozbalením pri textovom hľadaní).
  const flatMode = url.typeFilters.length > 0;

  const pathMap = useMemo(() => buildPathMap(allItems), [allItems]);

  // ── Plochý režim ──────────────────────────────────────────────────────────
  const flatItems: InventoryTreeRow[] = useMemo(() => {
    if (!flatMode) return [];
    let items: InventoryItem[] = allItems.filter((it) =>
      url.typeFilters.includes(it.type_code),
    );
    if (url.statusFilter) items = items.filter((it) => it.status === url.statusFilter);
    if (url.hasQr) items = items.filter((it) => !!it.qr_code);
    if (url.hasPhoto) items = items.filter((it) => it._count.photos > 0);
    if (searchQ) items = items.filter((it) => itemMatchesQuery(it, searchQ));
    return items as InventoryTreeRow[];
  }, [flatMode, allItems, url.typeFilters, url.statusFilter, url.hasQr, url.hasPhoto, searchQ]);

  // ── Stromový režim ────────────────────────────────────────────────────────
  const treeMatches = useMemo(() => {
    if (flatMode) return [];
    let items = allItems;
    if (url.statusFilter) items = items.filter((it) => it.status === url.statusFilter);
    if (url.hasQr) items = items.filter((it) => !!it.qr_code);
    if (url.hasPhoto) items = items.filter((it) => it._count.photos > 0);
    if (searchQ) items = items.filter((it) => itemMatchesQuery(it, searchQ));
    return items;
  }, [flatMode, allItems, url.statusFilter, url.hasQr, url.hasPhoto, searchQ]);

  const hasSecondaryFilters = !!url.statusFilter || url.hasQr || url.hasPhoto;
  const hasAnyFilter = flatMode || !!searchQ || hasSecondaryFilters;

  const treeData: InventoryTreeRow[] = useMemo(() => {
    if (flatMode) return [];
    if (!hasAnyFilter) return buildItemTree(allItems);
    if (treeMatches.length === 0) return [];
    return buildItemTree(itemsForFilteredTree(allItems, treeMatches));
  }, [flatMode, allItems, hasAnyFilter, treeMatches]);

  const directMatchIds = useMemo(
    () => new Set((flatMode ? flatItems : treeMatches).map((it) => it.id)),
    [flatMode, flatItems, treeMatches],
  );

  const tableData = flatMode ? flatItems : treeData;

  // ── Expanded state ────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    if (flatMode || !hasAnyFilter) {
      setExpanded({});
    } else if (treeData.length > 0) {
      setExpanded(collectExpandableIds(treeData));
    }
  }, [flatMode, hasAnyFilter, treeData]);

  // ── Stĺpce menu ──────────────────────────────────────────────────────────
  const [columnsOpen, setColumnsOpen] = useState(false);
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

  // ── Viditeľnosť stĺpcov ───────────────────────────────────────────────────
  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {};
    for (const col of url.hiddenColumns) vis[col] = false;
    for (const id of DEFAULT_HIDDEN) {
      if (!url.hiddenColumns.has(id)) vis[id] = false;
    }
    // expand šípka len v strome, Cesta len v plochom
    vis.expand = !flatMode;
    vis.path = flatMode;
    return vis;
  }, [url.hiddenColumns, flatMode]);

  // ── Definícia stĺpcov ─────────────────────────────────────────────────────
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
      id: "path",
      header: "Cesta",
      accessorFn: (row) => pathMap.get(row.id) ?? "",
      cell: ({ getValue }) => (
        <span className="data-table-path" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
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
      cell: ({ getValue }) => STATUS_LABEL[getValue<Status>()] ?? getValue<string>(),
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
  // searchQ je v cell rendereri — pri zmene query sa stĺpce musia prepočítať
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [pathMap, searchQ]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded, columnVisibility },
    onExpandedChange: setExpanded,
    getSubRows: flatMode ? undefined : (row: InventoryTreeRow) => row.subRows,
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
    .filter((c) => c.id !== "expand" && c.id !== "path" && c.getCanHide());

  const matchCount = flatMode ? flatItems.length : treeMatches.length;

  return (
    <div className="items-data-table">
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
          <span className="items-table-filter-label">Zobraziť</span>
          {url.ALL_TYPES.map((code) => (
            <button
              key={code}
              type="button"
              className={`items-table-chip ${
                url.typeFilters.includes(code) ? "items-table-chip-active" : ""
              }`}
              onClick={() => toggleTypeFilter(code)}
            >
              {TYPE_LABEL[code]}
            </button>
          ))}
          {url.typeFilters.length > 0 && (
            <span className="items-table-filter-hint muted">
              → plochý zoznam
            </span>
          )}
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
            <input type="checkbox" checked={url.hasQr} onChange={(e) => url.setHasQr(e.target.checked)} />
            Má QR
          </label>
          <label className="items-table-check">
            <input type="checkbox" checked={url.hasPhoto} onChange={(e) => url.setHasPhoto(e.target.checked)} />
            Má foto
          </label>
        </div>

        {/* Akcie */}
        <div className="items-table-toolbar-row items-table-actions">
          {!flatMode && (
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
          )}

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

          <span className="items-table-count muted">
            {hasAnyFilter ? (
              <><strong>{matchCount}</strong> {matchCount === 1 ? "položka" : matchCount < 5 ? "položky" : "položiek"}</>
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
                    {hasAnyFilter ? "Žiadne položky nevyhovujú filtrom." : "Žiadne položky."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isMatch = hasAnyFilter && directMatchIds.has(row.original.id);
                  return (
                    <tr
                      key={row.id}
                      className={[
                        !flatMode && row.depth > 0 ? "data-table-row-child" : "",
                        isMatch ? "data-table-row-match" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{
                            paddingLeft:
                              !flatMode && cell.column.id === "name"
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

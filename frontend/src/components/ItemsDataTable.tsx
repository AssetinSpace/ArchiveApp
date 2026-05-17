import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type GroupingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  api,
  TYPE_LABEL,
  type InventoryItem,
  type Status,
} from "../api";
import {
  buildItemTree,
  buildPathMap,
  collectExpandableIds,
  includeAncestors,
  itemMatchesGlobalFilter,
  type InventoryTreeRow,
} from "../lib/itemInventory";
import { useItemsTableUrlState, type GroupBy } from "../hooks/useItemsTableUrlState";

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

function applyStructuredFilters(
  items: InventoryItem[],
  filters: {
    typeFilters: string[];
    statusFilter: string;
    hasQr: boolean;
    hasPhoto: boolean;
  },
): InventoryItem[] {
  return items.filter((item) => {
    if (filters.typeFilters.length > 0 && !filters.typeFilters.includes(item.type_code)) {
      return false;
    }
    if (filters.statusFilter && item.status !== filters.statusFilter) return false;
    if (filters.hasQr && !item.qr_code) return false;
    if (filters.hasPhoto && item._count.photos === 0) return false;
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

  const structuredFiltered = useMemo(
    () =>
      applyStructuredFilters(allItems, {
        typeFilters: url.typeFilters,
        statusFilter: url.statusFilter,
        hasQr: url.hasQr,
        hasPhoto: url.hasPhoto,
      }),
    [allItems, url.typeFilters, url.statusFilter, url.hasQr, url.hasPhoto],
  );

  const globalQ = url.globalFilter.trim();

  const effectiveFlat = url.mode === "flat" || hasStructuredFilters;

  const pathMap = useMemo(() => buildPathMap(allItems), [allItems]);

  const { tableData, treeForExpand } = useMemo(() => {
    const labels = { type: TYPE_LABEL, status: STATUS_LABEL };

    if (effectiveFlat) {
      let flat = structuredFiltered;
      if (globalQ) {
        flat = flat.filter((item) =>
          itemMatchesGlobalFilter(item, globalQ, labels),
        );
      }
      return { tableData: flat as InventoryTreeRow[], treeForExpand: [] as InventoryTreeRow[] };
    }

    let forTree = allItems;
    if (globalQ) {
      const matching = allItems.filter((item) =>
        itemMatchesGlobalFilter(item, globalQ, labels),
      );
      forTree = includeAncestors(allItems, matching);
    }

    const tree = buildItemTree(forTree);
    return { tableData: tree, treeForExpand: tree };
  }, [effectiveFlat, structuredFiltered, allItems, globalQ]);

  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnsOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [columnsOpen]);

  useEffect(() => {
    if (effectiveFlat) {
      setGrouping(url.groupBy ? [url.groupBy] : []);
    } else {
      setGrouping([]);
    }
  }, [effectiveFlat, url.groupBy]);

  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {};
    for (const col of url.hiddenColumns) vis[col] = false;
    for (const id of DEFAULT_HIDDEN) {
      if (!url.hiddenColumns.has(id)) vis[id] = false;
    }
    if (!effectiveFlat) vis.path = false;
    else vis.expand = false;
    return vis;
  }, [url.hiddenColumns, effectiveFlat]);

  const columns = useMemo((): ColumnDef<InventoryTreeRow>[] => {
    return [
      {
        id: "expand",
        header: () => null,
        size: 40,
        cell: ({ row }) => {
          if (!row.getCanExpand()) {
            return <span className="data-table-expand-spacer" aria-hidden />;
          }
          return (
            <button
              type="button"
              className="items-table-icon-btn"
              onClick={row.getToggleExpandedHandler()}
              aria-label={row.getIsExpanded() ? "Zbaliť" : "Rozbaliť"}
            >
              {row.getIsExpanded() ? "▼" : "▶"}
            </button>
          );
        },
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
        enableGrouping: true,
      },
      {
        accessorKey: "name",
        header: "Názov",
        cell: ({ row, getValue }) => {
          const name = getValue<string | null>();
          return (
            <Link to={`/items/${row.original.id}`} className="data-table-name-link">
              {name ?? <em className="muted">(bez názvu)</em>}
            </Link>
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
          return v ? <code className="data-table-qr">{v}</code> : <span className="muted">—</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 110,
        cell: ({ getValue }) => STATUS_LABEL[getValue<Status>()],
        enableGrouping: true,
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
    ];
  }, [pathMap]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      grouping,
      columnVisibility,
    },
    onExpandedChange: setExpanded,
    onGroupingChange: setGrouping,
    getSubRows: effectiveFlat ? undefined : (row: InventoryTreeRow) => row.subRows,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    enableGrouping: effectiveFlat,
  });

  const rows = table.getRowModel().rows;
  const visibleCount = rows.length;
  const totalCount = structuredFiltered.length;

  function expandAll() {
    setExpanded(collectExpandableIds(treeForExpand));
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

  function handleGroupChange(value: string) {
    const g = value as GroupBy;
    url.setGroupBy(g);
    setGrouping(g ? [g] : []);
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
        <div className="items-table-toolbar-row items-table-toolbar-main">
          <label className="items-table-search-label">
            <span className="sr-only">Hľadať v tabuľke</span>
            <input
              type="search"
              className="items-table-search-input"
              value={url.globalFilter}
              onChange={(e) => url.setGlobalFilter(e.target.value)}
              placeholder="Filtrovať zobrazené riadky…"
            />
          </label>
          <div className="items-table-mode-toggle" role="group" aria-label="Režim zobrazenia">
            <button
              type="button"
              className={`btn-small ${!effectiveFlat ? "btn-primary" : "btn-ghost"}`}
              onClick={() => url.setMode("tree")}
            >
              Strom
            </button>
            <button
              type="button"
              className={`btn-small ${effectiveFlat && url.mode === "flat" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => url.setMode("flat")}
            >
              Zoznam
            </button>
          </div>
        </div>

        <p className="items-table-hint muted">
          Rýchly filter nad načítanými položkami. Fulltext vrátane OCR textu z fotiek je v tlačidle{" "}
          <strong>Hľadať (OCR)</strong> hore vpravo.
        </p>

        {hasStructuredFilters && url.mode === "tree" && (
          <p className="items-table-hint items-table-hint-filter muted">
            Aktívny filter typu/statusu — zobrazujem plochý zoznam. Pre hierarchiu zrušte filtre.
          </p>
        )}

        <div className="items-table-toolbar-row items-table-filters">
          <span className="items-table-filter-label">Typ</span>
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
        </div>

        <div className="items-table-toolbar-row items-table-filters-secondary">
          <select
            className="items-table-select"
            value={url.statusFilter}
            onChange={(e) => url.setStatusFilter(e.target.value)}
            aria-label="Filter status"
          >
            <option value="">Všetky statusy</option>
            {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
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
          {effectiveFlat && (
            <label className="items-table-group-label">
              Zoskupiť
              <select
                className="items-table-select"
                value={url.groupBy}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                <option value="">—</option>
                <option value="type_code">Typ</option>
                <option value="status">Status</option>
              </select>
            </label>
          )}
        </div>

        <div className="items-table-toolbar-row items-table-actions">
          {!effectiveFlat && (
            <div className="items-table-icon-group" role="group" aria-label="Rozbalenie stromu">
              <button
                type="button"
                className="items-table-icon-btn"
                onClick={expandAll}
                title="Rozbaliť všetko"
                aria-label="Rozbaliť všetko"
              >
                ⬇
              </button>
              <button
                type="button"
                className="items-table-icon-btn"
                onClick={collapseAll}
                title="Zbaliť všetko"
                aria-label="Zbaliť všetko"
              >
                ⬆
              </button>
            </div>
          )}

          <div className="items-table-columns-wrap" ref={columnsRef}>
            <button
              type="button"
              className={`items-table-chip ${columnsOpen ? "items-table-chip-active" : ""}`}
              onClick={() => setColumnsOpen((v) => !v)}
              aria-expanded={columnsOpen}
              aria-haspopup="true"
            >
              Stĺpce ▾
            </button>
            {columnsOpen && (
              <div className="items-table-columns-menu">
                {toggleableColumns.map((col) => {
                  const id = col.id;
                  return (
                    <label key={id} className="items-table-check">
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={() => toggleColumn(id)}
                      />
                      {COLUMN_LABELS[id] ?? id}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" className="items-table-chip" onClick={url.clearFilters}>
            Zrušiť filtre
          </button>

          <span className="items-table-count muted">
            <strong>{visibleCount}</strong>
            {globalQ || hasStructuredFilters ? ` / ${totalCount}` : ` položiek`}
          </span>
        </div>
      </div>

      <div className="data-table-wrap card">
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                      }}
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
                    {hasStructuredFilters || globalQ
                      ? "Žiadne položky nevyhovujú filtrom."
                      : "Žiadne položky."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.depth > 0 ? "data-table-row-child" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          paddingLeft:
                            cell.column.id === "name" && !effectiveFlat
                              ? `${8 + row.depth * 16}px`
                              : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

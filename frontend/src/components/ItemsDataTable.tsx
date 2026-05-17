import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
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
  type InventoryTreeRow,
} from "../lib/itemInventory";
import { useItemsTableUrlState, type GroupBy } from "../hooks/useItemsTableUrlState";

const STATUS_LABEL: Record<Status, string> = {
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

function globalFilterFn(
  row: { original: InventoryItem },
  _columnId: string,
  filterValue: string,
): boolean {
  const q = String(filterValue).toLowerCase().trim();
  if (!q) return true;
  const item = row.original;
  const hay = [
    item.name,
    item.qr_code,
    item.note,
    TYPE_LABEL[item.type_code],
    STATUS_LABEL[item.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

type ItemsDataTableProps = {
  onAdvancedSearch?: () => void;
};

export function ItemsDataTable({ onAdvancedSearch }: ItemsDataTableProps) {
  const url = useItemsTableUrlState();
  const inventoryQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });

  const allItems = inventoryQ.data ?? [];

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (url.typeFilters.length > 0 && !url.typeFilters.includes(item.type_code)) {
        return false;
      }
      if (url.statusFilter && item.status !== url.statusFilter) return false;
      if (url.hasQr && !item.qr_code) return false;
      if (url.hasPhoto && item._count.photos === 0) return false;
      return true;
    });
  }, [allItems, url.typeFilters, url.statusFilter, url.hasQr, url.hasPhoto]);

  const pathMap = useMemo(() => buildPathMap(filteredItems), [filteredItems]);
  const treeData = useMemo(() => buildItemTree(filteredItems), [filteredItems]);

  const tableData: InventoryTreeRow[] = useMemo(
    () => (url.mode === "tree" ? treeData : filteredItems),
    [url.mode, treeData, filteredItems],
  );

  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);

  useEffect(() => {
    if (url.mode === "tree") {
      setGrouping([]);
    } else if (url.groupBy) {
      setGrouping([url.groupBy]);
    } else {
      setGrouping([]);
    }
  }, [url.mode, url.groupBy]);

  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {};
    for (const col of url.hiddenColumns) vis[col] = false;
    for (const id of DEFAULT_HIDDEN) {
      if (!url.hiddenColumns.has(id)) vis[id] = false;
    }
    if (url.mode === "tree") vis.path = false;
    else vis.expand = false;
    return vis;
  }, [url.hiddenColumns, url.mode]);

  const columns = useMemo((): ColumnDef<InventoryTreeRow>[] => {
    const cols: ColumnDef<InventoryTreeRow>[] = [
      {
        id: "expand",
        header: () => null,
        size: 44,
        cell: ({ row }) => {
          if (!row.getCanExpand()) {
            return <span className="data-table-expand-spacer" aria-hidden />;
          }
          return (
            <button
              type="button"
              className="btn-ghost btn-small data-table-expand-btn"
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
    return cols;
  }, [pathMap]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      grouping,
      globalFilter: url.globalFilter,
      columnVisibility,
    },
    onExpandedChange: setExpanded,
    onGroupingChange: setGrouping,
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(url.globalFilter) : updater;
      url.setGlobalFilter(String(next ?? ""));
    },
    getSubRows:
      url.mode === "tree" ? (row: InventoryTreeRow) => row.subRows : undefined,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    globalFilterFn,
    filterFromLeafRows: url.mode === "tree",
    enableGrouping: url.mode === "flat",
  });

  const visibleCount = table.getFilteredRowModel().rows.length;
  const totalCount = filteredItems.length;

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
        <div className="items-table-toolbar-row">
          <label className="items-table-search-label">
            <span className="sr-only">Hľadať v tabuľke</span>
            <input
              type="search"
              className="items-table-search-input"
              value={url.globalFilter}
              onChange={(e) => url.setGlobalFilter(e.target.value)}
              placeholder="Hľadať v tabuľke…"
            />
          </label>
          <div className="items-table-mode-toggle" role="group" aria-label="Režim zobrazenia">
            <button
              type="button"
              className={`btn-small ${url.mode === "tree" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => url.setMode("tree")}
            >
              Strom
            </button>
            <button
              type="button"
              className={`btn-small ${url.mode === "flat" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => url.setMode("flat")}
            >
              Zoznam
            </button>
          </div>
        </div>

        <div className="items-table-toolbar-row items-table-filters">
          <span className="items-table-filter-label">Typ:</span>
          {url.ALL_TYPES.map((code) => (
            <button
              key={code}
              type="button"
              className={`btn-small ${
                url.typeFilters.includes(code) ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => toggleTypeFilter(code)}
            >
              {TYPE_LABEL[code]}
            </button>
          ))}
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
        </div>

        <div className="items-table-toolbar-row">
          {url.mode === "tree" && (
            <>
              <button type="button" className="btn-ghost btn-small" onClick={expandAll}>
                Rozbaliť všetko
              </button>
              <button type="button" className="btn-ghost btn-small" onClick={collapseAll}>
                Zbaliť všetko
              </button>
            </>
          )}
          {url.mode === "flat" && (
            <label className="items-table-group-label">
              Zoskupiť:
              <select
                className="items-table-select"
                value={url.groupBy}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                <option value="">— žiadne —</option>
                <option value="type_code">Typ</option>
                <option value="status">Status</option>
              </select>
            </label>
          )}
          <details className="items-table-columns-details">
            <summary className="btn-ghost btn-small">Stĺpce</summary>
            <div className="items-table-columns-menu">
              {toggleableColumns.map((col) => {
                const id = col.id;
                const visible = col.getIsVisible();
                return (
                  <label key={id} className="items-table-check">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => toggleColumn(id)}
                    />
                    {COLUMN_LABELS[id] ?? id}
                  </label>
                );
              })}
            </div>
          </details>
          <button type="button" className="btn-ghost btn-small" onClick={url.clearFilters}>
            Zrušiť filtre
          </button>
          {onAdvancedSearch && (
            <button type="button" className="btn-ghost btn-small" onClick={onAdvancedSearch}>
              Pokročilé hľadanie (OCR)
            </button>
          )}
          <span className="items-table-count muted">
            Zobrazených: <strong>{visibleCount}</strong> / {totalCount}
          </span>
        </div>
      </div>

      <div className="data-table-wrap card data-table-scroll">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  Žiadne položky nevyhovujú filtrom.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={row.depth > 0 ? "data-table-row-child" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        paddingLeft:
                          cell.column.id === "name" && url.mode === "tree"
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
  );
}


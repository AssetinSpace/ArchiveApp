import { useEffect, useMemo, useRef, useState } from "react";
import type { TableSortState } from "../lib/itemsTableColumnFilter";

export type ColumnFilterOption = {
  value: string;
  label: string;
  count: number;
};

type Props = {
  label: string;
  columnId: string;
  options: ColumnFilterOption[];
  selectedValues: string[] | undefined;
  sort: TableSortState;
  globalSortColumnId: string | null;
  onFilterChange: (columnId: string, values: string[] | null) => void;
  onSortChange: (columnId: string, desc: boolean | null) => void;
  onClearColumn: (columnId: string) => void;
};

export function ItemsTableColumnHeader({
  label,
  columnId,
  options,
  selectedValues,
  sort,
  globalSortColumnId,
  onFilterChange,
  onSortChange,
  onClearColumn,
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const isFiltered = !!selectedValues && selectedValues.length > 0;
  const isSorted = globalSortColumnId === columnId;
  const sortDesc = sort?.columnId === columnId && sort.desc;

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("sk");
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLocaleLowerCase("sk").includes(q) ||
        o.value.toLocaleLowerCase("sk").includes(q),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleValue(value: string) {
    const current = new Set(selectedValues ?? []);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    const next = [...current];
    onFilterChange(columnId, next.length > 0 ? next : null);
  }

  function selectAllVisible() {
    const next = new Set(selectedValues ?? []);
    for (const o of filteredOptions) next.add(o.value);
    onFilterChange(columnId, [...next]);
  }

  function clearVisible() {
    if (!selectedValues?.length) return;
    const visible = new Set(filteredOptions.map((o) => o.value));
    const next = selectedValues.filter((v) => !visible.has(v));
    onFilterChange(columnId, next.length > 0 ? next : null);
  }

  return (
    <div className="data-table-col-header" ref={wrapRef}>
      <span className="data-table-col-header-label" title={label}>
        {label}
      </span>
      <button
        type="button"
        className={[
          "data-table-col-header-btn",
          isFiltered ? "data-table-col-header-btn--active" : "",
          isSorted ? "data-table-col-header-btn--sorted" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Filter a zoradenie: ${label}`}
        title="Filter a zoradenie"
      >
        {isSorted ? (sortDesc ? "▼" : "▲") : "▾"}
      </button>

      {open && (
        <div
          className="data-table-col-menu"
          role="dialog"
          aria-label={`Filter stĺpca ${label}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="data-table-col-menu-section">
            <span className="data-table-col-menu-heading">Zoradiť</span>
            <div className="data-table-col-menu-sort">
              <button
                type="button"
                className={`data-table-col-menu-sort-btn${
                  isSorted && !sortDesc ? " data-table-col-menu-sort-btn--active" : ""
                }`}
                onClick={() => onSortChange(columnId, false)}
              >
                A → Z
              </button>
              <button
                type="button"
                className={`data-table-col-menu-sort-btn${
                  isSorted && sortDesc ? " data-table-col-menu-sort-btn--active" : ""
                }`}
                onClick={() => onSortChange(columnId, true)}
              >
                Z → A
              </button>
              {isSorted && (
                <button
                  type="button"
                  className="data-table-col-menu-link"
                  onClick={() => onSortChange(columnId, null)}
                >
                  Zrušiť zoradenie
                </button>
              )}
            </div>
          </div>

          <div className="data-table-col-menu-section">
            <span className="data-table-col-menu-heading">Filtrovať hodnoty</span>
            <input
              type="search"
              className="data-table-col-menu-search"
              placeholder="Hľadať v zozname…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="data-table-col-menu-actions">
              <button type="button" className="data-table-col-menu-link" onClick={selectAllVisible}>
                Označiť viditeľné
              </button>
              <button type="button" className="data-table-col-menu-link" onClick={clearVisible}>
                Zrušiť viditeľné
              </button>
            </div>
            <ul className="data-table-col-menu-list">
              {filteredOptions.length === 0 ? (
                <li className="data-table-col-menu-empty muted">Žiadne hodnoty</li>
              ) : (
                filteredOptions.map((opt) => (
                  <li key={opt.value}>
                    <label className="data-table-col-menu-item">
                      <input
                        type="checkbox"
                        checked={selectedValues?.includes(opt.value) ?? false}
                        onChange={() => toggleValue(opt.value)}
                      />
                      <span className="data-table-col-menu-item-label" title={opt.label}>
                        {opt.label}
                      </span>
                      <span className="data-table-col-menu-item-count muted">
                        ({opt.count})
                      </span>
                    </label>
                  </li>
                ))
              )}
            </ul>
            {isFiltered && (
              <button
                type="button"
                className="data-table-col-menu-clear"
                onClick={() => {
                  onClearColumn(columnId);
                  setOpen(false);
                }}
              >
                Zrušiť filter stĺpca
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

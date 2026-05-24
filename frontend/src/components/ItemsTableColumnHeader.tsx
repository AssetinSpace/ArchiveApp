import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TableSortState } from "../lib/itemsTableColumnFilter";

export type ColumnFilterOption = {
  value: string;
  label: string;
  count: number;
};

const MENU_WIDTH = 260;
const VIEWPORT_PAD = 8;

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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const repositionMenu = useCallback(() => {
    const anchor = btnRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuHeight = menu.offsetHeight;
    const menuW = Math.min(MENU_WIDTH, vw - VIEWPORT_PAD * 2);

    let left = rect.left;
    if (left + menuW > vw - VIEWPORT_PAD) {
      left = vw - menuW - VIEWPORT_PAD;
    }
    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;

    let top = rect.bottom + 4;
    if (top + menuHeight > vh - VIEWPORT_PAD) {
      const above = rect.top - menuHeight - 4;
      top = above >= VIEWPORT_PAD ? above : VIEWPORT_PAD;
    }

    const maxH = vh - top - VIEWPORT_PAD;
    setMenuStyle({
      position: "fixed",
      left,
      top,
      width: menuW,
      maxHeight: maxH,
      zIndex: 25000,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    repositionMenu();
    const menu = menuRef.current;
    if (!menu) return;
    const ro = new ResizeObserver(() => repositionMenu());
    ro.observe(menu);
    return () => ro.disconnect();
  }, [open, repositionMenu, filteredOptions.length, search]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReflow() {
      repositionMenu();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, repositionMenu]);

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

  const menu = open ? (
    <div
      ref={menuRef}
      className="data-table-col-menu"
      style={menuStyle}
      role="dialog"
      aria-label={`Filter stĺpca ${label}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="data-table-col-menu-section data-table-col-menu-section--sort">
        <span className="data-table-col-menu-heading">Zoradiť</span>
        <div className="data-table-col-menu-sort">
          <button
            type="button"
            className={`data-table-col-menu-sort-btn${
              isSorted && !sortDesc ? " data-table-col-menu-sort-btn--active" : ""
            }`}
            onClick={() => onSortChange(columnId, false)}
          >
            A→Z
          </button>
          <button
            type="button"
            className={`data-table-col-menu-sort-btn${
              isSorted && sortDesc ? " data-table-col-menu-sort-btn--active" : ""
            }`}
            onClick={() => onSortChange(columnId, true)}
          >
            Z→A
          </button>
          {isSorted && (
            <button
              type="button"
              className="data-table-col-menu-link"
              onClick={() => onSortChange(columnId, null)}
            >
              Zrušiť
            </button>
          )}
        </div>
      </div>

      <div className="data-table-col-menu-section data-table-col-menu-section--filter">
        <span className="data-table-col-menu-heading">Filtrovať</span>
        <input
          type="search"
          className="data-table-col-menu-search"
          placeholder="Hľadať…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="data-table-col-menu-actions">
          <button type="button" className="data-table-col-menu-link" onClick={selectAllVisible}>
            Všetko
          </button>
          <button type="button" className="data-table-col-menu-link" onClick={clearVisible}>
            Nič
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
                  <span className="data-table-col-menu-item-count">{opt.count}</span>
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
            Zrušiť filter
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="data-table-col-header" ref={wrapRef}>
      <span className="data-table-col-header-label" title={label}>
        {label}
      </span>
      <button
        ref={btnRef}
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

      {menu && createPortal(menu, document.body)}
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ColumnPickerEntry = {
  id: string;
  label: string;
  group: string;
};

export type ColumnPickerGroupDef = {
  id: string;
  title: string;
};

type VisibilityFilter = "all" | "visible" | "hidden";

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  entries: ColumnPickerEntry[];
  groups: ColumnPickerGroupDef[];
  visibleIds: Set<string>;
  onClose: () => void;
  onApply: (visibleIds: Set<string>) => void;
  applyLabel?: string;
  titleId?: string;
  portalTarget?: HTMLElement | null;
  extraToolbar?: ReactNode;
  headerActions?: ReactNode;
  /** Väčší layout pri otvorení z celoobrazovkovej tabuľky. */
  fullscreen?: boolean;
};

function matchesColumnSearch(entry: ColumnPickerEntry, q: string): boolean {
  return (
    entry.label.toLowerCase().includes(q) ||
    entry.id.toLowerCase().includes(q) ||
    (entry.id.startsWith("meta_") && entry.id.slice(5).toLowerCase().includes(q))
  );
}

function ColumnGroup({
  title,
  entries,
  draft,
  onToggle,
  onSelectAll,
  onSelectNone,
}: {
  title: string;
  entries: ColumnPickerEntry[];
  draft: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  if (entries.length === 0) return null;
  const visibleInGroup = entries.filter((e) => draft.has(e.id)).length;

  return (
    <section className="items-columns-modal-group">
      <div className="items-columns-modal-group-head">
        <h3>
          {title}{" "}
          <span className="muted">
            ({visibleInGroup}/{entries.length})
          </span>
        </h3>
        <div className="items-columns-modal-group-actions">
          <button type="button" className="btn-link" onClick={onSelectAll}>
            Všetko
          </button>
          <button type="button" className="btn-link" onClick={onSelectNone}>
            Nič
          </button>
        </div>
      </div>
      <ul className="items-columns-modal-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <label className="items-table-check items-columns-modal-check">
              <input
                type="checkbox"
                checked={draft.has(entry.id)}
                onChange={() => onToggle(entry.id)}
              />
              <span>{entry.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ColumnPickerModal({
  open,
  title,
  subtitle,
  entries,
  groups,
  visibleIds,
  onClose,
  onApply,
  applyLabel = "Použiť",
  titleId = "column-picker-modal-title",
  portalTarget,
  extraToolbar,
  headerActions,
  fullscreen = false,
}: Props) {
  const [draft, setDraft] = useState<Set<string>>(visibleIds);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  useEffect(() => {
    if (open) {
      setDraft(new Set(visibleIds));
      setQuery("");
      setGroupFilter(null);
      setVisibilityFilter("all");
    }
  }, [open, visibleIds]);

  const filtered = useMemo(() => {
    let list = entries;
    if (visibilityFilter === "visible") {
      list = list.filter((e) => draft.has(e.id));
    } else if (visibilityFilter === "hidden") {
      list = list.filter((e) => !draft.has(e.id));
    }
    if (groupFilter) {
      list = list.filter((e) => e.group === groupFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => matchesColumnSearch(e, q));
    }
    return list;
  }, [entries, query, groupFilter, visibilityFilter, draft]);

  const hasListFilters =
    !!query.trim() || groupFilter !== null || visibilityFilter !== "all";

  function toggle(id: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setGroup(ids: string[], visible: boolean) {
    setDraft((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (visible) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  if (!open) return null;

  const allIds = entries.map((e) => e.id);

  return createPortal(
    <div
      className="create-modal-overlay items-columns-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`create-modal-box items-columns-modal-box${fullscreen ? " items-columns-modal-box--fullscreen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="items-columns-modal-header">
          <h2 id={titleId}>{title}</h2>
          <p className="muted items-columns-modal-sub">{subtitle}</p>
        </header>

        <div className="items-columns-modal-toolbar">
          <label className="items-columns-modal-search form-label">
            <span className="sr-only">Hľadať stĺpec</span>
            <input
              type="search"
              className="items-table-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hľadať stĺpec podľa názvu alebo kľúča…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <div className="items-columns-modal-filters">
            <span className="items-columns-modal-filter-label">Skupina</span>
            <div
              className="items-columns-modal-filter-chips"
              role="group"
              aria-label="Filter skupiny stĺpcov"
            >
              <button
                type="button"
                className={`items-table-chip${groupFilter === null ? " items-table-chip-active" : ""}`}
                onClick={() => setGroupFilter(null)}
              >
                Všetky
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`items-table-chip${groupFilter === g.id ? " items-table-chip-active" : ""}`}
                  onClick={() => setGroupFilter((prev) => (prev === g.id ? null : g.id))}
                >
                  {g.title}
                </button>
              ))}
            </div>

            <span className="items-columns-modal-filter-label">Stav</span>
            <div
              className="items-columns-modal-filter-chips"
              role="group"
              aria-label="Filter viditeľnosti stĺpcov"
            >
              {(
                [
                  ["all", "Všetky"],
                  ["visible", "Zobrazené"],
                  ["hidden", "Skryté"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`items-table-chip${visibilityFilter === id ? " items-table-chip-active" : ""}`}
                  onClick={() => setVisibilityFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {hasListFilters && (
              <button
                type="button"
                className="items-table-chip"
                onClick={() => {
                  setQuery("");
                  setGroupFilter(null);
                  setVisibilityFilter("all");
                }}
              >
                Zrušiť filtre
              </button>
            )}
          </div>
        </div>

        <div className="items-columns-modal-quick">
          <button
            type="button"
            className="btn-link"
            onClick={() => setGroup(allIds, true)}
          >
            Zobraziť všetko
          </button>
          <button
            type="button"
            className="btn-link"
            onClick={() => setGroup(allIds, false)}
          >
            Skryť všetko
          </button>
          {headerActions}
          <span className="muted">
            Vybraných: {draft.size} / {entries.length}
            {hasListFilters && (
              <>
                {" "}
                · v zozname {filtered.length}
              </>
            )}
          </span>
        </div>

        {extraToolbar}

        <div className="items-columns-modal-body">
          {groups
            .filter((g) => !groupFilter || g.id === groupFilter)
            .map((g) => {
              const groupEntries = filtered.filter((e) => e.group === g.id);
              return (
                <ColumnGroup
                  key={g.id}
                  title={g.title}
                  entries={groupEntries}
                  draft={draft}
                  onToggle={toggle}
                  onSelectAll={() => setGroup(groupEntries.map((e) => e.id), true)}
                  onSelectNone={() => setGroup(groupEntries.map((e) => e.id), false)}
                />
              );
            })}
          {filtered.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>
              {hasListFilters
                ? "Žiadny stĺpec nevyhovuje filtrom ani hľadaniu."
                : "Žiadny stĺpec v zozname."}
            </p>
          )}
        </div>

        <footer className="items-columns-modal-footer">
          <button type="button" onClick={onClose}>
            Zrušiť
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onApply(draft)}
            disabled={draft.size === 0}
          >
            {applyLabel}
          </button>
        </footer>
      </div>
    </div>,
    portalTarget ?? document.body,
  );
}

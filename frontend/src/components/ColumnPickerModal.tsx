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
};

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
}: Props) {
  const [draft, setDraft] = useState<Set<string>>(visibleIds);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(new Set(visibleIds));
      setQuery("");
    }
  }, [open, visibleIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.id.startsWith("meta_") && e.id.slice(5).toLowerCase().includes(q)),
    );
  }, [entries, query]);

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
        className="create-modal-box items-columns-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="items-columns-modal-header">
          <h2 id={titleId}>{title}</h2>
          <p className="muted items-columns-modal-sub">{subtitle}</p>
        </header>

        <label className="items-columns-modal-search form-label">
          <span className="sr-only">Hľadať stĺpec</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hľadať stĺpec…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

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
          </span>
        </div>

        {extraToolbar}

        <div className="items-columns-modal-body">
          {groups.map((g) => {
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
              Žiadny stĺpec nevyhovuje hľadaniu.
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

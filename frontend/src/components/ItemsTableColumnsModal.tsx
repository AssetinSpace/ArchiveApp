import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type ColumnPickerEntry = {
  id: string;
  label: string;
  group: "base" | "metadata";
};

type Props = {
  open: boolean;
  entries: ColumnPickerEntry[];
  visibleIds: Set<string>;
  onClose: () => void;
  onApply: (visibleIds: Set<string>) => void;
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
      <GroupHeader
        title={title}
        visibleInGroup={visibleInGroup}
        total={entries.length}
        onSelectAll={onSelectAll}
        onSelectNone={onSelectNone}
      />
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

function GroupHeader({
  title,
  visibleInGroup,
  total,
  onSelectAll,
  onSelectNone,
}: {
  title: string;
  visibleInGroup: number;
  total: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  return (
    <div className="items-columns-modal-group-head">
      <h3>
        {title}{" "}
        <span className="muted">
          ({visibleInGroup}/{total})
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
  );
}

export function ItemsTableColumnsModal({
  open,
  entries,
  visibleIds,
  onClose,
  onApply,
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
        (e.group === "metadata" && e.id.slice(5).toLowerCase().includes(q)),
    );
  }, [entries, query]);

  const baseEntries = filtered.filter((e) => e.group === "base");
  const metaEntries = filtered.filter((e) => e.group === "metadata");

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
        aria-labelledby="items-columns-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="items-columns-modal-header">
          <h2 id="items-columns-modal-title">Stĺpce tabuľky</h2>
          <p className="muted items-columns-modal-sub">
            Vyber, čo chceš vidieť v inventári. Nastavenie sa uloží v tomto
            prehliadači.
          </p>
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

        <QuickActions
          allIds={allIds}
          draftSize={draft.size}
          total={entries.length}
          setGroup={setGroup}
        />

        <div className="items-columns-modal-body">
          <ColumnGroup
            title="Položka"
            entries={baseEntries}
            draft={draft}
            onToggle={toggle}
            onSelectAll={() => setGroup(baseEntries.map((e) => e.id), true)}
            onSelectNone={() => setGroup(baseEntries.map((e) => e.id), false)}
          />
          <ColumnGroup
            title="Metadáta"
            entries={metaEntries}
            draft={draft}
            onToggle={toggle}
            onSelectAll={() => setGroup(metaEntries.map((e) => e.id), true)}
            onSelectNone={() => setGroup(metaEntries.map((e) => e.id), false)}
          />
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
          >
            Použiť
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function QuickActions({
  allIds,
  draftSize,
  total,
  setGroup,
}: {
  allIds: string[];
  draftSize: number;
  total: number;
  setGroup: (ids: string[], visible: boolean) => void;
}) {
  return (
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
      <span className="muted">
        Viditeľných: {draftSize} / {total}
      </span>
    </div>
  );
}

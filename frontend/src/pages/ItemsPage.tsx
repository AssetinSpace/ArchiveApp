import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  PARENT_TYPE_BY_CHILD,
  TYPE_LABEL,
  type Item,
  type ItemType,
} from "../api";
import { ItemSearchPanel } from "./SearchPage";

type ItemsView = "tree" | "create" | "search";

// ─── tree node ────────────────────────────────────────────────────────────────

function TreeNode({ item, level }: { item: Item; level: number }) {
  const [expanded, setExpanded] = useState(false);

  const childrenQ = useQuery({
    queryKey: ["items", "children", item.id],
    queryFn: () => api.getChildren(item.id),
    enabled: expanded,
    staleTime: 30_000,
  });

  const children = childrenQ.data ?? [];
  const isLoading = childrenQ.isFetching;
  const mightHaveChildren = childrenQ.data === undefined || children.length > 0;
  const isEmpty = childrenQ.data !== undefined && children.length === 0;

  // Menší indent na mobile aby sa zmestili 4 úrovne do 375px.
  const indent = level * 14;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: indent + 4,
          paddingRight: 4,
          minHeight: 48,
          borderRadius: 6,
        }}
      >
        <button
          type="button"
          className="btn-ghost btn-small"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Zbaliť" : "Rozbaliť"}
          style={{
            minWidth: 44,
            minHeight: 44,
            padding: 0,
            color: mightHaveChildren ? "#374151" : "transparent",
            visibility: mightHaveChildren ? "visible" : "hidden",
          }}
        >
          {expanded ? "▼" : "▶"}
        </button>

        <span className={`badge badge-${item.type_code.toLowerCase()}`}>
          {TYPE_LABEL[item.type_code] ?? item.type_code}
        </span>

        <Link
          to={`/items/${item.id}`}
          style={{
            flexGrow: 1,
            color: "#111827",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name ?? <em className="muted">(bez názvu)</em>}
        </Link>
      </div>

      {expanded && (
        <div
          style={{
            borderLeft: "2px solid #e5e7eb",
            marginLeft: indent + 14,
          }}
        >
          {isLoading && (
            <div className="muted" style={{ padding: "6px 12px", fontSize: 13 }}>
              Načítavam…
            </div>
          )}
          {children.map((child) => (
            <TreeNode key={child.id} item={child} level={level + 1} />
          ))}
          {isEmpty && (
            <div
              className="muted"
              style={{ padding: "6px 12px", fontSize: 12, color: "#d1d5db" }}
            >
              Žiadne položky
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── tree root ────────────────────────────────────────────────────────────────

function TreeView() {
  const rootQ = useQuery({
    queryKey: ["items", "root"],
    queryFn: () => api.listItems({ parent_id: null }),
  });

  if (rootQ.isLoading) return <p className="muted">Načítavam…</p>;
  if (rootQ.error)
    return <p className="error">Chyba: {(rootQ.error as Error).message}</p>;
  const roots = rootQ.data ?? [];
  if (roots.length === 0) return <p className="muted">Žiadne položky</p>;

  return (
    <div>
      {roots.map((item) => (
        <TreeNode key={item.id} item={item} level={0} />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function ItemsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ItemsView>("tree");

  const typesQ = useQuery({ queryKey: ["item-types"], queryFn: () => api.itemTypes() });
  const itemsQ = useQuery({ queryKey: ["items", "all"], queryFn: () => api.listItems() });

  const items = itemsQ.data ?? [];
  const types = typesQ.data ?? [];

  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  function getFullPath(item: Item): string {
    const parts: string[] = [];
    let cur: Item | undefined = item;
    const seen = new Set<string>();
    while (cur) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      parts.unshift(cur.name ?? "(bez názvu)");
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }
    return parts.join(" › ");
  }

  useEffect(() => {
    const panel = searchParams.get("panel");
    if (panel === "create" || panel === "search") {
      setView(panel);
    } else if (!panel) {
      setView("tree");
    }
  }, [searchParams]);

  function switchView(next: ItemsView) {
    setView(next);
    if (next === "tree") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ panel: next }, { replace: true });
    }
  }

  return (
    <div className="stack">
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
      >
        <h1 style={{ margin: 0 }}>Položky</h1>
        <div className="row" style={{ gap: 4 }}>
          {view === "tree" ? (
            <>
              <button
                type="button"
                className="btn-ghost btn-small"
                onClick={() => switchView("search")}
              >
                Hľadať
              </button>
              <button
                type="button"
                className="btn-primary btn-small"
                onClick={() => switchView("create")}
              >
                Vytvoriť
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-ghost btn-small"
              onClick={() => switchView("tree")}
            >
              ← Späť na zoznam
            </button>
          )}
        </div>
      </div>

      {view === "tree" && (
        <section className="card">
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 12 }}
          >
            <h2 style={{ margin: 0 }}>Strom položiek</h2>
            <Legend />
          </div>
          <p className="muted" style={{ margin: "0 0 12px" }}>
            Klikni na šípku pre rozbalenie, na názov pre detail.
          </p>
          <TreeView />
        </section>
      )}

      {view === "create" && (
        <section className="card">
          <h2>Vytvoriť položku</h2>
          <CreateItemFormContent
            types={types}
            items={items}
            getFullPath={getFullPath}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["items", "all"] });
              qc.invalidateQueries({ queryKey: ["items", "root"] });
              switchView("tree");
            }}
          />
        </section>
      )}

      {view === "search" && <ItemSearchPanel autoFocus />}
    </div>
  );
}

// ─── Reusable create-item form ────────────────────────────────────────────────

function CreateItemFormContent({
  types,
  items,
  getFullPath,
  onCreated,
}: {
  types: ItemType[];
  items: Item[];
  getFullPath: (item: Item) => string;
  onCreated: (created: Item) => void;
}) {
  const qc = useQueryClient();
  const [typeCode, setTypeCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const expectedParentType = useMemo(
    () => (typeCode ? PARENT_TYPE_BY_CHILD[typeCode] ?? null : null),
    [typeCode],
  );
  const parentNeeded = typeCode !== "" && typeCode !== "SKLAD";
  const eligibleParents = useMemo(
    () => expectedParentType ? items.filter((it) => it.type_code === expectedParentType) : [],
    [items, expectedParentType],
  );

  const createMut = useMutation({
    mutationFn: api.createItem,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["items", "all"] });
      if (!created.parent_id) {
        qc.invalidateQueries({ queryKey: ["items", "root"] });
      } else {
        qc.invalidateQueries({ queryKey: ["items", "children", created.parent_id] });
      }
      setName("");
      setParentId("");
      setNote("");
      setFormError(null);
      onCreated(created);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!typeCode) { setFormError("Vyber typ položky"); return; }
    if (parentNeeded && !parentId) {
      setFormError(
        `Pre typ ${TYPE_LABEL[typeCode] ?? typeCode} musíš vybrať nadradenú položku (${
          TYPE_LABEL[expectedParentType ?? ""] ?? expectedParentType
        })`,
      );
      return;
    }
    createMut.mutate({
      type_code: typeCode,
      name: name.trim() || null,
      parent_id: parentId || null,
      note: note.trim() || null,
    });
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label className="form-label">
        Typ
        <select value={typeCode} onChange={(e) => { setTypeCode(e.target.value); setParentId(""); }} required>
          <option value="">— vyber typ —</option>
          {types.map((t: ItemType) => (
            <option key={t.code} value={t.code}>{t.label} ({t.code})</option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Názov
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="napr. Krabica pri okne" />
      </label>
      <label className="form-label">
        Nadradená položka
        {typeCode === "" && <input value="" disabled placeholder="(vyber najprv typ)" />}
        {typeCode === "SKLAD" && <input value="(žiadny — sklad je koreň)" disabled />}
        {typeCode !== "" && typeCode !== "SKLAD" && (
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} required>
            <option value="">— vyber {TYPE_LABEL[expectedParentType ?? ""] ?? "nadradenú položku"} —</option>
            {eligibleParents.map((p) => (
              <option key={p.id} value={p.id}>{getFullPath(p)}</option>
            ))}
          </select>
        )}
      </label>
      <label className="form-label">
        Poznámka
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="(voliteľné)" />
      </label>
      {formError && <div className="error">{formError}</div>}
      <button type="submit" className="btn-primary btn-block" disabled={createMut.isPending}>
        {createMut.isPending ? "Ukladám…" : "Vytvoriť"}
      </button>
    </form>
  );
}

function Legend() {
  return (
    <div className="row" style={{ gap: 4 }}>
      {Object.entries(TYPE_LABEL).map(([code, label]) => (
        <span key={code} className={`badge badge-${code.toLowerCase()}`}>
          {label}
        </span>
      ))}
    </div>
  );
}

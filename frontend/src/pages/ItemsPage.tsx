import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  api,
  KIND_DEFAULTS,
  TYPE_LABEL,
  type InventoryItem,
  type Item,
} from "../api";
import { AutoNamePreview } from "../components/AutoNamePreview";
import { ItemsDataTable } from "../components/ItemsDataTable";
import { ItemSearchPanel } from "./SearchPage";

type ItemsView = "tree" | "create" | "search";

export function ItemsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ItemsView>("tree");

  const itemsQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });

  const items = itemsQ.data ?? [];

  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  function getFullPath(item: InventoryItem | Item): string {
    const parts: string[] = [];
    let cur: InventoryItem | Item | undefined = item;
    const seen = new Set<string>();
    while (cur) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      parts.unshift(cur.name);
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
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("panel");
      setSearchParams(nextParams, { replace: true });
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("panel", next);
      setSearchParams(nextParams, { replace: true });
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
            <button
              type="button"
              className="btn-primary btn-small"
              onClick={() => switchView("create")}
            >
              Vytvoriť
            </button>
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
        <section className="stack">
          <ItemsDataTable />
        </section>
      )}

      {view === "create" && (
        <section className="card">
          <h2>Vytvoriť položku</h2>
          <CreateItemFormContent
            items={items}
            getFullPath={getFullPath}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["items", "inventory"] });
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

function CreateItemFormContent({
  items,
  getFullPath,
  onCreated,
}: {
  items: InventoryItem[];
  getFullPath: (item: InventoryItem) => string;
  onCreated: (created: Item) => void;
}) {
  const qc = useQueryClient();
  const [isRoot, setIsRoot] = useState(true);
  const [parentId, setParentId] = useState<string>("");
  const [kindInput, setKindInput] = useState("");
  const [customKind, setCustomKind] = useState(false);
  const [name, setName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
  const parent = parentId ? byId.get(parentId) : undefined;
  const level = isRoot ? 1 : (parent ? parent.level + 1 : 0);
  const defaults = KIND_DEFAULTS[level] ?? [];
  const eligibleParents = useMemo(
    () => items.filter((it) => it.level < 7),
    [items],
  );

  const createMut = useMutation({
    mutationFn: api.createItem,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["items", "inventory"] });
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
    const kind = kindInput.trim();
    if (!kind) {
      setFormError("Vyber alebo napíš typ položky");
      return;
    }
    if (!isRoot && !parentId) {
      setFormError("Vyber nadradenú položku");
      return;
    }
    if (!isRoot && !parent) {
      setFormError("Nadradená položka neexistuje");
      return;
    }
    createMut.mutate({
      level,
      kind,
      name: name.trim() || null,
      parent_id: isRoot ? null : parentId,
      note: note.trim() || null,
    });
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label className="form-label">
        <span className="row" style={{ gap: 12, alignItems: "center" }}>
          <input
            type="radio"
            name="create-root"
            checked={isRoot}
            onChange={() => {
              setIsRoot(true);
              setParentId("");
            }}
          />
          Koreň (úroveň 1)
          <input
            type="radio"
            name="create-root"
            checked={!isRoot}
            onChange={() => setIsRoot(false)}
          />
          Pod existujúcu položku
        </span>
      </label>
      {!isRoot && (
        <label className="form-label">
          Nadradená položka
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} required>
            <option value="">— vyber rodiča —</option>
            {eligibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                L{p.level} {TYPE_LABEL[p.kind] ?? p.kind} — {getFullPath(p)}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="muted" style={{ margin: "0 0 8px" }}>
        Úroveň: <strong>{isRoot ? 1 : level || "—"}</strong>
      </p>
      <label className="form-label">
        Typ položky (kind)
        <select
          value={customKind ? "__custom__" : kindInput}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setCustomKind(true);
              setKindInput("");
            } else {
              setCustomKind(false);
              setKindInput(e.target.value);
            }
          }}
        >
          <option value="">— vyber typ —</option>
          {defaults.map((k) => (
            <option key={k} value={k}>
              {TYPE_LABEL[k] ?? k}
            </option>
          ))}
          <option value="__custom__">Vlastné…</option>
        </select>
      </label>
      {customKind && (
        <label className="form-label">
          Vlastný typ
          <input
            type="text"
            placeholder="Napíš vlastný typ..."
            value={kindInput}
            onChange={(e) => setKindInput(e.target.value)}
            autoFocus
          />
        </label>
      )}
      <label className="form-label">
        Názov
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="(voliteľné — inak sa vygeneruje automaticky)"
        />
      </label>
      <AutoNamePreview
        kind={kindInput}
        parentId={isRoot ? null : parentId || null}
        manualName={name}
      />
      <label className="form-label">
        Poznámka
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="(voliteľné)"
        />
      </label>
      {formError && <div className="error">{formError}</div>}
      <button type="submit" className="btn-primary btn-block" disabled={createMut.isPending}>
        {createMut.isPending ? "Ukladám…" : "Vytvoriť"}
      </button>
    </form>
  );
}

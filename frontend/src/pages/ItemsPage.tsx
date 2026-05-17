import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  api,
  PARENT_TYPE_BY_CHILD,
  TYPE_LABEL,
  type InventoryItem,
  type Item,
  type ItemType,
} from "../api";
import { ItemsDataTable } from "../components/ItemsDataTable";
import { ItemSearchPanel } from "./SearchPage";

type ItemsView = "tree" | "create" | "search";

export function ItemsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ItemsView>("tree");

  const typesQ = useQuery({ queryKey: ["item-types"], queryFn: () => api.itemTypes() });
  const itemsQ = useQuery({
    queryKey: ["items", "inventory"],
    queryFn: () => api.inventoryItems(),
    staleTime: 60_000,
  });

  const items = itemsQ.data ?? [];
  const types = typesQ.data ?? [];

  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  function getFullPath(item: InventoryItem | Item): string {
    const parts: string[] = [];
    let cur: InventoryItem | Item | undefined = item;
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
            <>
              <button
                type="button"
                className="btn-ghost btn-small"
                onClick={() => switchView("search")}
                title="Fulltext v názve, poznámke a OCR texte fotiek"
              >
                Hľadať (OCR)
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
        <section className="stack">
          <ItemsDataTable />
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
  types,
  items,
  getFullPath,
  onCreated,
}: {
  types: ItemType[];
  items: InventoryItem[];
  getFullPath: (item: InventoryItem) => string;
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
    () => (expectedParentType ? items.filter((it) => it.type_code === expectedParentType) : []),
    [items, expectedParentType],
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
    if (!typeCode) {
      setFormError("Vyber typ položky");
      return;
    }
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
        <select
          value={typeCode}
          onChange={(e) => {
            setTypeCode(e.target.value);
            setParentId("");
          }}
          required
        >
          <option value="">— vyber typ —</option>
          {types.map((t: ItemType) => (
            <option key={t.code} value={t.code}>
              {t.label} ({t.code})
            </option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Názov
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="napr. Krabica pri okne"
        />
      </label>
      <label className="form-label">
        Nadradená položka
        {typeCode === "" && <input value="" disabled placeholder="(vyber najprv typ)" />}
        {typeCode === "SKLAD" && <input value="(žiadny — sklad je koreň)" disabled />}
        {typeCode !== "" && typeCode !== "SKLAD" && (
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} required>
            <option value="">
              — vyber {TYPE_LABEL[expectedParentType ?? ""] ?? "nadradenú položku"} —
            </option>
            {eligibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {getFullPath(p)}
              </option>
            ))}
          </select>
        )}
      </label>
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

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  api,
  KIND_DEFAULTS,
  TYPE_LABEL,
  type InventoryItem,
  type Item,
} from "../api";
import { AutoNamePreview } from "../components/AutoNamePreview";
import { ItemsDataTable } from "../components/ItemsDataTable";
import {
  canBeParent,
  getLastCreatedId,
  getStoredPlacementMode,
  recordItemCreated,
  recordParentFocus,
  resolveLastParentId,
  setStoredPlacementMode,
  type PlacementMode,
} from "../lib/createItemContext";
import { ItemSearchPanel } from "./SearchPage";

type ItemsView = "tree" | "create" | "search";

export function ItemsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
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
        <section className="card create-item-card">
          <h2>Vytvoriť položku</h2>
          <CreateItemFormContent
            items={items}
            getFullPath={getFullPath}
            onCreated={(created) => {
              qc.invalidateQueries({ queryKey: ["items", "inventory"] });
              qc.invalidateQueries({ queryKey: ["items", "all"] });
              qc.invalidateQueries({ queryKey: ["items", "root"] });
              navigate(`/items/${created.id}`);
            }}
          />
        </section>
      )}

      {view === "search" && <ItemSearchPanel autoFocus />}
    </div>
  );
}

function resolveParentIdForMode(
  mode: PlacementMode,
  byId: Map<string, InventoryItem>,
): string | null {
  if (mode === "root") return null;
  if (mode === "lastParent") return resolveLastParentId(byId);
  const id = getLastCreatedId();
  if (!id) return null;
  const item = byId.get(id);
  if (!item || !canBeParent(item)) return null;
  return id;
}

function levelWithL(level: number) {
  return <>L{level}</>;
}

function levelWithLNumberStrong(level: number) {
  return (
    <>
      L<strong>{level}</strong>
    </>
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
  const [placementMode, setPlacementMode] = useState<PlacementMode>(() =>
    getStoredPlacementMode(),
  );
  const [parentId, setParentId] = useState<string>("");
  const [kindInput, setKindInput] = useState("");
  const [customKind, setCustomKind] = useState(false);
  const [customName, setCustomName] = useState(false);
  const [nameOverride, setNameOverride] = useState("");
  const [note, setNote] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);
  const isRoot = placementMode === "root";
  const parent = parentId ? byId.get(parentId) : undefined;
  const level = isRoot ? 1 : (parent ? parent.level + 1 : 0);
  const defaults = KIND_DEFAULTS[level] ?? [];
  const eligibleParents = useMemo(
    () => items.filter((it) => it.level < 7),
    [items],
  );

  const lastCreatedItem = useMemo(() => {
    const id = getLastCreatedId();
    return id ? byId.get(id) : undefined;
  }, [items, byId]);

  const lastParentItem = useMemo(() => {
    const id = resolveLastParentId(byId);
    return id ? byId.get(id) : undefined;
  }, [items, byId]);

  const lastCreatedAvailable =
    !!lastCreatedItem && canBeParent(lastCreatedItem);
  const lastParentAvailable =
    !!lastParentItem && canBeParent(lastParentItem);

  useEffect(() => {
    if (placementMode === "root") {
      setParentId("");
      return;
    }
    if (placementMode === "existing") return;
    const resolved = resolveParentIdForMode(placementMode, byId);
    if (resolved) setParentId(resolved);
  }, [placementMode, items, byId]);

  useEffect(() => {
    if (placementMode === "lastCreated" && !lastCreatedAvailable) {
      setPlacementMode("existing");
      setStoredPlacementMode("existing");
    } else if (placementMode === "lastParent" && !lastParentAvailable) {
      setPlacementMode("existing");
      setStoredPlacementMode("existing");
    }
  }, [placementMode, lastCreatedAvailable, lastParentAvailable]);

  function selectPlacement(mode: PlacementMode) {
    setStoredPlacementMode(mode);
    setPlacementMode(mode);
    setFormError(null);
    if (mode === "root") {
      setParentId("");
      return;
    }
    if (mode === "existing") return;
    const resolved = resolveParentIdForMode(mode, byId);
    if (resolved) setParentId(resolved);
  }

  const createMut = useMutation({
    mutationFn: api.createItem,
    onSuccess: (created) => {
      recordItemCreated(created);
      qc.invalidateQueries({ queryKey: ["items", "inventory"] });
      qc.invalidateQueries({ queryKey: ["items", "all"] });
      if (!created.parent_id) {
        qc.invalidateQueries({ queryKey: ["items", "root"] });
      } else {
        qc.invalidateQueries({ queryKey: ["items", "children", created.parent_id] });
      }
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
    if (
      (placementMode === "lastCreated" && !lastCreatedAvailable) ||
      (placementMode === "lastParent" && !lastParentAvailable)
    ) {
      setFormError("Táto možnosť umiestnenia momentálne nie je k dispozícii");
      return;
    }
    const manualName = nameOverride.trim();
    if (customName && !manualName) {
      setFormError("Zadaj vlastný názov alebo použij automatický");
      return;
    }
    createMut.mutate({
      level,
      kind,
      name: customName ? manualName : null,
      parent_id: isRoot ? null : parentId,
      note: note.trim() || null,
    });
  }

  function parentOptionLabel(p: InventoryItem): string {
    return `L${p.level} ${TYPE_LABEL[p.kind] ?? p.kind} — ${getFullPath(p)}`;
  }

  return (
    <form className="form create-item-form" onSubmit={onSubmit}>
      <fieldset className="create-item-placement">
        <legend className="create-item-placement-legend">Umiestnenie v hierarchii</legend>
        <label className={`create-item-placement-option${placementMode === "root" ? " is-selected" : ""}`}>
          <input
            type="radio"
            name="create-placement"
            checked={placementMode === "root"}
            onChange={() => selectPlacement("root")}
          />
          <span className="create-item-placement-text">
            <span className="create-item-placement-title">Úroveň {levelWithL(1)}</span>
            <span className="create-item-placement-hint">Samostatná položka najvyššej úrovne</span>
          </span>
        </label>
        <label
          className={`create-item-placement-option${placementMode === "lastCreated" ? " is-selected" : ""}${!lastCreatedAvailable ? " is-disabled" : ""}`}
        >
          <input
            type="radio"
            name="create-placement"
            checked={placementMode === "lastCreated"}
            disabled={!lastCreatedAvailable}
            onChange={() => selectPlacement("lastCreated")}
          />
          <span className="create-item-placement-text">
            <span className="create-item-placement-title">Pod poslednú vytvorenú položku</span>
            <span className="create-item-placement-hint">
              {lastCreatedAvailable
                ? (
                  <>
                    {levelWithL(lastCreatedItem!.level)} {TYPE_LABEL[lastCreatedItem!.kind] ?? lastCreatedItem!.kind} —{" "}
                    {getFullPath(lastCreatedItem!)}
                  </>
                )
                : "Zatiaľ žiadna vytvorená položka v tejto relácii"}
            </span>
          </span>
        </label>
        <label
          className={`create-item-placement-option${placementMode === "lastParent" ? " is-selected" : ""}${!lastParentAvailable ? " is-disabled" : ""}`}
        >
          <input
            type="radio"
            name="create-placement"
            checked={placementMode === "lastParent"}
            disabled={!lastParentAvailable}
            onChange={() => selectPlacement("lastParent")}
          />
          <span className="create-item-placement-text">
            <span className="create-item-placement-title">Pod poslednú nadradenú položku</span>
            <span className="create-item-placement-hint">
              {lastParentAvailable
                ? (
                  <>
                    {levelWithL(lastParentItem!.level)} {TYPE_LABEL[lastParentItem!.kind] ?? lastParentItem!.kind} —{" "}
                    {getFullPath(lastParentItem!)}
                  </>
                )
                : "Zatiaľ žiadny kontext nadradenej položky"}
            </span>
          </span>
        </label>
        <label className={`create-item-placement-option${placementMode === "existing" ? " is-selected" : ""}`}>
          <input
            type="radio"
            name="create-placement"
            checked={placementMode === "existing"}
            onChange={() => selectPlacement("existing")}
          />
          <span className="create-item-placement-text">
            <span className="create-item-placement-title">Pod existujúcu položku</span>
            <span className="create-item-placement-hint">Vyber konkrétneho rodiča zo zoznamu</span>
          </span>
        </label>
      </fieldset>
      <div className="create-item-form-body">
      {!isRoot && (
        <label className="form-label create-item-field-span">
          Nadradená položka
          <select
            value={parentId}
            onChange={(e) => {
              const next = e.target.value;
              setParentId(next);
              if (placementMode !== "existing") {
                setStoredPlacementMode("existing");
                setPlacementMode("existing");
              }
              recordParentFocus(next || null);
            }}
            required
          >
            <option value="">— vyber rodiča —</option>
            {eligibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {parentOptionLabel(p)}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="muted create-item-level">
        Úroveň: {typeof level === "number" && level > 0 ? levelWithLNumberStrong(level) : "—"}
      </p>
      <label className="form-label create-item-field-kind">
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
          <option value="">{level > 0 ? `— vyber typ pre L${level} —` : "— vyber typ —"}</option>
          {defaults.map((k) => (
            <option key={k} value={k}>
              {level > 0 ? `L${level} ${TYPE_LABEL[k] ?? k}` : TYPE_LABEL[k] ?? k}
            </option>
          ))}
          <option value="__custom__">{level > 0 ? `Vlastné pre L${level}…` : "Vlastné…"}</option>
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
      <div className="create-item-field-span create-item-name-block">
        {!customName ? (
          <>
            <AutoNamePreview
              kind={kindInput}
              parentId={isRoot ? null : parentId || null}
            />
            <button
              type="button"
              className="btn-ghost btn-small create-item-name-toggle"
              onClick={() => setCustomName(true)}
            >
              Prepísať názov…
            </button>
          </>
        ) : (
          <>
            <label className="form-label">
              Vlastný názov
              <input
                type="text"
                value={nameOverride}
                onChange={(e) => setNameOverride(e.target.value)}
                placeholder="Napíš vlastný názov..."
                autoFocus
              />
            </label>
            <button
              type="button"
              className="btn-ghost btn-small create-item-name-toggle"
              onClick={() => {
                setCustomName(false);
                setNameOverride("");
              }}
            >
              Použiť automatický názov
            </button>
          </>
        )}
      </div>
      <label className="form-label create-item-field-note">
        Poznámka
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="(voliteľné)"
        />
      </label>
      {formError && <div className="error create-item-field-span">{formError}</div>}
      <div className="create-item-actions create-item-field-span">
        <button type="submit" className="btn-primary btn-block" disabled={createMut.isPending}>
          {createMut.isPending ? "Ukladám…" : "Vytvoriť"}
        </button>
      </div>
      </div>
    </form>
  );
}

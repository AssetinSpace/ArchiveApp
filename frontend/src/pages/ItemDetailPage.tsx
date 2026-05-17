import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import {
  api,
  CHILD_TYPE_BY_PARENT,
  TYPE_LABEL,
  type Item,
  type Status,
} from "../api";
import { PhotoUpload } from "../components/PhotoUpload";
import { PhotoGallery } from "../components/PhotoGallery";

const STATUS_LABEL: Record<Status, string> = {
  NA_MIESTE: "Na mieste",
  VYNESENE: "Vynesené",
  NEZNAME: "Neznáme",
};

type DetailTab = "edit" | "qr" | "photos" | "children";

const DETAIL_TABS: DetailTab[] = ["edit", "qr", "photos", "children"];

function isDetailTab(value: string | null): value is DetailTab {
  return value !== null && DETAIL_TABS.includes(value as DetailTab);
}

export function ItemDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [fabOpen, setFabOpen] = useState(false);

  const tabParam = searchParams.get("tab");
  const activeTab: DetailTab = isDetailTab(tabParam) ? tabParam : "edit";

  function setActiveTab(next: DetailTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === "edit") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", next);
    }
    setSearchParams(nextParams, { replace: true });
  }

  const itemQ = useQuery({
    queryKey: ["items", "one", id],
    queryFn: () => api.getItem(id),
    enabled: !!id,
  });
  const pathQ = useQuery({
    queryKey: ["items", "path", id],
    queryFn: () => api.getItemPath(id),
    enabled: !!id,
  });
  const childrenQ = useQuery({
    queryKey: ["items", "children", id],
    queryFn: () => api.getChildren(id),
    enabled: !!id,
  });

  if (itemQ.isLoading) return <p className="muted">Načítavam…</p>;
  if (itemQ.error)
    return <p className="error">Chyba: {(itemQ.error as Error).message}</p>;
  if (!itemQ.data) return <p className="muted">Položka nenájdená.</p>;

  const item = itemQ.data;

  // Prefix-match invalidácia: jedna volanie pokryje všetky ["items", ...] queries
  // (one/path/children/all/root) v celej aplikácii. Vraciame Promise, aby ho
  // mohli mutácie awaitnúť — bez toho sa formulár stihne zavrieť skôr než refetch
  // dorazí a children list ostane vizuálne neaktuálny do ďalšieho triggeru.
  async function invalidateAll() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["items"] }),
      qc.invalidateQueries({ queryKey: ["qr"] }),
    ]);
  }

  return (
    <div className="stack">
      {/* Breadcrumb */}
      <nav className="breadcrumb scrollable-x" aria-label="Cesta">
        {(pathQ.data ?? []).map((node, idx, arr) => {
          const isLast = idx === arr.length - 1;
          return (
            <span key={node.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {isLast ? (
                <span style={{ fontWeight: 600 }}>{node.name ?? "(bez názvu)"}</span>
              ) : (
                <Link to={`/items/${node.id}`}>{node.name ?? "(bez názvu)"}</Link>
              )}
              {!isLast && <span className="breadcrumb-sep">›</span>}
            </span>
          );
        })}
      </nav>

      {/* Základné metadáta */}
      <section className="card item-detail-header">
        <h1 style={{ marginBottom: 8 }}>{item.name ?? "(bez názvu)"}</h1>
        <div className="row" style={{ marginBottom: item.note ? 0 : 12, flexWrap: "wrap" }}>
          <span className={`badge badge-${item.type_code.toLowerCase()}`}>
            {TYPE_LABEL[item.type_code] ?? item.type_code}
          </span>
          <span className={`badge badge-${item.status.toLowerCase()}`}>
            {STATUS_LABEL[item.status]}
          </span>
          {item.qr_code && (
            <span className="muted" style={{ fontSize: 13, fontFamily: "monospace" }}>
              {item.qr_code}
            </span>
          )}
        </div>
        {item.note && <p className="item-detail-note">{item.note}</p>}
        <dl className="info-list" style={{ margin: item.note ? "12px 0 0" : 0 }}>
          <InfoRow label="Vytvorené" value={new Date(item.created_at).toLocaleString("sk-SK")} />
          <InfoRow label="Upravené" value={new Date(item.updated_at).toLocaleString("sk-SK")} />
        </dl>
      </section>

      <nav className="item-detail-tabs" aria-label="Sekcie detailu">
        <button
          type="button"
          className={`item-detail-tab ${activeTab === "edit" ? "item-detail-tab-active" : ""}`}
          onClick={() => setActiveTab("edit")}
          aria-current={activeTab === "edit" ? "page" : undefined}
        >
          Upraviť
        </button>
        <button
          type="button"
          className={`item-detail-tab ${activeTab === "qr" ? "item-detail-tab-active" : ""}`}
          onClick={() => setActiveTab("qr")}
          aria-current={activeTab === "qr" ? "page" : undefined}
        >
          QR kód
        </button>
        <button
          type="button"
          className={`item-detail-tab ${activeTab === "photos" ? "item-detail-tab-active" : ""}`}
          onClick={() => setActiveTab("photos")}
          aria-current={activeTab === "photos" ? "page" : undefined}
        >
          Fotky
        </button>
        <button
          type="button"
          className={`item-detail-tab ${activeTab === "children" ? "item-detail-tab-active" : ""}`}
          onClick={() => setActiveTab("children")}
          aria-current={activeTab === "children" ? "page" : undefined}
        >
          Podradené
          {!childrenQ.isLoading && (
            <span style={{ marginLeft: 4, opacity: activeTab === "children" ? 0.9 : 0.7 }}>
              ({childrenQ.data?.length ?? 0})
            </span>
          )}
        </button>
      </nav>

      {activeTab === "edit" && (
        <section className="card item-detail-panel">
          <h2>Stav a poznámka</h2>
          <ItemEditor item={item} onSaved={invalidateAll} />
        </section>
      )}

      {activeTab === "qr" && (
        <section className="card item-detail-panel">
          <h2>QR kód</h2>
          <QRSection item={item} onAssigned={invalidateAll} />
        </section>
      )}

      {activeTab === "photos" && (
        <section className="card item-detail-panel">
          <h2>Fotky</h2>
          <PhotoUpload itemId={item.id} />
          <div style={{ marginTop: 12 }}>
            <PhotoGallery itemId={item.id} />
          </div>
        </section>
      )}

      {activeTab === "children" && (
        <section className="card item-detail-panel">
          <h2>Podradené položky ({childrenQ.data?.length ?? 0})</h2>
          {childrenQ.isLoading && <p className="muted">Načítavam…</p>}
          {childrenQ.data && childrenQ.data.length === 0 && (
            <p className="muted">Žiadne podradené položky</p>
          )}
          {childrenQ.data?.map((c) => (
            <Link key={c.id} to={`/items/${c.id}`} className="card-link">
              <div className="row" style={{ gap: 8 }}>
                <span className={`badge badge-${c.type_code.toLowerCase()}`}>
                  {TYPE_LABEL[c.type_code] ?? c.type_code}
                </span>
                <strong style={{ flexGrow: 1 }}>{c.name ?? "(bez názvu)"}</strong>
              </div>
              {c.note && (
                <p
                  className="muted"
                  style={{
                    margin: "6px 0 0",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {c.note}
                </p>
              )}
            </Link>
          ))}

          <AddChildForm parent={item} onAdded={invalidateAll} />
        </section>
      )}

      {/* FAB — skrátený prístup k "Pridať podradeú položku" */}
      {CHILD_TYPE_BY_PARENT[item.type_code] && createPortal(
        <button
          type="button"
          className="fab"
          onClick={() => setFabOpen(true)}
          aria-label="Pridať podradeú položku"
          title="Pridať podradeú položku"
        >
          +
        </button>,
        document.body,
      )}

      {fabOpen && CHILD_TYPE_BY_PARENT[item.type_code] && createPortal(
        <div
          className="create-modal-overlay"
          onClick={() => setFabOpen(false)}
        >
          <div
            className="create-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Pridať podradeú položku</h2>
              <button type="button" className="btn-ghost btn-small" onClick={() => setFabOpen(false)}>✕</button>
            </div>
            <AddChildFormContent
              parent={item}
              onAdded={async () => {
                await invalidateAll();
                setFabOpen(false);
              }}
              onCancel={() => setFabOpen(false)}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
        fontSize: 14,
      }}
    >
      <dt style={{ color: "#6b7280" }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>
        {value}
      </dd>
    </div>
  );
}

// ─── Item editor (status + note) ──────────────────────────────────────────────

function ItemEditor({
  item,
  onSaved,
}: {
  item: Item;
  onSaved: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState<Status>(item.status);
  const [note, setNote] = useState<string>(item.note ?? "");
  const [name, setName] = useState<string>(item.name ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(item.status);
    setNote(item.note ?? "");
    setName(item.name ?? "");
  }, [item.id, item.status, item.note, item.name]);

  const mut = useMutation({
    mutationFn: () =>
      api.updateItem(item.id, {
        status,
        note: note.trim() || null,
        name: name.trim() || null,
      }),
    onSuccess: async () => {
      setError(null);
      await onSaved();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <label className="form-label">
        Názov
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="(bez názvu)"
        />
      </label>
      <label className="form-label">
        Stav
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          {(Object.entries(STATUS_LABEL) as Array<[Status, string]>).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Poznámka
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="(voliteľné)"
        />
      </label>
      {error && <div className="error">{error}</div>}
      <button type="submit" className="btn-primary" disabled={mut.isPending}>
        {mut.isPending ? "Ukladám…" : "Uložiť"}
      </button>
    </form>
  );
}

// ─── QR section ───────────────────────────────────────────────────────────────

function QRSection({
  item,
  onAssigned,
}: {
  item: Item;
  onAssigned: () => Promise<void> | void;
}) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (item.qr_code) {
      QRCode.toDataURL(item.qr_code, { width: 200, margin: 1 })
        .then((url) => {
          if (!cancelled) setQrSrc(url);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    } else {
      setQrSrc(null);
    }
    return () => {
      cancelled = true;
    };
  }, [item.qr_code]);

  const assignMut = useMutation({
    mutationFn: (code: string) => api.qrAssign(code, item.id),
    onSuccess: async () => {
      setCodeInput("");
      setError(null);
      await onAssigned();
    },
    onError: (e: Error) => setError(e.message),
  });

  const unassignMut = useMutation({
    mutationFn: () =>
      item.qr_code ? api.qrUnassign(item.qr_code) : Promise.resolve(null as never),
    onSuccess: async () => {
      setError(null);
      await onAssigned();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (item.qr_code) {
    return (
      <div className="stack">
        {qrSrc && <img src={qrSrc} alt={item.qr_code} className="qr-preview" />}
        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 600 }}>
          {item.qr_code}
        </div>
        {error && <div className="error">{error}</div>}
        <button
          type="button"
          className="btn-danger btn-small"
          onClick={() => {
            if (confirm(`Naozaj uvoľniť QR kód ${item.qr_code}?`)) unassignMut.mutate();
          }}
          disabled={unassignMut.isPending}
        >
          {unassignMut.isPending ? "Uvoľňujem…" : "Uvoľniť QR"}
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Položka nemá pridelený QR kód.
      </p>

      {/* Primárna akcia: skenovanie */}
      <Link
        to={`/scan?assignTo=${item.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 48,
          padding: "0 16px",
          background: "var(--color-brand-green)",
          color: "#fff",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        ▣ Skenovať QR kód
      </Link>

      {/* Sekundárna akcia: manuálne zadanie (skryté) */}
      {!showManual ? (
        <button
          type="button"
          className="btn-ghost btn-small"
          onClick={() => setShowManual(true)}
          style={{ color: "#6b7280", fontSize: 13, minHeight: 44 }}
        >
          Zadať QR kód ručne…
        </button>
      ) : (
        <form
          className="form"
          style={{ paddingTop: 8, borderTop: "1px solid #e5e7eb" }}
          onSubmit={(e) => {
            e.preventDefault();
            const code = codeInput.trim();
            if (!code) return;
            assignMut.mutate(code);
          }}
        >
          <label className="form-label">
            Kód
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="napr. QR-000042"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <div className="row">
            <button type="submit" className="btn-primary" disabled={assignMut.isPending}
              style={{ flex: 1 }}>
              {assignMut.isPending ? "Priradzujem…" : "Priradiť QR kód"}
            </button>
            <button type="button" onClick={() => setShowManual(false)}>
              Zrušiť
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Add child form content (reusable in inline + FAB modal) ─────────────────

function AddChildFormContent({
  parent,
  onAdded,
  onCancel,
}: {
  parent: Item;
  onAdded: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const allowedChildType = CHILD_TYPE_BY_PARENT[parent.type_code];
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      api.createItem({
        type_code: allowedChildType ?? "",
        name: name.trim() || null,
        note: note.trim() || null,
        parent_id: parent.id,
      }),
    onSuccess: async () => {
      await onAdded();
      setName("");
      setNote("");
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!allowedChildType) {
    return (
      <p className="muted">Tento typ položky nemôže mať podradené položky.</p>
    );
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <p className="muted" style={{ margin: 0 }}>
        Typ:{" "}
        <strong>{TYPE_LABEL[allowedChildType] ?? allowedChildType}</strong>
      </p>
      <label className="form-label">
        Názov
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="napr. Krabica 3"
        />
      </label>
      <label className="form-label">
        Poznámka
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="(voliteľné)"
        />
      </label>
      {error && <div className="error">{error}</div>}
      <div className="row">
        <button type="submit" className="btn-primary" disabled={mut.isPending}
          style={{ flex: 1 }}>
          {mut.isPending ? "Pridávam…" : "Pridať"}
        </button>
        <button type="button" onClick={onCancel} disabled={mut.isPending}>
          Zrušiť
        </button>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Tip: Ak chceš podradeú položku zároveň označiť QR nálepkou, použi{" "}
        <Link to={`/scan?parentId=${parent.id}`}>Skenovať QR</Link> namiesto tohto
        formulára.
      </p>
    </form>
  );
}

// ─── Add child form (inline wrapper with open/close) ─────────────────────────

function AddChildForm({
  parent,
  onAdded,
}: {
  parent: Item;
  onAdded: () => Promise<void> | void;
}) {
  const allowedChildType = CHILD_TYPE_BY_PARENT[parent.type_code];
  const [open, setOpen] = useState(false);

  if (!allowedChildType) {
    return (
      <p className="muted" style={{ marginTop: 12 }}>
        Tento typ položky nemôže mať podradené položky.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="stack" style={{ marginTop: 12, gap: 8 }}>
        <button
          type="button"
          className="btn-primary btn-block"
          onClick={() => setOpen(true)}
          style={{ minHeight: 48 }}
        >
          + Pridať podradeú položku ({TYPE_LABEL[allowedChildType] ?? allowedChildType})
        </button>
        <Link
          to={`/scan?parentId=${parent.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            padding: "0 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            color: "#111827",
            textDecoration: "none",
            background: "#fff",
            fontWeight: 500,
          }}
          title="Naskenuj QR kód a vytvor podradeú položku s týmto rodičom"
        >
          ▣ Skenovať QR…
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
      <AddChildFormContent
        parent={parent}
        onAdded={async () => {
          await onAdded();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

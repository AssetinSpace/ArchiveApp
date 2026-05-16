import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import {
  api,
  CHILD_TYPE_BY_PARENT,
  TYPE_LABEL,
  type Item,
  type Status,
} from "../api";

const STATUS_LABEL: Record<Status, string> = {
  NA_MIESTE: "Na mieste",
  VYNESENE: "Vynesené",
  NEZNAME: "Neznáme",
};

export function ItemDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();

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

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["items", "one", id] });
    qc.invalidateQueries({ queryKey: ["items", "path", id] });
    qc.invalidateQueries({ queryKey: ["items", "children", id] });
    qc.invalidateQueries({ queryKey: ["items", "all"] });
    qc.invalidateQueries({ queryKey: ["items", "root"] });
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

      {/* Info card */}
      <section className="card">
        <h1 style={{ marginBottom: 8 }}>{item.name ?? "(bez názvu)"}</h1>
        <div className="row" style={{ marginBottom: 12 }}>
          <span className={`badge badge-${item.type_code.toLowerCase()}`}>
            {TYPE_LABEL[item.type_code] ?? item.type_code}
          </span>
          <span className={`badge badge-${item.status.toLowerCase()}`}>
            {STATUS_LABEL[item.status]}
          </span>
        </div>
        <dl className="info-list" style={{ margin: 0 }}>
          <InfoRow label="QR kód" value={item.qr_code ?? "—"} />
          <InfoRow label="Vytvorené" value={new Date(item.created_at).toLocaleString("sk-SK")} />
          <InfoRow label="Upravené" value={new Date(item.updated_at).toLocaleString("sk-SK")} />
        </dl>
      </section>

      {/* Status + note editor */}
      <section className="card">
        <h2>Stav a poznámka</h2>
        <ItemEditor item={item} onSaved={invalidateAll} />
      </section>

      {/* QR section */}
      <section className="card">
        <h2>QR kód</h2>
        <QRSection item={item} onAssigned={invalidateAll} />
      </section>

      {/* Children */}
      <section className="card">
        <h2>Deti ({childrenQ.data?.length ?? 0})</h2>
        {childrenQ.isLoading && <p className="muted">Načítavam…</p>}
        {childrenQ.data && childrenQ.data.length === 0 && (
          <p className="muted">Žiadne deti</p>
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

function ItemEditor({ item, onSaved }: { item: Item; onSaved: () => void }) {
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
    onSuccess: () => {
      setError(null);
      onSaved();
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

function QRSection({ item, onAssigned }: { item: Item; onAssigned: () => void }) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    onSuccess: () => {
      setCodeInput("");
      setError(null);
      onAssigned();
    },
    onError: (e: Error) => setError(e.message),
  });

  const unassignMut = useMutation({
    mutationFn: () =>
      item.qr_code ? api.qrUnassign(item.qr_code) : Promise.resolve(null as never),
    onSuccess: () => {
      setError(null);
      onAssigned();
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
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const code = codeInput.trim();
        if (!code) return;
        assignMut.mutate(code);
      }}
    >
      <p className="muted" style={{ margin: 0 }}>
        Položka nemá pridelený QR kód.
      </p>
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
      <button type="submit" className="btn-primary" disabled={assignMut.isPending}>
        {assignMut.isPending ? "Priradzujem…" : "Priradiť QR kód"}
      </button>
    </form>
  );
}

// ─── Add child form ───────────────────────────────────────────────────────────

function AddChildForm({ parent, onAdded }: { parent: Item; onAdded: () => void }) {
  const allowedChildType = CHILD_TYPE_BY_PARENT[parent.type_code];
  const [open, setOpen] = useState(false);
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
    onSuccess: () => {
      setName("");
      setNote("");
      setOpen(false);
      setError(null);
      onAdded();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!allowedChildType) {
    return (
      <p className="muted" style={{ marginTop: 12 }}>
        Tento typ položky nemôže mať deti.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-primary"
        style={{ marginTop: 12 }}
        onClick={() => setOpen(true)}
      >
        + Pridať dieťa ({TYPE_LABEL[allowedChildType] ?? allowedChildType})
      </button>
    );
  }

  return (
    <form
      className="form"
      style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <p className="muted" style={{ margin: 0 }}>
        Pridať nový typ:{" "}
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
        <button type="submit" className="btn-primary" disabled={mut.isPending}>
          {mut.isPending ? "Pridávam…" : "Pridať"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={mut.isPending}>
          Zrušiť
        </button>
      </div>
    </form>
  );
}

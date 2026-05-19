import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import QRCode from "qrcode";
import {
  api,
  KIND_DEFAULTS,
  KNOWN_METADATA_KEYS,
  TYPE_LABEL,
  type Item,
  type ItemMetadata,
  type NameSource,
  type PhotoType,
  type Status,
} from "../api";
import { metadataFieldLabel } from "../lib/metadataDraft";
import { AutoNamePreview } from "../components/AutoNamePreview";
import { PhotoUpload } from "../components/PhotoUpload";
import { PhotoGallery } from "../components/PhotoGallery";

const STATUS_LABEL: Record<Status, string> = {
  NA_MIESTE: "Na mieste",
  VYNESENE: "Vynesené",
  NEZNAME: "Neznáme",
};

const NAME_SOURCE_LABEL: Record<NameSource, string> = {
  GENERATED: "auto",
  OCR: "z OCR",
  MANUAL: "ručne",
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
  const showMetadataReviewNotice = item.metadata_status === "EXTRACTED";
  const showOcrNameBanner =
    !!item.ocr_name_suggestion &&
    item.name_source === "GENERATED" &&
    [2, 3].includes(item.level);
  const showMetadataReadonly =
    item.metadata_status === "REVIEWED" &&
    !!item.metadata &&
    Object.values(item.metadata).some((v) => typeof v === "string" && v.trim() !== "");

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

      {showMetadataReviewNotice && <MetadataReviewLinkNotice />}

      {showOcrNameBanner && (
        <OcrNameBanner item={item} onDone={invalidateAll} />
      )}

      {/* Základné metadáta */}
      <section className="card item-detail-header">
        <h1 style={{ marginBottom: 8 }}>{item.name}</h1>
        <div className="row" style={{ marginBottom: item.note ? 0 : 12, flexWrap: "wrap" }}>
          <span className={`badge badge-${item.kind.toLowerCase()}`}>
            L{item.level} {TYPE_LABEL[item.kind] ?? item.kind}
          </span>
          <span className={`badge badge-name-source-${item.name_source.toLowerCase()}`}>
            {NAME_SOURCE_LABEL[item.name_source]}
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
        {showMetadataReadonly && item.metadata && (
          <ReadonlyMetadataList metadata={item.metadata} />
        )}
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
          <ItemDeleteSection
            item={item}
            childCount={item._count?.children ?? childrenQ.data?.length ?? 0}
            onDeleted={invalidateAll}
          />
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
                <span className={`badge badge-${c.kind.toLowerCase()}`}>
                  L{c.level} {TYPE_LABEL[c.kind] ?? c.kind}
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
      {item.level < 7 && createPortal(
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

      {fabOpen && item.level < 7 && createPortal(
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
            <AddChildPanel
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

// ─── Delete item (soft) ───────────────────────────────────────────────────────

function ItemDeleteSection({
  item,
  childCount,
  onDeleted,
}: {
  item: Item;
  childCount: number;
  onDeleted: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const descendantsQ = useQuery({
    queryKey: ["items", item.id, "descendants", "count"],
    queryFn: () => api.countItemDescendants(item.id),
    enabled: childCount > 0,
  });
  const descendantCount = descendantsQ.data?.count ?? 0;

  const deleteMut = useMutation({
    mutationFn: (cascade: boolean) => api.deleteItem(item.id, { cascade }),
    onSuccess: async () => {
      setError(null);
      await onDeleted();
      navigate(item.parent_id ? `/items/${item.parent_id}` : "/");
    },
    onError: (e: Error) => setError(e.message),
  });

  const displayName = item.name ?? "(bez názvu)";
  const typeLabel = TYPE_LABEL[item.kind] ?? item.kind;

  function confirmDelete(cascade: boolean): void {
    const msg = cascade
      ? `Naozaj zmazať „${displayName}" (L${item.level} ${typeLabel}) a všetkých ${descendantCount} podradených položiek (vrátane vnorených)?`
      : `Naozaj zmazať položku „${displayName}" (L${item.level} ${typeLabel})?`;
    if (confirm(msg)) {
      deleteMut.mutate(cascade);
    }
  }

  return (
    <div className="item-delete-section">
      <h3 className="item-delete-heading">Zmazať položku</h3>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        {childCount > 0 ? (
          <>
            Položka má{" "}
            <strong>{childCount}</strong>{" "}
            {childCount === 1
              ? "priamu podradenú položku"
              : childCount < 5
                ? "priame podradené položky"
                : "priamych podradených položiek"}
            {descendantsQ.isSuccess && descendantCount > childCount && (
              <>
                {" "}
                (celkom <strong>{descendantCount}</strong>{" "}
                {descendantCount === 1
                  ? "potomok"
                  : descendantCount < 5
                    ? "potomkovia"
                    : "potomkov"}
                {" "}
                vrátane vnorených)
              </>
            )}
            . Môžete zmazať celú vetvu naraz.
          </>
        ) : (
          <>Položka pôjde do koša (soft delete). Fotky v R2 a priradený QR kód zostanú v systéme.</>
        )}
      </p>
      {error && <p className="error">{error}</p>}
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {childCount === 0 && (
          <button
            type="button"
            className="btn-danger"
            disabled={deleteMut.isPending}
            onClick={() => confirmDelete(false)}
          >
            {deleteMut.isPending ? "Mažem…" : "Zmazať položku"}
          </button>
        )}
        {childCount > 0 && (
          <button
            type="button"
            className="btn-danger"
            disabled={deleteMut.isPending || descendantsQ.isLoading}
            onClick={() => confirmDelete(true)}
          >
            {deleteMut.isPending
              ? "Mažem…"
              : descendantsQ.isLoading
                ? "Počítam podradené…"
                : `Zmazať vrátane podradených (${descendantCount})`}
          </button>
        )}
      </div>
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
    mutationFn: async () => {
      const trimmedName = name.trim();
      const trimmedNote = note.trim() || null;
      const nameChanged = trimmedName !== (item.name ?? "").trim();
      if (nameChanged) {
        if (!trimmedName) {
          throw new Error("Názov nemôže byť prázdny");
        }
        await api.updateItemName(item.id, trimmedName);
      }
      await api.updateItem(item.id, {
        status,
        note: trimmedNote,
      });
    },
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

// ─── Add child: výber metódy (QR / foto / ručný formulár) ─────────────────────

const PHOTO_COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024;
const PHOTO_COMPRESS_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
};

function photoTypeForNewChildLevel(level: number): PhotoType {
  return level >= 5 ? "LABEL" : "OVERVIEW";
}

function AddChildPanel({
  parent,
  onAdded,
  onCancel,
}: {
  parent: Item;
  onAdded: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const [view, setView] = useState<"chooser" | "manual">("chooser");

  if (parent.level >= 7) {
    return (
      <p className="muted">Tento typ položky nemôže mať podradené položky.</p>
    );
  }

  if (view === "manual") {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <button
          type="button"
          className="btn-ghost btn-small"
          onClick={() => setView("chooser")}
          style={{ alignSelf: "flex-start" }}
        >
          ← Späť na výber
        </button>
        <AddChildFormContent parent={parent} onAdded={onAdded} onCancel={onCancel} />
      </div>
    );
  }

  return (
    <AddChildMethodChooser
      parent={parent}
      onAdded={onAdded}
      onCancel={onCancel}
      onManual={() => setView("manual")}
    />
  );
}

function AddChildMethodChooser({
  parent,
  onAdded,
  onCancel,
  onManual,
}: {
  parent: Item;
  onAdded: () => Promise<void> | void;
  onCancel: () => void;
  onManual: () => void;
}) {
  const childLevel = parent.level + 1;
  const defaultKind = KIND_DEFAULTS[childLevel]?.[0] ?? "";
  const photoType = photoTypeForNewChildLevel(childLevel);
  const isLabelPhoto = photoType === "LABEL";
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const photoMut = useMutation({
    mutationFn: async (file: File) => {
      if (!defaultKind) throw new Error("Neznáma úroveň položky");
      let payload: File = file;
      if (file.size > PHOTO_COMPRESS_THRESHOLD_BYTES) {
        setBusyLabel("Komprimujem fotku…");
        const compressed = await imageCompression(file, PHOTO_COMPRESS_OPTIONS);
        payload =
          compressed instanceof File
            ? compressed
            : new File([compressed], file.name, { type: file.type });
      }
      setBusyLabel("Vytváram položku…");
      const item = await api.createItem({
        level: childLevel,
        kind: defaultKind,
        parent_id: parent.id,
      });
      setBusyLabel("Nahrávam fotku…");
      await api.uploadPhoto(item.id, payload, photoType);
      return item;
    },
    onSuccess: async (item) => {
      setError(null);
      setBusyLabel(null);
      await onAdded();
      navigate(`/items/${item.id}?tab=photos`);
    },
    onError: (e: Error) => {
      setError(e.message);
      setBusyLabel(null);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    },
  });

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    photoMut.mutate(file);
  }

  const busy = photoMut.isPending;

  return (
    <div className="stack add-child-actions" style={{ gap: 10 }}>
      <p className="muted" style={{ margin: 0 }}>
        Úroveň <strong>{childLevel}</strong>
        {defaultKind && (
          <>
            {" "}
            · predvolený typ{" "}
            <strong>{TYPE_LABEL[defaultKind] ?? defaultKind}</strong>
          </>
        )}
      </p>

      <Link
        to={`/scan?parentId=${parent.id}`}
        className="add-child-action add-child-action-primary"
        onClick={onCancel}
      >
        <span className="add-child-action-icon" aria-hidden="true">
          ▣
        </span>
        <span className="add-child-action-text">
          <span className="add-child-action-title">Skenovať QR kód</span>
          <span className="add-child-action-hint">
            Vytvor položku a priraď nálepku
          </span>
        </span>
      </Link>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChosen}
        disabled={busy}
        style={{ display: "none" }}
        id={`add-child-camera-${parent.id}`}
      />
      <label
        htmlFor={`add-child-camera-${parent.id}`}
        className={`add-child-action ${busy ? "is-disabled" : ""}`}
        aria-disabled={busy}
      >
        <span className="add-child-action-icon" aria-hidden="true">
          📷
        </span>
        <span className="add-child-action-text">
          <span className="add-child-action-title">
            {busy ? (busyLabel ?? "Pracujem…") : isLabelPhoto ? "Odfotiť štítok" : "Odfotiť položku"}
          </span>
          <span className="add-child-action-hint">
            {isLabelPhoto ? "Vytvorí položku a nahraje štítok (OCR)" : "Vytvorí položku a nahraje fotku"}
          </span>
        </span>
      </label>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChosen}
        disabled={busy}
        style={{ display: "none" }}
        id={`add-child-gallery-${parent.id}`}
      />
      <label
        htmlFor={`add-child-gallery-${parent.id}`}
        className={`add-child-action ${busy ? "is-disabled" : ""}`}
        aria-disabled={busy}
      >
        <span className="add-child-action-icon" aria-hidden="true">
          🖼️
        </span>
        <span className="add-child-action-text">
          <span className="add-child-action-title">
            {busy ? (busyLabel ?? "Pracujem…") : "Fotka z galérie"}
          </span>
          <span className="add-child-action-hint">Vyber existujúcu fotku v telefóne</span>
        </span>
      </label>

      {error && <div className="error">{error}</div>}

      <button
        type="button"
        className="btn-ghost btn-small"
        onClick={onManual}
        disabled={busy}
        style={{ marginTop: 4 }}
      >
        Vyplniť údaje ručne…
      </button>
      <button type="button" onClick={onCancel} disabled={busy}>
        Zrušiť
      </button>
    </div>
  );
}

// ─── Add child form content (ručný formulár) ─────────────────────────────────

function AddChildFormContent({
  parent,
  onAdded,
  onCancel,
}: {
  parent: Item;
  onAdded: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const childLevel = parent.level + 1;
  const defaults = KIND_DEFAULTS[childLevel] ?? [];
  const [kindInput, setKindInput] = useState(defaults[0] ?? "");
  const [customKind, setCustomKind] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const kind = kindInput.trim();
      if (!kind) throw new Error("Vyber alebo napíš typ položky");
      return api.createItem({
        level: childLevel,
        kind,
        name: name.trim() || null,
        note: note.trim() || null,
        parent_id: parent.id,
      });
    },
    onSuccess: async () => {
      await onAdded();
      setName("");
      setNote("");
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (parent.level >= 7) {
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
        Úroveň: <strong>{childLevel}</strong>
      </p>
      <label className="form-label">
        Typ položky
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
      <AutoNamePreview kind={kindInput} parentId={parent.id} manualName={name} />
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
  const [open, setOpen] = useState(false);

  if (parent.level >= 7) {
    return (
      <p className="muted" style={{ marginTop: 12 }}>
        Tento typ položky nemôže mať podradené položky.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-primary btn-block"
        onClick={() => setOpen(true)}
        style={{ minHeight: 48, marginTop: 12 }}
      >
        + Pridať podradenú položku (L{parent.level + 1})
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
      <AddChildPanel
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
function MetadataReviewLinkNotice() {
  return (
    <section className="card" aria-label="Metadata čakajú na review">
      <p style={{ margin: 0, fontSize: 14 }}>
        AI navrhol metadata — potvrdenie a úprava sú v{" "}
        <Link to="/admin/ocr?tab=review">Spracovanie → Review</Link>.
      </p>
    </section>
  );
}

// ─── OCR name suggestion banner (Sprint 8) ─────────────────────────────────

function OcrNameBanner({
  item,
  onDone,
}: {
  item: Item;
  onDone: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.ocr_name_suggestion ?? "");

  const confirmMut = useMutation({
    mutationFn: (name?: string) => api.confirmOcrName(item.id, name),
    onSuccess: async () => {
      setEditing(false);
      await onDone();
    },
  });
  const dismissMut = useMutation({
    mutationFn: () => api.dismissOcrName(item.id),
    onSuccess: async () => {
      await onDone();
    },
  });

  const pending = confirmMut.isPending || dismissMut.isPending;
  const error = confirmMut.error ?? dismissMut.error;

  return (
    <section className="item-ocr-banner" aria-label="OCR návrh názvu">
      <span className="item-ocr-banner-label">OCR navrhuje názov</span>
      {!editing ? (
        <>
          <span className="item-ocr-banner-title">{item.ocr_name_suggestion}</span>
          <div className="item-ocr-banner-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={pending}
              onClick={() => confirmMut.mutate(undefined)}
            >
              {confirmMut.isPending ? "Ukladám…" : "Použiť"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setEditValue(item.ocr_name_suggestion ?? "");
                setEditing(true);
              }}
            >
              Upraviť a použiť
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => dismissMut.mutate()}
            >
              Ignorovať
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            maxLength={100}
            disabled={pending}
            style={{ width: "100%", minHeight: 44 }}
          />
          <div className="item-ocr-banner-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={pending || !editValue.trim()}
              onClick={() => confirmMut.mutate(editValue.trim())}
            >
              {confirmMut.isPending ? "Ukladám…" : "Potvrdiť"}
            </button>
            <button type="button" disabled={pending} onClick={() => setEditing(false)}>
              Zrušiť
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="error" style={{ margin: "8px 0 0" }}>
          {(error as Error).message}
        </p>
      )}
    </section>
  );
}

// Read-only zobrazenie metadát keď je status REVIEWED — preskočí prázdne polia,
// neznáme kľúče zobrazí kurzívou aby boli vizuálne odlíšené od 7 fixných polí.
function ReadonlyMetadataList({ metadata }: { metadata: ItemMetadata }) {
  const knownSet = new Set<string>(KNOWN_METADATA_KEYS);
  const knownEntries = KNOWN_METADATA_KEYS.map((k) => [k, metadata[k]] as const).filter(
    ([, v]) => typeof v === "string" && v.trim() !== "",
  );
  const unknownEntries = Object.entries(metadata).filter(
    ([k, v]) => !knownSet.has(k) && typeof v === "string" && v.trim() !== "",
  );
  if (knownEntries.length === 0 && unknownEntries.length === 0) return null;

  return (
    <dl className="metadata-readonly-list">
      {knownEntries.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{metadataFieldLabel(k)}</dt>
          <dd>{v}</dd>
        </div>
      ))}
      {unknownEntries.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{metadataFieldLabel(k)}</dt>
          <dd>
            <em>{String(v)}</em>
          </dd>
        </div>
      ))}
    </dl>
  );
}


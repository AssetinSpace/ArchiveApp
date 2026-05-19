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
  METADATA_LABELS,
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
  VYNESENE: "VynesenĂ©",
  NEZNAME: "NeznĂˇme",
};

const NAME_SOURCE_LABEL: Record<NameSource, string> = {
  GENERATED: "auto",
  OCR: "z OCR",
  MANUAL: "ruÄŤne",
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

  if (itemQ.isLoading) return <p className="muted">NaÄŤĂ­tavamâ€¦</p>;
  if (itemQ.error)
    return <p className="error">Chyba: {(itemQ.error as Error).message}</p>;
  if (!itemQ.data) return <p className="muted">PoloĹľka nenĂˇjdenĂˇ.</p>;

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

  // Prefix-match invalidĂˇcia: jedna volanie pokryje vĹˇetky ["items", ...] queries
  // (one/path/children/all/root) v celej aplikĂˇcii. Vraciame Promise, aby ho
  // mohli mutĂˇcie awaitnĂşĹĄ â€” bez toho sa formulĂˇr stihne zavrieĹĄ skĂ´r neĹľ refetch
  // dorazĂ­ a children list ostane vizuĂˇlne neaktuĂˇlny do ÄŹalĹˇieho triggeru.
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
                <span style={{ fontWeight: 600 }}>{node.name ?? "(bez nĂˇzvu)"}</span>
              ) : (
                <Link to={`/items/${node.id}`}>{node.name ?? "(bez nĂˇzvu)"}</Link>
              )}
              {!isLast && <span className="breadcrumb-sep">â€ş</span>}
            </span>
          );
        })}
      </nav>

      {showMetadataReviewNotice && <MetadataReviewLinkNotice />}

      {showOcrNameBanner && (
        <OcrNameBanner item={item} onDone={invalidateAll} />
      )}

      {/* ZĂˇkladnĂ© metadĂˇta */}
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
          <InfoRow label="VytvorenĂ©" value={new Date(item.created_at).toLocaleString("sk-SK")} />
          <InfoRow label="UpravenĂ©" value={new Date(item.updated_at).toLocaleString("sk-SK")} />
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
          UpraviĹĄ
        </button>
        <button
          type="button"
          className={`item-detail-tab ${activeTab === "qr" ? "item-detail-tab-active" : ""}`}
          onClick={() => setActiveTab("qr")}
          aria-current={activeTab === "qr" ? "page" : undefined}
        >
          QR kĂłd
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
          PodradenĂ©
          {!childrenQ.isLoading && (
            <span style={{ marginLeft: 4, opacity: activeTab === "children" ? 0.9 : 0.7 }}>
              ({childrenQ.data?.length ?? 0})
            </span>
          )}
        </button>
      </nav>

      {activeTab === "edit" && (
        <section className="card item-detail-panel">
          <h2>Stav a poznĂˇmka</h2>
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
          <h2>QR kĂłd</h2>
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
          <h2>PodradenĂ© poloĹľky ({childrenQ.data?.length ?? 0})</h2>
          {childrenQ.isLoading && <p className="muted">NaÄŤĂ­tavamâ€¦</p>}
          {childrenQ.data && childrenQ.data.length === 0 && (
            <p className="muted">Ĺ˝iadne podradenĂ© poloĹľky</p>
          )}
          {childrenQ.data?.map((c) => (
            <Link key={c.id} to={`/items/${c.id}`} className="card-link">
              <div className="row" style={{ gap: 8 }}>
                <span className={`badge badge-${c.kind.toLowerCase()}`}>
                  L{c.level} {TYPE_LABEL[c.kind] ?? c.kind}
                </span>
                <strong style={{ flexGrow: 1 }}>{c.name ?? "(bez nĂˇzvu)"}</strong>
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

      {/* FAB â€” skrĂˇtenĂ˝ prĂ­stup k "PridaĹĄ podradeĂş poloĹľku" */}
      {item.level < 7 && createPortal(
        <button
          type="button"
          className="fab"
          onClick={() => setFabOpen(true)}
          aria-label="PridaĹĄ podradeĂş poloĹľku"
          title="PridaĹĄ podradeĂş poloĹľku"
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
              <h2 style={{ margin: 0 }}>PridaĹĄ podradeĂş poloĹľku</h2>
              <button type="button" className="btn-ghost btn-small" onClick={() => setFabOpen(false)}>âś•</button>
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

// â”€â”€â”€ Info row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Delete item (soft) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  const displayName = item.name ?? "(bez nĂˇzvu)";
  const typeLabel = TYPE_LABEL[item.kind] ?? item.kind;

  function confirmDelete(cascade: boolean): void {
    const msg = cascade
      ? `Naozaj zmazaĹĄ â€ž${displayName}" (L${item.level} ${typeLabel}) a vĹˇetkĂ˝ch ${descendantCount} podradenĂ˝ch poloĹľiek (vrĂˇtane vnorenĂ˝ch)?`
      : `Naozaj zmazaĹĄ poloĹľku â€ž${displayName}" (L${item.level} ${typeLabel})?`;
    if (confirm(msg)) {
      deleteMut.mutate(cascade);
    }
  }

  return (
    <div className="item-delete-section">
      <h3 className="item-delete-heading">ZmazaĹĄ poloĹľku</h3>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        {childCount > 0 ? (
          <>
            PoloĹľka mĂˇ{" "}
            <strong>{childCount}</strong>{" "}
            {childCount === 1
              ? "priamu podradenĂş poloĹľku"
              : childCount < 5
                ? "priame podradenĂ© poloĹľky"
                : "priamych podradenĂ˝ch poloĹľiek"}
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
                vrĂˇtane vnorenĂ˝ch)
              </>
            )}
            . MĂ´Ĺľete zmazaĹĄ celĂş vetvu naraz.
          </>
        ) : (
          <>PoloĹľka pĂ´jde do koĹˇa (soft delete). Fotky v R2 a priradenĂ˝ QR kĂłd zostanĂş v systĂ©me.</>
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
            {deleteMut.isPending ? "MaĹľemâ€¦" : "ZmazaĹĄ poloĹľku"}
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
              ? "MaĹľemâ€¦"
              : descendantsQ.isLoading
                ? "PoÄŤĂ­tam podradenĂ©â€¦"
                : `ZmazaĹĄ vrĂˇtane podradenĂ˝ch (${descendantCount})`}
          </button>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Item editor (status + note) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          throw new Error("NĂˇzov nemĂ´Ĺľe byĹĄ prĂˇzdny");
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
        NĂˇzov
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="(bez nĂˇzvu)"
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
        PoznĂˇmka
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="(voliteÄľnĂ©)"
        />
      </label>
      {error && <div className="error">{error}</div>}
      <button type="submit" className="btn-primary" disabled={mut.isPending}>
        {mut.isPending ? "UkladĂˇmâ€¦" : "UloĹľiĹĄ"}
      </button>
    </form>
  );
}

// â”€â”€â”€ QR section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            if (confirm(`Naozaj uvoÄľniĹĄ QR kĂłd ${item.qr_code}?`)) unassignMut.mutate();
          }}
          disabled={unassignMut.isPending}
        >
          {unassignMut.isPending ? "UvoÄľĹujemâ€¦" : "UvoÄľniĹĄ QR"}
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        PoloĹľka nemĂˇ pridelenĂ˝ QR kĂłd.
      </p>

      {/* PrimĂˇrna akcia: skenovanie */}
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
        â–Ł SkenovaĹĄ QR kĂłd
      </Link>

      {/* SekundĂˇrna akcia: manuĂˇlne zadanie (skrytĂ©) */}
      {!showManual ? (
        <button
          type="button"
          className="btn-ghost btn-small"
          onClick={() => setShowManual(true)}
          style={{ color: "#6b7280", fontSize: 13, minHeight: 44 }}
        >
          ZadaĹĄ QR kĂłd ruÄŤneâ€¦
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
            KĂłd
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
              {assignMut.isPending ? "Priradzujemâ€¦" : "PriradiĹĄ QR kĂłd"}
            </button>
            <button type="button" onClick={() => setShowManual(false)}>
              ZruĹˇiĹĄ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// â”€â”€â”€ Add child: vĂ˝ber metĂłdy (QR / foto / ruÄŤnĂ˝ formulĂˇr) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      <p className="muted">Tento typ poloĹľky nemĂ´Ĺľe maĹĄ podradenĂ© poloĹľky.</p>
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
          â† SpĂ¤ĹĄ na vĂ˝ber
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
      if (!defaultKind) throw new Error("NeznĂˇma ĂşroveĹ poloĹľky");
      let payload: File = file;
      if (file.size > PHOTO_COMPRESS_THRESHOLD_BYTES) {
        setBusyLabel("Komprimujem fotkuâ€¦");
        const compressed = await imageCompression(file, PHOTO_COMPRESS_OPTIONS);
        payload =
          compressed instanceof File
            ? compressed
            : new File([compressed], file.name, { type: file.type });
      }
      setBusyLabel("VytvĂˇram poloĹľkuâ€¦");
      const item = await api.createItem({
        level: childLevel,
        kind: defaultKind,
        parent_id: parent.id,
      });
      setBusyLabel("NahrĂˇvam fotkuâ€¦");
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
        ĂšroveĹ <strong>{childLevel}</strong>
        {defaultKind && (
          <>
            {" "}
            Â· predvolenĂ˝ typ{" "}
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
          â–Ł
        </span>
        <span className="add-child-action-text">
          <span className="add-child-action-title">SkenovaĹĄ QR kĂłd</span>
          <span className="add-child-action-hint">
            Vytvor poloĹľku a priraÄŹ nĂˇlepku
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
          đź“·
        </span>
        <span className="add-child-action-text">
          <span className="add-child-action-title">
            {busy ? (busyLabel ?? "Pracujemâ€¦") : isLabelPhoto ? "OdfotiĹĄ ĹˇtĂ­tok" : "OdfotiĹĄ poloĹľku"}
          </span>
          <span className="add-child-action-hint">
            {isLabelPhoto ? "VytvorĂ­ poloĹľku a nahraje ĹˇtĂ­tok (OCR)" : "VytvorĂ­ poloĹľku a nahraje fotku"}
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
          đź–Ľď¸Ź
        </span>
        <span className="add-child-action-text">
          <span className="add-child-action-title">
            {busy ? (busyLabel ?? "Pracujemâ€¦") : "Fotka z galĂ©rie"}
          </span>
          <span className="add-child-action-hint">Vyber existujĂşcu fotku v telefĂłne</span>
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
        VyplniĹĄ Ăşdaje ruÄŤneâ€¦
      </button>
      <button type="button" onClick={onCancel} disabled={busy}>
        ZruĹˇiĹĄ
      </button>
    </div>
  );
}

// â”€â”€â”€ Add child form content (ruÄŤnĂ˝ formulĂˇr) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      if (!kind) throw new Error("Vyber alebo napĂ­Ĺˇ typ poloĹľky");
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
      <p className="muted">Tento typ poloĹľky nemĂ´Ĺľe maĹĄ podradenĂ© poloĹľky.</p>
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
        ĂšroveĹ: <strong>{childLevel}</strong>
      </p>
      <label className="form-label">
        Typ poloĹľky
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
          <option value="__custom__">VlastnĂ©â€¦</option>
        </select>
      </label>
      {customKind && (
        <label className="form-label">
          VlastnĂ˝ typ
          <input
            type="text"
            placeholder="NapĂ­Ĺˇ vlastnĂ˝ typ..."
            value={kindInput}
            onChange={(e) => setKindInput(e.target.value)}
            autoFocus
          />
        </label>
      )}
      <label className="form-label">
        NĂˇzov
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="(voliteÄľnĂ© â€” inak sa vygeneruje automaticky)"
        />
      </label>
      <AutoNamePreview kind={kindInput} parentId={parent.id} manualName={name} />
      <label className="form-label">
        PoznĂˇmka
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="(voliteÄľnĂ©)"
        />
      </label>
      {error && <div className="error">{error}</div>}
      <div className="row">
        <button type="submit" className="btn-primary" disabled={mut.isPending}
          style={{ flex: 1 }}>
          {mut.isPending ? "PridĂˇvamâ€¦" : "PridaĹĄ"}
        </button>
        <button type="button" onClick={onCancel} disabled={mut.isPending}>
          ZruĹˇiĹĄ
        </button>
      </div>
    </form>
  );
}

// â”€â”€â”€ Add child form (inline wrapper with open/close) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        Tento typ poloĹľky nemĂ´Ĺľe maĹĄ podradenĂ© poloĹľky.
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
        + PridaĹĄ podradenĂş poloĹľku (L{parent.level + 1})
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
    <section className="card" aria-label="Metadata ÄŤakajĂş na review">
      <p style={{ margin: 0, fontSize: 14 }}>
        AI navrhol metadata â€” potvrdenie a Ăşprava sĂş v{" "}
        <Link to="/admin/ocr?tab=review">Spracovanie â†’ Review</Link>.
      </p>
    </section>
  );
}

// â”€â”€â”€ OCR name suggestion banner (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    <section className="item-ocr-banner" aria-label="OCR nĂˇvrh nĂˇzvu">
      <span className="item-ocr-banner-label">OCR navrhuje nĂˇzov</span>
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
              {confirmMut.isPending ? "UkladĂˇmâ€¦" : "PouĹľiĹĄ"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setEditValue(item.ocr_name_suggestion ?? "");
                setEditing(true);
              }}
            >
              UpraviĹĄ a pouĹľiĹĄ
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => dismissMut.mutate()}
            >
              IgnorovaĹĄ
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
              {confirmMut.isPending ? "UkladĂˇmâ€¦" : "PotvrdiĹĄ"}
            </button>
            <button type="button" disabled={pending} onClick={() => setEditing(false)}>
              ZruĹˇiĹĄ
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

// Read-only zobrazenie metadĂˇt keÄŹ je status REVIEWED â€” preskoÄŤĂ­ prĂˇzdne polia,
// neznĂˇme kÄľĂşÄŤe zobrazĂ­ kurzĂ­vou aby boli vizuĂˇlne odlĂ­ĹˇenĂ© od 7 fixnĂ˝ch polĂ­.
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
          <dt>{METADATA_LABELS[k]}</dt>
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


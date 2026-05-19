import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  TYPE_LABEL,
  type ItemMetadata,
  type LlmMetadataStatusResponse,
  type PendingMetadataReviewItem,
} from "../api";
import {
  metadataEditKeys,
  metadataFieldLabel,
  normalizeMetadataDraft,
  serializeMetadataDraft,
} from "../lib/metadataDraft";

// LlmMetadataAdminPage — metadata-only AI extraction
//
// Štruktúra:
// stat cards, batch tlačidlo, polling 3s počas processing, review queue
// s offset paging-om. Review karta zobrazuje dynamický počet polí z LLM návrhu;
// pri confirm posielame celý objekt (zachovaj prípadné
// úpravy konzultanta) — backend je tolerantný aj na neznáme kľúče.

const STATUS_KEY = ["llm-metadata", "status"] as const;
const PENDING_KEY = ["llm-metadata", "pending"] as const;
const PAGE_SIZE = 20;

export function LlmMetadataAdminPage() {
  const qc = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedBanner, setCompletedBanner] = useState<{
    processed: number;
    extracted: number;
    failed: number;
  } | null>(null);
  const [offset, setOffset] = useState(0);

  const statusQ = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => api.fetchLlmMetadataStatus(),
    refetchInterval: isProcessing ? 3000 : false,
    refetchOnMount: true,
  });

  const pendingQ = useQuery({
    queryKey: [...PENDING_KEY, offset],
    queryFn: () => api.fetchPendingMetadataReview(PAGE_SIZE, offset),
    placeholderData: (prev) => prev,
  });

  const startMut = useMutation({
    mutationFn: () => api.processLlmMetadata(),
    onMutate: () => {
      setCompletedBanner(null);
      setIsProcessing(true);
    },
    onSettled: (data) => {
      setIsProcessing(false);
      if (data) {
        const extracted = data.results.filter(
          (r) =>
            !r.error &&
            r.metadata &&
            Object.values(r.metadata).some(
              (v) => typeof v === "string" && v.trim() !== "",
            ),
        ).length;
        const failed = data.results.filter((r) => r.error).length;
        setCompletedBanner({
          processed: data.processed,
          extracted,
          failed,
        });
      }
      qc.invalidateQueries({ queryKey: STATUS_KEY });
      qc.invalidateQueries({ queryKey: PENDING_KEY });
    },
  });

  const status: LlmMetadataStatusResponse = statusQ.data ?? {
    total: 0,
    none: 0,
    eligible: 0,
    extracted: 0,
    reviewed: 0,
    noApiKey: false,
  };

  const noApiKey = status.noApiKey;
  const startDisabled =
    noApiKey || status.eligible === 0 || isProcessing || startMut.isPending;

  return (
    <div className="stack">
      <h1>AI Metadata — JSONB extraction</h1>

      <p className="muted" style={{ marginTop: -4 }}>
        LLM (Gemini 2.5 Flash) z OCR textu navrhne relevantné polia (hybrid JSONB).
        Konzultant každý návrh review-uje, môže upraviť hodnoty alebo zamietnuť.
      </p>

      {statusQ.isLoading && <p className="muted">Načítavam štatistiky…</p>}
      {statusQ.error && (
        <p className="error">Chyba: {(statusQ.error as Error).message}</p>
      )}

      <section className="ocr-stats-grid" aria-label="LLM Metadata štatistiky">
        <StatCard variant="pending" label="Eligible" value={status.eligible} />
        <StatCard variant="pending" label="Extracted" value={status.extracted} />
        <StatCard variant="done" label="Reviewed" value={status.reviewed} />
        <StatCard variant="total" label="Total items" value={status.total} />
        <StatCard
          variant={noApiKey ? "failed" : "done"}
          label="API Key"
          value={noApiKey ? "✗" : "✓"}
        />
      </section>

      {noApiKey && <ApiKeyHelpBanner />}

      <section className="card">
        <h2>Batch extraction</h2>

        {completedBanner && (
          <div className="ocr-banner-success" style={{ marginBottom: 12 }}>
            ✓ Hotovo — spracovaných {completedBanner.processed}{" "}
            {plural(completedBanner.processed, "položka", "položky", "položiek")}
            {", "}
            {completedBanner.extracted}{" "}
            {plural(
              completedBanner.extracted,
              "návrh",
              "návrhy",
              "návrhov",
            )}
            {completedBanner.failed > 0 && (
              <>
                {", "}
                <span style={{ color: "#b91c1c", fontWeight: 600 }}>
                  {completedBanner.failed}{" "}
                  {plural(completedBanner.failed, "chyba", "chyby", "chýb")}
                </span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn-primary ocr-process-btn"
          disabled={startDisabled}
          onClick={() => startMut.mutate()}
        >
          {isProcessing
            ? "Spracovávam… (Gemini 2.5 Flash)"
            : startMut.isPending
              ? "Spúšťam…"
              : noApiKey
                ? "Chýba GEMINI_API_KEY"
                : status.eligible === 0
                  ? "Žiadne položky na spracovanie"
                  : `Spustiť metadata extraction (${status.eligible})`}
        </button>

        {startMut.error && (
          <p className="error" style={{ marginTop: 8 }}>
            Chyba: {(startMut.error as Error).message}
          </p>
        )}

        {isProcessing && (
          <p className="muted" style={{ marginTop: 8 }}>
            Sériové volania Gemini 2.5 Flash, 500 ms pauza medzi nimi. Trvanie
            závisí od počtu položiek (~3 s per kus). Štatistiky sa občerstvia
            každé 3 s.
          </p>
        )}
      </section>

      <section className="card">
        <h2>
          Review fronta
          {pendingQ.data && (
            <span style={{ marginLeft: 8, fontSize: 14, color: "#6b7280" }}>
              ({pendingQ.data.total} čakajúcich)
            </span>
          )}
        </h2>

        {pendingQ.isLoading && <p className="muted">Načítavam…</p>}
        {pendingQ.error && (
          <p className="error">Chyba: {(pendingQ.error as Error).message}</p>
        )}

        {pendingQ.data && pendingQ.data.items.length === 0 && (
          <p className="muted">
            {status.extracted === 0
              ? "Žiadne návrhy na review. Spusti metadata extraction vyššie."
              : "Žiadne ďalšie návrhy na tejto stránke."}
          </p>
        )}

        <div className="llm-review-list">
          {pendingQ.data?.items.map((item) => (
            <MetadataReviewCard key={item.id} item={item} />
          ))}
        </div>

        {pendingQ.data && pendingQ.data.total > offset + PAGE_SIZE && (
          <button
            type="button"
            className="btn-block"
            style={{ marginTop: 12, minHeight: 48 }}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={pendingQ.isFetching}
          >
            {pendingQ.isFetching ? "Načítavam…" : "Načítať ďalšie"}
          </button>
        )}
        {offset > 0 && (
          <button
            type="button"
            className="btn-ghost btn-small"
            style={{ marginTop: 8 }}
            onClick={() => setOffset(0)}
          >
            Späť na začiatok
          </button>
        )}
      </section>
    </div>
  );
}

function StatCard({
  variant,
  label,
  value,
}: {
  variant: "pending" | "done" | "failed" | "total";
  label: string;
  value: number | string;
}) {
  return (
    <div className={`ocr-stat-card ocr-stat-${variant}`}>
      <div className="ocr-stat-number">{value}</div>
      <div className="ocr-stat-label">{label}</div>
    </div>
  );
}

function ApiKeyHelpBanner() {
  return (
    <section
      className="card"
      style={{
        background: "#fffbeb",
        borderColor: "#fde68a",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#92400e" }}>
        ⚠️ Chýba GEMINI_API_KEY
      </h2>
      <p className="muted" style={{ marginTop: 0 }}>
        LLM metadata extraction vyžaduje Google Gemini API key (zdieľaný so
        Sprint 5 LLM Titles).
      </p>
      <ol style={{ paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}>
        <li>
          Choď na{" "}
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            aistudio.google.com
          </a>{" "}
          → API Keys → Create API key
        </li>
        <li>
          Skopíruj key (začína na <code>AIzaSy...</code>)
        </li>
        <li>
          V Railway dashboarde → tvoj backend service → Variables → pridaj{" "}
          <code>GEMINI_API_KEY</code>
        </li>
        <li>Railway automaticky redeployuje</li>
        <li>
          V Google Cloud Console → Billing → Budgets &amp; alerts → nastav alert
          na <strong>$5</strong>
        </li>
      </ol>
    </section>
  );
}

// ─── Review card ─────────────────────────────────────────────────────────────

function MetadataReviewCard({ item }: { item: PendingMetadataReviewItem }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ItemMetadata>(() =>
    normalizeMetadataDraft(item.metadata),
  );
  const cardRef = useRef<HTMLDivElement>(null);

  // Ak sa item zmení (refetch po confirm/reject), reinit draft.
  useEffect(() => {
    setDraft(normalizeMetadataDraft(item.metadata));
  }, [item.id, item.metadata]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["llm-metadata", "status"] });
    qc.invalidateQueries({ queryKey: ["llm-metadata", "pending"] });
    qc.invalidateQueries({ queryKey: ["items"] });
  }

  const confirmMut = useMutation({
    mutationFn: (metadata?: ItemMetadata) => api.confirmLlmMetadata(item.id, metadata),
    onSuccess: invalidate,
  });
  const rejectMut = useMutation({
    mutationFn: () => api.rejectLlmMetadata(item.id),
    onSuccess: invalidate,
  });
  const editMut = useMutation({
    mutationFn: (metadata: ItemMetadata) => api.editLlmMetadata(item.id, metadata),
    onSuccess: invalidate,
  });

  const isPending = confirmMut.isPending || rejectMut.isPending || editMut.isPending;

  const isDirty = useMemo(() => {
    const orig = normalizeMetadataDraft(item.metadata);
    const keys = new Set([...Object.keys(orig), ...Object.keys(draft)]);
    for (const k of keys) {
      if ((orig[k] ?? "") !== (draft[k] ?? "")) return true;
    }
    return false;
  }, [draft, item.metadata]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isPending) return;
    const target = e.target as HTMLElement;
    // Esc kdekoľvek v karte → reject; Enter mimo inputu → confirm.
    if (e.key === "Escape") {
      e.preventDefault();
      rejectMut.mutate();
    } else if (e.key === "Enter" && target.tagName !== "INPUT") {
      e.preventDefault();
      confirmMut.mutate(serializeMetadataDraft(draft));
    }
  }

  const breadcrumb =
    item.path.length > 0
      ? item.path
          .slice(0, -1)
          .map((n) => n.name ?? n.type_code)
          .join(" › ")
      : "";

  const error = confirmMut.error ?? rejectMut.error ?? editMut.error ?? null;

  return (
    <div
      ref={cardRef}
      className="llm-review-card"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Review metadata pre položku ${item.name ?? item.id}`}
    >
      {item.photo && (
        <Link to={`/items/${item.id}`} className="llm-review-thumb-link">
          <img
            src={item.photo.signedUrl}
            alt=""
            className="llm-review-thumb"
            loading="lazy"
          />
        </Link>
      )}
      <div className="llm-review-body">
        {breadcrumb && (
          <div className="llm-review-breadcrumb">{breadcrumb}</div>
        )}
        <div className="llm-review-header-row">
          <span className={`badge badge-${item.typeCode.toLowerCase()}`}>
            {TYPE_LABEL[item.typeCode] ?? item.typeCode}
          </span>
          <Link
            to={`/items/${item.id}`}
            className="llm-review-name"
            title="Otvoriť detail položky"
          >
            {item.name ?? "(bez názvu)"}
          </Link>
        </div>
        {item.autoName && item.name !== item.autoName && (
          <div className="llm-review-autoname">
            Pôvodné ID: <code>{item.autoName}</code>
          </div>
        )}
        {item.ocrTextPreview && (
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.4 }}>
            OCR vstup do LLM: <em>{item.ocrTextPreview}</em>
            {item.ocrTextPreview.length >= 280 ? "…" : ""}
          </p>
        )}
        <div className="llm-review-suggestion">
          <div className="llm-review-suggestion-label">Návrh AI:</div>
          <div className="metadata-fields-grid">
            {metadataEditKeys(draft).map((key) => (
              <label key={key} className="metadata-field">
                <span className="metadata-field-label">
                  {metadataFieldLabel(key)}
                </span>
                <input
                  type="text"
                  value={draft[key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [key]: e.target.value }))
                  }
                  placeholder="—"
                  maxLength={500}
                  disabled={isPending}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="llm-review-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => confirmMut.mutate(serializeMetadataDraft(draft))}
            disabled={isPending}
          >
            {confirmMut.isPending
              ? "Potvrdzujem…"
              : isDirty
                ? "✓ Uložiť a potvrdiť"
                : "✓ Potvrdiť"}
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={() => editMut.mutate(serializeMetadataDraft(draft))}
              disabled={isPending}
              title="Uložiť úpravy bez potvrdenia (status ostane EXTRACTED)"
            >
              {editMut.isPending ? "Ukladám…" : "💾 Uložiť úpravy"}
            </button>
          )}
          <button
            type="button"
            className="btn-danger"
            onClick={() => rejectMut.mutate()}
            disabled={isPending}
          >
            {rejectMut.isPending ? "Zamietam…" : "✗ Zamietnuť"}
          </button>
        </div>

        {error && (
          <p className="error" style={{ marginTop: 8, marginBottom: 0 }}>
            Chyba: {(error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

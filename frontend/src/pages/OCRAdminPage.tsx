import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  TYPE_LABEL,
  type FailedPhoto,
  type ItemMetadata,
  type LlmMetadataStatusResponse,
  type OcrDiagnoseReport,
  type OcrStatusCounts,
  type PendingMetadataReviewItem,
  type RecentOcrPhoto,
} from "../api";
import {
  metadataEditKeys,
  metadataFieldLabel,
  normalizeMetadataDraft,
  serializeMetadataDraft,
} from "../lib/metadataDraft";

// SpracovaniePage — tab layout (Sprint 8)
//
// Tab "Fotky": pending fotky + spracovanie + zlyhané + naposledy spracované
// Tab "Review (N)": metadata na review (EXTRACTED → REVIEWED)
// Stats: 4 čísla navrchu viditeľné vždy
//
// Jeden batch call (Gemini Vision) uloží OCR text aj metadata naraz.
// Review návrhov je na záložke Review.

type ProcessingTab = "photos" | "review";

function isProcessingTab(value: string | null): value is ProcessingTab {
  return value === "photos" || value === "review";
}

const OCR_STATUS_KEY = ["ocr-status"] as const;
const FAILED_KEY = ["ocr-failed"] as const;
const RECENT_KEY = ["ocr-recent"] as const;
const LLM_STATUS_KEY = ["llm-metadata", "status"] as const;
const PENDING_KEY = ["llm-metadata", "pending"] as const;
const PAGE_SIZE = 20;
const RETRY_FEEDBACK_MS = 12_000;

type RetryRowFeedback =
  | { type: "failed-again"; at: number; detail?: string }
  | { type: "error"; at: number; message: string };

export function OCRAdminPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ProcessingTab>(() =>
    isProcessingTab(tabParam) ? tabParam : "photos",
  );

  useEffect(() => {
    if (isProcessingTab(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  function selectTab(next: ProcessingTab) {
    setActiveTab(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next === "photos") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", next);
    }
    setSearchParams(nextParams, { replace: true });
  }

  // ── Foto processing state ──────────────────────────────────────────────────
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const queuedRef = useRef<number>(0);
  const previousPendingRef = useRef<number>(0);
  const [ocrCompletedBanner, setOcrCompletedBanner] = useState<number | null>(null);
  const [reviewOffset, setReviewOffset] = useState(0);
  /** Čas posledného Retry — na zoradenie zlyhaných navrch. */
  const [retryBump, setRetryBump] = useState<Record<string, number>>({});
  const [retryFeedback, setRetryFeedback] = useState<Record<string, RetryRowFeedback>>({});
  const [retrySuccessMsg, setRetrySuccessMsg] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const ocrStatusQ = useQuery({
    queryKey: OCR_STATUS_KEY,
    queryFn: () => api.fetchOcrStatus(),
    refetchInterval: isOcrProcessing ? 3000 : false,
    refetchOnMount: true,
  });

  const failedQ = useQuery({
    queryKey: FAILED_KEY,
    queryFn: () => api.fetchFailedPhotos(),
    enabled: (ocrStatusQ.data?.failed ?? 0) > 0,
  });

  const recentQ = useQuery({
    queryKey: RECENT_KEY,
    queryFn: () => api.fetchRecentOcrPhotos(20),
  });

  const llmStatusQ = useQuery({
    queryKey: LLM_STATUS_KEY,
    queryFn: () => api.fetchLlmMetadataStatus(),
    refetchOnMount: true,
  });

  const pendingReviewQ = useQuery({
    queryKey: [...PENDING_KEY, reviewOffset],
    queryFn: () => api.fetchPendingMetadataReview(PAGE_SIZE, reviewOffset),
    placeholderData: (prev) => prev,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const ocrStartMut = useMutation({
    mutationFn: () => api.processOcrPending(),
    onSuccess: (data) => {
      queuedRef.current = data.queuedCount;
      previousPendingRef.current = ocrStatusQ.data?.pending ?? data.queuedCount;
      setOcrCompletedBanner(null);
      setIsOcrProcessing(true);
    },
  });

  const retryMut = useMutation({
    mutationFn: (photoId: string) => api.retryOcr(photoId),
    onSuccess: (result, photoId) => {
      const now = Date.now();
      setRetryBump((prev) => ({ ...prev, [photoId]: now }));

      if (result.ocr_status === "FAILED") {
        setRetryFeedback((prev) => ({
          ...prev,
          [photoId]: {
            type: "failed-again",
            at: now,
            detail: result.ocr_last_error ?? undefined,
          },
        }));
        setRetrySuccessMsg(null);
      } else if (result.ocr_status === "DONE") {
        setRetryFeedback((prev) => {
          const next = { ...prev };
          delete next[photoId];
          return next;
        });
        const name =
          failedQ.data?.find((p) => p.id === photoId)?.item_name ??
          result.item_id;
        setRetrySuccessMsg(`„${name}“ úspešne spracované`);
      }

      qc.invalidateQueries({ queryKey: OCR_STATUS_KEY });
      qc.invalidateQueries({ queryKey: FAILED_KEY });
      qc.invalidateQueries({ queryKey: RECENT_KEY });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (err, photoId) => {
      const now = Date.now();
      setRetryBump((prev) => ({ ...prev, [photoId]: now }));
      setRetryFeedback((prev) => ({
        ...prev,
        [photoId]: {
          type: "error",
          at: now,
          message: err instanceof Error ? err.message : "Retry zlyhal",
        },
      }));
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - RETRY_FEEDBACK_MS;
      setRetryFeedback((prev) => {
        let changed = false;
        const next: Record<string, RetryRowFeedback> = {};
        for (const [id, fb] of Object.entries(prev)) {
          if (fb.at >= cutoff) {
            next[id] = fb;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!retrySuccessMsg) return;
    const timer = window.setTimeout(() => setRetrySuccessMsg(null), 6000);
    return () => window.clearTimeout(timer);
  }, [retrySuccessMsg]);

  // ── Detect OCR batch completion ────────────────────────────────────────────
  useEffect(() => {
    if (!ocrStatusQ.data) return;
    const current = ocrStatusQ.data.pending;
    if (isOcrProcessing && current === 0) {
      setIsOcrProcessing(false);
      setOcrCompletedBanner(queuedRef.current);
      qc.invalidateQueries({ queryKey: FAILED_KEY });
      qc.invalidateQueries({ queryKey: RECENT_KEY });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: LLM_STATUS_KEY });
      qc.invalidateQueries({ queryKey: PENDING_KEY });
    }
    previousPendingRef.current = current;
  }, [ocrStatusQ.data, isOcrProcessing, qc]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const ocrStatus: OcrStatusCounts = ocrStatusQ.data ?? {
    pending: 0,
    done: 0,
    failed: 0,
    total: 0,
  };
  const llmStatus: LlmMetadataStatusResponse = llmStatusQ.data ?? {
    total: 0,
    none: 0,
    eligible: 0,
    extracted: 0,
    reviewed: 0,
    noApiKey: false,
  };

  const engine = ocrStatus.engine ?? "gemini";
  const engineLabel = engine === "gemini" ? "Gemini Vision" : "Tesseract";

  const pendingPhotos = recentQ.data?.filter((p) => p.ocr_status === "PENDING") ?? [];
  const donePhotos = recentQ.data?.filter((p) => p.ocr_status === "DONE") ?? [];
  const reviewCount = pendingReviewQ.data?.total ?? llmStatus.extracted;

  const sortedFailed = useMemo(() => {
    const list = failedQ.data ?? [];
    return [...list].sort((a, b) => {
      const bumpA = retryBump[a.id] ?? 0;
      const bumpB = retryBump[b.id] ?? 0;
      if (bumpB !== bumpA) return bumpB - bumpA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [failedQ.data, retryBump]);

  return (
    <div className="stack">
      {/* Header */}
      <div className="row" style={{ alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Spracovanie</h1>
        <span
          className="badge badge-na_mieste"
          title="OCR_ENGINE na serveri"
          style={{ fontSize: 13 }}
        >
          Engine: {engineLabel}
        </span>
      </div>

      {/* Stats — 4 čísla vždy viditeľné */}
      <section className="ocr-stats-grid" aria-label="Prehľad spracovania">
        <StatCard variant="pending" label="Čakajú" value={ocrStatus.pending} />
        <StatCard variant="done" label="Spracované" value={ocrStatus.done} />
        <StatCard variant="failed" label="Zlyhané" value={ocrStatus.failed} />
        <StatCard
          variant="done"
          label="Potvrdené"
          value={
            llmStatus.total > 0
              ? `${llmStatus.reviewed} / ${llmStatus.total}`
              : llmStatus.reviewed
          }
        />
      </section>

      {/* Tabs */}
      <nav className="item-detail-tabs" aria-label="Sekcie spracovania">
        <button
          type="button"
          className={`item-detail-tab${activeTab === "photos" ? " item-detail-tab-active" : ""}`}
          onClick={() => selectTab("photos")}
          aria-current={activeTab === "photos" ? "page" : undefined}
        >
          Fotky
          {ocrStatus.pending > 0 && (
            <span style={{ marginLeft: 6, opacity: activeTab === "photos" ? 0.9 : 0.6 }}>
              ({ocrStatus.pending})
            </span>
          )}
        </button>
        <button
          type="button"
          className={`item-detail-tab${activeTab === "review" ? " item-detail-tab-active" : ""}`}
          onClick={() => selectTab("review")}
          aria-current={activeTab === "review" ? "page" : undefined}
        >
          Review
          {reviewCount > 0 && (
            <span style={{ marginLeft: 6, opacity: activeTab === "review" ? 0.9 : 0.6 }}>
              ({reviewCount})
            </span>
          )}
        </button>
      </nav>

      {/* ── TAB: Fotky ────────────────────────────────────────────────────── */}
      {activeTab === "photos" && (
        <section className="card item-detail-panel">
          {ocrCompletedBanner !== null && ocrCompletedBanner > 0 && (
            <div className="ocr-banner-success" style={{ marginBottom: 12 }}>
              ✓ Hotovo — spracovaných {ocrCompletedBanner}{" "}
              {plural(ocrCompletedBanner, "fotka", "fotky", "fotiek")}
            </div>
          )}

          <button
            type="button"
            className="btn-primary ocr-process-btn"
            disabled={ocrStatus.pending === 0 || isOcrProcessing || ocrStartMut.isPending}
            onClick={() => ocrStartMut.mutate()}
          >
            {isOcrProcessing
              ? "Spracovávam…"
              : ocrStartMut.isPending
                ? "Spúšťam…"
                : ocrStatus.pending === 0
                  ? "Žiadne fotky na spracovanie"
                  : `Spracuj (${ocrStatus.pending})`}
          </button>

          {ocrStartMut.error && (
            <p className="error" style={{ marginTop: 8 }}>
              Chyba: {(ocrStartMut.error as Error).message}
            </p>
          )}
          {isOcrProcessing && (
            <p className="muted" style={{ marginTop: 8 }}>
              Spracovanie beží na pozadí. Štatistiky sa aktualizujú každé 3 sekundy.
            </p>
          )}


          {/* Zlyhané */}
          {ocrStatus.failed > 0 && (
            <>
              <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#b91c1c" }}>
                Zlyhané fotky ({ocrStatus.failed})
              </h3>
              {retrySuccessMsg && (
                <div className="ocr-retry-success-banner" role="status">
                  ✓ {retrySuccessMsg}
                </div>
              )}
              {failedQ.isLoading && <p className="muted">Načítavam…</p>}
              {sortedFailed.map((p) => (
                <FailedRow
                  key={p.id}
                  photo={p}
                  retrying={retryMut.isPending && retryMut.variables === p.id}
                  onRetry={() => retryMut.mutate(p.id)}
                  bumped={Boolean(retryBump[p.id])}
                  lastRetryAt={retryBump[p.id]}
                  feedback={retryFeedback[p.id] ?? null}
                  onDiagnosed={() => {
                    qc.invalidateQueries({ queryKey: FAILED_KEY });
                  }}
                />
              ))}
              {failedQ.data && failedQ.data.length >= 100 && (
                <p className="muted" style={{ marginTop: 8 }}>Zobrazených prvých 100 záznamov.</p>
              )}
            </>
          )}

          {/* Čakajúce fotky */}
          {pendingPhotos.length > 0 && (
            <>
              <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#6b7280" }}>
                Čakajúce fotky
              </h3>
              {recentQ.isLoading && <p className="muted">Načítavam…</p>}
              {pendingPhotos.map((p) => (
                <RecentRow key={p.id} photo={p} />
              ))}
            </>
          )}

          {/* Naposledy spracované */}
          {donePhotos.length > 0 && (
            <>
              <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#6b7280" }}>
                Naposledy spracované
              </h3>
              {donePhotos.map((p) => (
                <RecentRow key={p.id} photo={p} />
              ))}
            </>
          )}

          {recentQ.data?.length === 0 && ocrStatus.pending === 0 && ocrStatus.failed === 0 && (
            <p className="muted" style={{ marginTop: 12 }}>Žiadne fotky.</p>
          )}
        </section>
      )}

      {/* ── TAB: Review ───────────────────────────────────────────────────── */}
      {activeTab === "review" && (
        <section className="card item-detail-panel">
          {pendingReviewQ.isLoading && <p className="muted">Načítavam…</p>}
          {pendingReviewQ.error && (
            <p className="error">Chyba: {(pendingReviewQ.error as Error).message}</p>
          )}

          {pendingReviewQ.data && pendingReviewQ.data.items.length === 0 && (
            <p className="muted">
              {llmStatus.extracted === 0
                ? "Žiadne návrhy na review — spracuj fotky na záložke Fotky."
                : "Žiadne ďalšie návrhy na tejto stránke."}
            </p>
          )}

          <div className="llm-review-list">
            {pendingReviewQ.data?.items.map((item) => (
              <MetadataReviewCard key={item.id} item={item} />
            ))}
          </div>

          {pendingReviewQ.data &&
            pendingReviewQ.data.total > reviewOffset + PAGE_SIZE && (
              <button
                type="button"
                className="btn-block ocr-admin-load-more"
                style={{ marginTop: 12, minHeight: 48 }}
                onClick={() => setReviewOffset(reviewOffset + PAGE_SIZE)}
                disabled={pendingReviewQ.isFetching}
              >
                {pendingReviewQ.isFetching ? "Načítavam…" : "Načítať ďalšie"}
              </button>
            )}
          {reviewOffset > 0 && (
            <button
              type="button"
              className="btn-ghost btn-small"
              style={{ marginTop: 8 }}
              onClick={() => setReviewOffset(0)}
            >
              Späť na začiatok
            </button>
          )}

          {llmStatus.reviewed > 0 && (
            <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
              Potvrdených: {llmStatus.reviewed} z {llmStatus.total} položiek
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

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

// ─── FailedRow ────────────────────────────────────────────────────────────────

function FailedRow({
  photo,
  retrying,
  onRetry,
  bumped,
  lastRetryAt,
  feedback,
  onDiagnosed,
}: {
  photo: FailedPhoto;
  retrying: boolean;
  onRetry: () => void;
  bumped: boolean;
  lastRetryAt?: number;
  feedback: RetryRowFeedback | null;
  onDiagnosed: () => void;
}) {
  const [diagnoseReport, setDiagnoseReport] = useState<OcrDiagnoseReport | null>(null);

  const diagnoseMut = useMutation({
    mutationFn: () => api.diagnoseOcr(photo.id),
    onSuccess: (report) => {
      setDiagnoseReport(report);
      onDiagnosed();
    },
  });

  const storedError = photo.ocr_last_error?.trim() || null;
  const liveError =
    feedback?.type === "failed-again" ? feedback.detail?.trim() || null : null;
  const displayError = liveError ?? storedError;

  const feedbackMessage =
    feedback?.type === "failed-again" && !displayError
      ? "Zlyhalo znova — spustite Diagnostiku pre detail"
      : feedback?.type === "error"
        ? `Retry chyba: ${feedback.message}`
        : null;

  return (
    <div className={`ocr-failed-row${bumped ? " ocr-failed-row--bumped" : ""}`}>
      <img src={photo.signed_url} alt="" className="ocr-failed-thumb" loading="lazy" />
      <div className="ocr-failed-meta">
        <Link to={`/items/${photo.item_id}`} className="ocr-failed-name">
          {photo.item_name ?? "(bez názvu)"}
        </Link>
        <span className="ocr-failed-date">
          Nahraté: {new Date(photo.created_at).toLocaleString("sk-SK")}
        </span>
        {lastRetryAt != null && (
          <span className="ocr-failed-retry-at">
            Posledný pokus: {new Date(lastRetryAt).toLocaleString("sk-SK")}
          </span>
        )}
        {displayError && (
          <span className="ocr-failed-retry-msg" role="alert">
            Dôvod: {displayError}
          </span>
        )}
        {feedbackMessage && (
          <span className="ocr-failed-retry-msg" role="alert">
            {feedbackMessage}
          </span>
        )}
        {diagnoseReport && (
          <div className="ocr-diagnose-detail">
            <strong>Diagnostika:</strong> {diagnoseReport.conclusion}
            <ul className="ocr-diagnose-steps">
              {diagnoseReport.steps.map((s) => (
                <li key={s.name} className={s.ok ? "ocr-diagnose-ok" : "ocr-diagnose-fail"}>
                  {s.ok ? "✓" : "✗"} {s.name}
                  {s.detail ? ` — ${s.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {diagnoseMut.error && (
          <span className="ocr-failed-retry-msg" role="alert">
            Diagnostika: {(diagnoseMut.error as Error).message}
          </span>
        )}
      </div>
      <div className="ocr-failed-actions">
        <button
          type="button"
          className="btn-small"
          onClick={onRetry}
          disabled={retrying || diagnoseMut.isPending}
          style={{ minHeight: 44 }}
        >
          {retrying ? "Spracovávam…" : "Retry"}
        </button>
        <button
          type="button"
          className="btn-small btn-ghost"
          onClick={() => diagnoseMut.mutate()}
          disabled={retrying || diagnoseMut.isPending}
          style={{ minHeight: 44 }}
        >
          {diagnoseMut.isPending ? "Testujem…" : "Diagnostika"}
        </button>
      </div>
    </div>
  );
}

// ─── RecentRow ────────────────────────────────────────────────────────────────

function RecentRow({ photo }: { photo: RecentOcrPhoto }) {
  const kind = photo.item_kind ?? photo.item_type_code ?? "";
  const typeLabel =
    photo.item_level != null
      ? `L${photo.item_level} ${TYPE_LABEL[kind] ?? kind}`
      : TYPE_LABEL[kind] ?? kind;

  const statusBadge = (() => {
    if (photo.ocr_status === "PENDING")
      return <span className="photo-badge-pending">PENDING</span>;
    if (photo.ocr_status === "FAILED")
      return <span className="photo-badge-failed">FAILED</span>;
    if (
      photo.ocr_status === "DONE" &&
      (!photo.ocr_text_preview || photo.ocr_text_preview.trim().length === 0)
    ) {
      return <span className="photo-badge-done-empty">DONE (bez textu)</span>;
    }
    return (
      <span className="badge badge-na_miesto" style={{ background: "#dcfce7", color: "#166534" }}>
        DONE
      </span>
    );
  })();

  return (
    <Link to={`/items/${photo.item_id}`} className="ocr-recent-row">
      <img src={photo.signed_url} alt="" className="ocr-recent-thumb" loading="lazy" />
      <div className="ocr-recent-meta">
        <div className="ocr-recent-name-row">
          <span className={`badge badge-${kind.toLowerCase()}`}>{typeLabel}</span>
          {statusBadge}
          <span className="ocr-recent-name">{photo.item_name ?? "(bez názvu)"}</span>
        </div>
        {photo.ocr_status === "DONE" && photo.ocr_text_preview && (
          <div className="ocr-recent-preview">{photo.ocr_text_preview}</div>
        )}
        {photo.ocr_status === "PENDING" && (
          <div className="muted" style={{ fontSize: 12 }}>Čaká na spracovanie…</div>
        )}
        {photo.ocr_status === "FAILED" && (
          <div className="muted" style={{ fontSize: 12 }}>
            Zlyhalo — retry v sekcii Zlyhané fotky alebo v galérii.
          </div>
        )}
      </div>
      <div className="ocr-recent-arrow" aria-hidden="true">›</div>
    </Link>
  );
}

// ─── MetadataReviewCard ───────────────────────────────────────────────────────

function MetadataReviewCard({ item }: { item: PendingMetadataReviewItem }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ItemMetadata>(() =>
    normalizeMetadataDraft(item.metadata),
  );
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(normalizeMetadataDraft(item.metadata));
  }, [item.id, item.metadata]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: LLM_STATUS_KEY });
    qc.invalidateQueries({ queryKey: PENDING_KEY });
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
          .map((n) => n.name ?? n.kind)
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
          <span className={`badge badge-${item.kind.toLowerCase()}`}>
            L{item.level} {TYPE_LABEL[item.kind] ?? item.kind}
          </span>
          <Link
            to={`/items/${item.id}`}
            className="llm-review-name"
            title="Otvoriť detail položky"
          >
            {item.name ?? "(bez názvu)"}
          </Link>
        </div>
        {item.ocrTextPreview && (
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.4 }}>
            OCR text: <em>{item.ocrTextPreview}</em>
            {item.ocrTextPreview.length >= 280 ? "…" : ""}
          </p>
        )}
        <div className="llm-review-suggestion">
          <div className="llm-review-suggestion-label">Návrh AI:</div>
          <div className="metadata-fields-grid">
            {metadataEditKeys(draft).map((key) => (
              <label key={key} className="metadata-field">
                <span className="metadata-field-label">{metadataFieldLabel(key)}</span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

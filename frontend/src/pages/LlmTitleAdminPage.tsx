import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  TYPE_LABEL,
  type LlmTitleStatusResponse,
  type PendingReviewItem,
} from "../api";

// LlmTitleAdminPage — Sprint 5 (patched: Gemini 2.5 Flash)
//
// Funkcionalita:
// - 6 stat cards (Eligible / Suggested / Confirmed / Rejected / Total / API Key)
// - Tlačidlo "Spustiť LLM extraction" → POST /api/llm-title/process
// - Polling /status každé 3s počas spracovania (synchronné fetch ostane pending,
//   ale paralelný status query občerství eligible/suggested ako sa Gemini
//   postupne dokončuje)
// - Review queue — kartičky pre SUGGESTED items s confirm / edit / reject
// - Offset pagination (20/page, "Načítať ďalšie")
// - Ak chýba GEMINI_API_KEY → banner s návodom

const STATUS_KEY = ["llm-title", "status"] as const;
const PENDING_KEY = ["llm-title", "pending"] as const;
const PAGE_SIZE = 20;

export function LlmTitleAdminPage() {
  const qc = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedBanner, setCompletedBanner] = useState<{
    processed: number;
    suggested: number;
    failed: number;
  } | null>(null);
  const [offset, setOffset] = useState(0);

  const statusQ = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => api.fetchLlmTitleStatus(),
    refetchInterval: isProcessing ? 3000 : false,
    refetchOnMount: true,
  });

  const pendingQ = useQuery({
    queryKey: [...PENDING_KEY, offset],
    queryFn: () => api.fetchPendingReview(PAGE_SIZE, offset),
    placeholderData: (prev) => prev,
  });

  const startMut = useMutation({
    mutationFn: () => api.processLlmTitles(),
    onMutate: () => {
      setCompletedBanner(null);
      setIsProcessing(true);
    },
    onSettled: (data) => {
      setIsProcessing(false);
      if (data) {
        const suggested = data.results.filter(
          (r) => r.suggestedTitle && !r.error,
        ).length;
        const failed = data.results.filter((r) => r.error).length;
        setCompletedBanner({
          processed: data.processed,
          suggested,
          failed,
        });
      }
      qc.invalidateQueries({ queryKey: STATUS_KEY });
      qc.invalidateQueries({ queryKey: PENDING_KEY });
    },
  });

  const status: LlmTitleStatusResponse = statusQ.data ?? {
    total: 0,
    none: 0,
    eligible: 0,
    suggested: 0,
    confirmed: 0,
    rejected: 0,
    noApiKey: false,
  };

  const noApiKey = status.noApiKey;
  const startDisabled =
    noApiKey ||
    status.eligible === 0 ||
    isProcessing ||
    startMut.isPending;

  return (
    <div className="stack">
      <h1>AI Názvy — LLM extraction</h1>

      <p className="muted" style={{ marginTop: -4 }}>
        LLM (Gemini 2.5 Flash) navrhne názov dokumentu z OCR textu na štítku.
        Konzultant návrh review-uje a potvrdí, upraví alebo zamietne.
      </p>

      {statusQ.isLoading && <p className="muted">Načítavam štatistiky…</p>}
      {statusQ.error && (
        <p className="error">Chyba: {(statusQ.error as Error).message}</p>
      )}

      {/* Stats grid */}
      <section className="ocr-stats-grid" aria-label="LLM štatistiky">
        <StatCard variant="pending" label="Eligible" value={status.eligible} />
        <StatCard variant="pending" label="Suggested" value={status.suggested} />
        <StatCard variant="done" label="Confirmed" value={status.confirmed} />
        <StatCard variant="failed" label="Rejected" value={status.rejected} />
        <StatCard variant="total" label="Total items" value={status.total} />
        <StatCard
          variant={noApiKey ? "failed" : "done"}
          label="API Key"
          value={noApiKey ? "✗" : "✓"}
        />
      </section>

      {noApiKey && <ApiKeyHelpBanner />}

      {/* Action card */}
      <section className="card">
        <h2>Batch extraction</h2>

        {completedBanner && (
          <div className="ocr-banner-success" style={{ marginBottom: 12 }}>
            ✓ Hotovo — spracovaných {completedBanner.processed}{" "}
            {plural(completedBanner.processed, "položka", "položky", "položiek")}
            {", "}
            {completedBanner.suggested}{" "}
            {plural(
              completedBanner.suggested,
              "návrh",
              "návrhy",
              "návrhov",
            )}
            {completedBanner.failed > 0 && (
              <>
                {", "}
                <span style={{ color: "#b91c1c", fontWeight: 600 }}>
                  {completedBanner.failed}{" "}
                  {plural(
                    completedBanner.failed,
                    "chyba",
                    "chyby",
                    "chýb",
                  )}
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
                  : `Spustiť LLM extraction (${status.eligible})`}
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

      {/* Review queue */}
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
            {status.suggested === 0
              ? "Žiadne návrhy na review. Spusti LLM extraction vyššie."
              : "Žiadne ďalšie návrhy na tejto stránke."}
          </p>
        )}

        <div className="llm-review-list">
          {pendingQ.data?.items.map((item) => (
            <ReviewCard key={item.id} item={item} />
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

// ─── StatCard ────────────────────────────────────────────────────────────────

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

// ─── API Key help banner ─────────────────────────────────────────────────────

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
        LLM title extraction vyžaduje Google Gemini API key.
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

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ item }: { item: PendingReviewItem }) {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.ocrTitle ?? "");
  const editInputRef = useRef<HTMLInputElement>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["llm-title", "status"] });
    qc.invalidateQueries({ queryKey: ["llm-title", "pending"] });
    qc.invalidateQueries({ queryKey: ["items"] });
  }

  const confirmMut = useMutation({
    mutationFn: () => api.confirmLlmTitle(item.id),
    onSuccess: invalidate,
  });
  const rejectMut = useMutation({
    mutationFn: () => api.rejectLlmTitle(item.id),
    onSuccess: invalidate,
  });
  const editMut = useMutation({
    mutationFn: (title: string) => api.editLlmTitle(item.id, title),
    onSuccess: () => {
      setIsEditing(false);
      invalidate();
    },
  });

  const isPending = confirmMut.isPending || rejectMut.isPending || editMut.isPending;

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isEditing || isPending) return;
    if (e.key === "Enter") {
      e.preventDefault();
      confirmMut.mutate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      rejectMut.mutate();
    }
  }

  const breadcrumb =
    item.path.length > 0
      ? item.path
          .slice(0, -1)
          .map((n) => n.name ?? n.type_code)
          .join(" › ")
      : "";

  const error =
    confirmMut.error ?? rejectMut.error ?? editMut.error ?? null;

  return (
    <div
      className="llm-review-card"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Review návrhu pre položku ${item.name ?? item.id}`}
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

        <div className="llm-review-suggestion">
          <div className="llm-review-suggestion-label">Návrh AI:</div>
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = editValue.trim();
                if (v) editMut.mutate(v);
              }}
              className="llm-review-edit-form"
            >
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                maxLength={200}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Upraviť návrh"
                disabled={editMut.isPending}
              />
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editMut.isPending || editValue.trim().length === 0}
                  style={{ flex: 1, minHeight: 44 }}
                >
                  {editMut.isPending ? "Ukladám…" : "Uložiť"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(item.ocrTitle ?? "");
                  }}
                  disabled={editMut.isPending}
                  style={{ minHeight: 44 }}
                >
                  Zrušiť
                </button>
              </div>
            </form>
          ) : (
            <div className="llm-review-suggestion-text">
              {item.ocrTitle ?? "(prázdny návrh)"}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="llm-review-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => confirmMut.mutate()}
              disabled={isPending}
            >
              {confirmMut.isPending ? "Potvrdzujem…" : "✓ Potvrdiť"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
            >
              ✏️ Upraviť
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => rejectMut.mutate()}
              disabled={isPending}
            >
              {rejectMut.isPending ? "Zamietam…" : "✗ Zamietnuť"}
            </button>
          </div>
        )}

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

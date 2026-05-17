import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type FailedPhoto, type OcrStatusCounts } from "../api";

// OCRAdminPage — Sprint 3b
//
// Funkcionalita:
// - 2x2 grid štatistík (na desktop 1x4) so živými počtami PENDING/DONE/FAILED/TOTAL
// - Tlačidlo "Spracuj PENDING (N)" → POST /api/ocr/process-pending
// - Polling /api/ocr/status každé 3s počas spracovania (refetchInterval)
// - Po dokončení (pending → 0) zelený banner s počtom
// - Sekcia "Zlyhané fotky" (len ak failed > 0) — náhľad, item name, Retry tlačidlo

const STATUS_KEY = ["ocr-status"] as const;
const FAILED_KEY = ["ocr-failed"] as const;

export function OCRAdminPage() {
  const qc = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  // Počet ktorý sa naozaj queueol — používa sa pre banner po dokončení.
  const queuedRef = useRef<number>(0);
  // previousPending — drží predošlú hodnotu pending počtu medzi rendrami;
  // potrebujeme to aby sme rozoznali "klesol na 0" od "bol 0 už predtým".
  const previousPendingRef = useRef<number>(0);
  const [completedBanner, setCompletedBanner] = useState<number | null>(null);

  const statusQ = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => api.fetchOcrStatus(),
    refetchInterval: isProcessing ? 3000 : false,
    refetchOnMount: true,
  });

  const failedQ = useQuery({
    queryKey: FAILED_KEY,
    queryFn: () => api.fetchFailedPhotos(),
    enabled: (statusQ.data?.failed ?? 0) > 0,
  });

  const startMut = useMutation({
    mutationFn: () => api.processOcrPending(),
    onSuccess: (data) => {
      queuedRef.current = data.queuedCount;
      previousPendingRef.current = statusQ.data?.pending ?? data.queuedCount;
      setCompletedBanner(null);
      setIsProcessing(true);
    },
  });

  // Detect "pending dosiahol 0 počas spracovania" → ukáž banner, stop polling.
  useEffect(() => {
    if (!statusQ.data) return;
    const current = statusQ.data.pending;
    if (isProcessing && current === 0) {
      setIsProcessing(false);
      setCompletedBanner(queuedRef.current);
      // Refresh failed zoznamu (pribudli mohli FAILED) aj photo galérií inde.
      qc.invalidateQueries({ queryKey: FAILED_KEY });
      qc.invalidateQueries({ queryKey: ["items"] });
    }
    previousPendingRef.current = current;
  }, [statusQ.data, isProcessing, qc]);

  const retryMut = useMutation({
    mutationFn: (photoId: string) => api.retryOcr(photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STATUS_KEY });
      qc.invalidateQueries({ queryKey: FAILED_KEY });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const status: OcrStatusCounts = statusQ.data ?? {
    pending: 0,
    done: 0,
    failed: 0,
    total: 0,
  };

  return (
    <div className="stack">
      <h1>OCR Admin</h1>

      {statusQ.isLoading && <p className="muted">Načítavam štatistiky…</p>}
      {statusQ.error && (
        <p className="error">Chyba: {(statusQ.error as Error).message}</p>
      )}

      {/* Stats grid */}
      <section className="ocr-stats-grid" aria-label="OCR štatistiky">
        <StatCard variant="pending" label="Pending" value={status.pending} />
        <StatCard variant="done" label="Done" value={status.done} />
        <StatCard variant="failed" label="Failed" value={status.failed} />
        <StatCard variant="total" label="Total" value={status.total} />
      </section>

      {/* Action card */}
      <section className="card">
        <h2>Spracovanie</h2>

        {completedBanner !== null && completedBanner > 0 && (
          <div className="ocr-banner-success" style={{ marginBottom: 12 }}>
            ✓ Hotovo — spracovaných {completedBanner}{" "}
            {plural(completedBanner, "fotka", "fotky", "fotiek")}
          </div>
        )}

        <button
          type="button"
          className="btn-primary ocr-process-btn"
          disabled={
            status.pending === 0 || isProcessing || startMut.isPending
          }
          onClick={() => startMut.mutate()}
        >
          {isProcessing
            ? "Spracovávam…"
            : startMut.isPending
              ? "Spúšťam…"
              : status.pending === 0
                ? "Žiadne PENDING fotky"
                : `Spracuj PENDING (${status.pending})`}
        </button>

        {startMut.error && (
          <p className="error" style={{ marginTop: 8 }}>
            Chyba: {(startMut.error as Error).message}
          </p>
        )}

        {isProcessing && (
          <p className="muted" style={{ marginTop: 8 }}>
            OCR beží na pozadí. Štatistiky sa aktualizujú každé 3 sekundy.
          </p>
        )}
      </section>

      {/* Failed photos */}
      {status.failed > 0 && (
        <section className="card">
          <h2>Zlyhané fotky ({status.failed})</h2>

          {failedQ.isLoading && <p className="muted">Načítavam…</p>}
          {failedQ.error && (
            <p className="error">
              Chyba: {(failedQ.error as Error).message}
            </p>
          )}

          {failedQ.data && failedQ.data.length === 0 && (
            <p className="muted">Žiadne zlyhané fotky.</p>
          )}

          {failedQ.data?.map((p) => (
            <FailedRow
              key={p.id}
              photo={p}
              retrying={retryMut.isPending && retryMut.variables === p.id}
              onRetry={() => retryMut.mutate(p.id)}
            />
          ))}

          {failedQ.data && failedQ.data.length >= 100 && (
            <p className="muted" style={{ marginTop: 8 }}>
              Zobrazených prvých 100 záznamov.
            </p>
          )}

          {retryMut.error && (
            <p className="error" style={{ marginTop: 8 }}>
              Retry chyba: {(retryMut.error as Error).message}
            </p>
          )}
        </section>
      )}
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
  value: number;
}) {
  return (
    <div className={`ocr-stat-card ocr-stat-${variant}`}>
      <div className="ocr-stat-number">{value}</div>
      <div className="ocr-stat-label">{label}</div>
    </div>
  );
}

// ─── FailedRow ───────────────────────────────────────────────────────────────

function FailedRow({
  photo,
  retrying,
  onRetry,
}: {
  photo: FailedPhoto;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="ocr-failed-row">
      <img
        src={photo.signed_url}
        alt=""
        className="ocr-failed-thumb"
        loading="lazy"
      />
      <div className="ocr-failed-meta">
        <Link to={`/items/${photo.item_id}`} className="ocr-failed-name">
          {photo.item_name ?? "(bez názvu)"}
        </Link>
        <span className="ocr-failed-date">
          {new Date(photo.created_at).toLocaleString("sk-SK")}
        </span>
      </div>
      <button
        type="button"
        className="btn-small"
        onClick={onRetry}
        disabled={retrying}
        style={{ minHeight: 44 }}
      >
        {retrying ? "Spracovávam…" : "Retry"}
      </button>
    </div>
  );
}

// Jednoduchá slovenská pluralizácia (1 / 2-4 / 5+).
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

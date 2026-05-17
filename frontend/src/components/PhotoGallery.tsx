import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Photo } from "../api";

type Props = {
  itemId: string;
};

export function PhotoGallery({ itemId }: Props): React.JSX.Element {
  const qc = useQueryClient();
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const photosQ = useQuery({
    queryKey: ["items", itemId, "photos"],
    queryFn: () => api.listPhotos(itemId),
    enabled: !!itemId,
  });

  const deleteMut = useMutation({
    mutationFn: (photoId: string) => api.deletePhoto(photoId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["items", itemId, "photos"] });
    },
  });

  // Retry je tu (nie v každom Tile) lebo `variables` na mutation drží len posledné
  // volanie — pre per-row disabled stačí porovnať s photo.id.
  const retryMut = useMutation({
    mutationFn: (photoId: string) => api.retryOcr(photoId),
    onSuccess: async () => {
      // Invaliduje aj OCR-admin status/failed cache ak je otvorený inde.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["items", itemId, "photos"] }),
        qc.invalidateQueries({ queryKey: ["ocr-status"] }),
        qc.invalidateQueries({ queryKey: ["ocr-failed"] }),
      ]);
    },
  });

  function onDelete(photoId: string): void {
    if (confirm("Naozaj zmazať fotku? Pôjde do koša (R2 sa zachová pre orphan cleanup).")) {
      deleteMut.mutate(photoId);
    }
  }

  if (photosQ.isLoading) {
    return <p className="muted">Načítavam fotky…</p>;
  }
  if (photosQ.error) {
    return <p className="error">Chyba: {(photosQ.error as Error).message}</p>;
  }
  const photos = photosQ.data ?? [];
  if (photos.length === 0) {
    return <p className="muted">Žiadne fotky. Pridaj prvú tlačidlom hore.</p>;
  }

  return (
    <>
      <div className="photo-grid">
        {photos.map((p) => (
          <PhotoTile
            key={p.id}
            photo={p}
            onOpen={() => setLightboxPhoto(p)}
            onDelete={() => onDelete(p.id)}
            deleting={deleteMut.isPending}
            onRetryOcr={() => retryMut.mutate(p.id)}
            retrying={retryMut.isPending && retryMut.variables === p.id}
          />
        ))}
      </div>

      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}
    </>
  );
}

// ─── PhotoTile ────────────────────────────────────────────────────────────────

function PhotoTile({
  photo,
  onOpen,
  onDelete,
  deleting,
  onRetryOcr,
  retrying,
}: {
  photo: Photo;
  onOpen: () => void;
  onDelete: () => void;
  deleting: boolean;
  onRetryOcr: () => void;
  retrying: boolean;
}): React.JSX.Element {
  const [ocrOpen, setOcrOpen] = useState(false);

  // OCR text considered "present" len keď je DONE a non-empty po trime.
  const hasOcrText =
    photo.ocr_status === "DONE" &&
    photo.ocr_raw_text !== null &&
    photo.ocr_raw_text.trim().length > 0;
  const isDoneEmpty =
    photo.ocr_status === "DONE" &&
    (photo.ocr_raw_text === null || photo.ocr_raw_text.trim().length === 0);

  return (
    <div className="photo-tile">
      <button
        type="button"
        className="photo-tile-img-btn"
        onClick={onOpen}
        aria-label="Otvoriť fotku vo veľkom"
      >
        <img src={photo.signed_url} alt="" className="photo-tile-img" loading="lazy" />
      </button>

      <div className="photo-tile-meta">
        {photo.ocr_status === "PENDING" && (
          <span className="photo-badge-pending">Čaká na OCR</span>
        )}
        {isDoneEmpty && (
          <span className="photo-badge-done-empty">Spracované (bez textu)</span>
        )}
        {photo.ocr_status === "FAILED" && (
          <span className="photo-badge-failed">OCR zlyhalo</span>
        )}
        <button
          type="button"
          className="btn-danger btn-small"
          onClick={onDelete}
          disabled={deleting}
        >
          Zmazať
        </button>
      </div>

      {/* DONE + non-empty text → collapsible. Default zbalené pre šetrenie miesta. */}
      {hasOcrText && (
        <div>
          <button
            type="button"
            className="ocr-text-toggle"
            onClick={() => setOcrOpen((v) => !v)}
            aria-expanded={ocrOpen}
          >
            <span>OCR text</span>
            <span aria-hidden="true">{ocrOpen ? "▲" : "▼"}</span>
          </button>
          {ocrOpen && (
            <pre className="ocr-text-body">{photo.ocr_raw_text}</pre>
          )}
        </div>
      )}

      {/* FAILED → tlačidlo na opakovanie. */}
      {photo.ocr_status === "FAILED" && (
        <button
          type="button"
          className="btn-small"
          onClick={onRetryOcr}
          disabled={retrying}
          style={{ minHeight: 44, width: "100%" }}
        >
          {retrying ? "Spracovávam…" : "Skúsiť znova"}
        </button>
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  photo,
  onClose,
}: {
  photo: Photo;
  onClose: () => void;
}): React.JSX.Element {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Zavrieť"
      >
        ✕
      </button>
      <img
        src={photo.signed_url}
        alt=""
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

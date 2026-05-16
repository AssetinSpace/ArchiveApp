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
          <div key={p.id} className="photo-tile">
            <button
              type="button"
              className="photo-tile-img-btn"
              onClick={() => setLightboxPhoto(p)}
              aria-label="Otvoriť fotku vo veľkom"
            >
              <img src={p.signed_url} alt="" className="photo-tile-img" loading="lazy" />
            </button>
            <div className="photo-tile-meta">
              {p.ocr_status === "PENDING" && (
                <span className="photo-badge-pending">Čaká na OCR</span>
              )}
              <button
                type="button"
                className="btn-danger btn-small"
                onClick={() => onDelete(p.id)}
                disabled={deleteMut.isPending}
              >
                Zmazať
              </button>
            </div>
          </div>
        ))}
      </div>

      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}
    </>
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
  // Escape klávesa = zatvoriť. Listener pridáme len kým je lightbox otvorený.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // Zabráň body scrollu pod overlayom — najmä na iOS.
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
        // Klik na samotný obrázok NEZATVORÍ (aby používateľ mohol napr. zoomnúť).
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

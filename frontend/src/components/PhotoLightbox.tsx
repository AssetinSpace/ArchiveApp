import { useEffect, useState } from "react";
import { api } from "../api";
import { openPhotoBeside } from "../lib/openPhotoBeside";

type LightboxPhoto = {
  id?: string;
  signed_url: string;
};

type Props = {
  photo: LightboxPhoto;
  onClose: () => void;
  /** Napr. „2 / 5“ pri viacerých fotkách v galérii. */
  caption?: string;
  onPrev?: () => void;
  onNext?: () => void;
  /** Tlačidlo „Otvoriť vedľa“ — default zapnuté ak je signed_url. */
  showOpenBeside?: boolean;
};

export function PhotoLightbox({
  photo,
  onClose,
  caption,
  onPrev,
  onNext,
  showOpenBeside = true,
}: Props): React.JSX.Element {
  const [displayUrl, setDisplayUrl] = useState(photo.signed_url);

  useEffect(() => {
    setDisplayUrl(photo.signed_url);
    if (!photo.id) return;
    let cancelled = false;
    void api.getPhoto(photo.id).then((fresh) => {
      if (!cancelled) setDisplayUrl(fresh.signed_url);
    });
    return () => {
      cancelled = true;
    };
  }, [photo.id, photo.signed_url]);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

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
      {caption ? <p className="lightbox-caption">{caption}</p> : null}
      {onPrev ? (
        <button
          type="button"
          className="lightbox-nav lightbox-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Predchádzajúca fotka"
        >
          ‹
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          className="lightbox-nav lightbox-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Ďalšia fotka"
        >
          ›
        </button>
      ) : null}
      <img
        src={displayUrl}
        alt=""
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
      {showOpenBeside ? (
        <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="lightbox-action-btn"
            onClick={() => openPhotoBeside(displayUrl)}
          >
            Otvoriť vedľa
          </button>
        </div>
      ) : null}
    </div>
  );
}

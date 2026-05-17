import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api, type PhotoType } from "../api";

// Kompresia nad 2 MB — väčšina fotiek štítkov z telefónu má 3–6 MB, downscale na
// 2400 px (krátka strana) vystačí na čítanie OCR a šetrí R2 traffic + bandwidth.
const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024;
const COMPRESS_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
};

type Props = {
  itemId: string;
};

// Sprint 6: dve oddelené upload akcie — LABEL (fotka štítku → OCR pipeline)
// vs OVERVIEW (vizuálna referencia ako vyzerá krabica/paleta, OCR sa preskočí).
// Každé tlačidlo má vlastný skrytý <input> aby `accept`/`capture` ostali
// nezávislé a šlo budúcne odlišovať napr. zdroj kamery; medzitým zdieľajú
// rovnakú mutáciu cez `photoType` argument.
export function PhotoUpload({ itemId }: Props): React.JSX.Element {
  const qc = useQueryClient();
  const labelInputRef = useRef<HTMLInputElement>(null);
  const overviewInputRef = useRef<HTMLInputElement>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Drží typ ktorý práve uploadujeme — používame ho na disabled stav druhého
  // tlačidla a na zobrazenie správneho busy textu.
  const [activeType, setActiveType] = useState<PhotoType | null>(null);

  const uploadMut = useMutation({
    mutationFn: async ({ file, photoType }: { file: File; photoType: PhotoType }) => {
      let payload: File = file;
      if (file.size > COMPRESS_THRESHOLD_BYTES) {
        setBusyLabel("Komprimujem fotku…");
        const compressed = await imageCompression(file, COMPRESS_OPTIONS);
        // browser-image-compression vracia Blob na niektorých build targetoch;
        // pretypujeme na File aby multer videl pôvodné meno/MIME.
        payload =
          compressed instanceof File
            ? compressed
            : new File([compressed], file.name, { type: file.type });
      }
      setBusyLabel("Nahrávam na server…");
      return api.uploadPhoto(itemId, payload, photoType);
    },
    onSuccess: async () => {
      setError(null);
      setBusyLabel(null);
      setActiveType(null);
      // Invalidácia musí matchnúť presne queryKey z PhotoGallery — bez tohto by
      // sa nová fotka nezobrazila kým používateľ nerefreshne. OCR status sa
      // tiež zmenil (LABEL → nové PENDING, OVERVIEW → nové DONE), invalidate
      // aj ocr-status aby OCR Admin pollol čerstvý počet.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["items", itemId, "photos"] }),
        qc.invalidateQueries({ queryKey: ["ocr-status"] }),
      ]);
      if (labelInputRef.current) labelInputRef.current.value = "";
      if (overviewInputRef.current) overviewInputRef.current.value = "";
    },
    onError: (e: Error) => {
      setError(e.message);
      setBusyLabel(null);
      setActiveType(null);
      if (labelInputRef.current) labelInputRef.current.value = "";
      if (overviewInputRef.current) overviewInputRef.current.value = "";
    },
  });

  function makeOnFileChosen(photoType: PhotoType) {
    return (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setActiveType(photoType);
      uploadMut.mutate({ file, photoType });
    };
  }

  const busy = uploadMut.isPending;
  const labelId = `photo-upload-label-${itemId}`;
  const overviewId = `photo-upload-overview-${itemId}`;

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="photo-upload-buttons">
        <input
          ref={labelInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={makeOnFileChosen("LABEL")}
          disabled={busy}
          style={{ display: "none" }}
          id={labelId}
        />
        <label
          htmlFor={labelId}
          className={`photo-upload-btn photo-upload-btn-label ${busy ? "is-disabled" : ""}`}
          aria-disabled={busy}
        >
          {busy && activeType === "LABEL" ? (
            <span className="photo-upload-btn-busy">{busyLabel ?? "Pracujem…"}</span>
          ) : (
            <>
              <span className="photo-upload-btn-icon" aria-hidden="true">📄</span>
              <span className="photo-upload-btn-title">Odfotiť štítok</span>
              <span className="photo-upload-btn-hint">Pôjde do OCR</span>
            </>
          )}
        </label>

        <input
          ref={overviewInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={makeOnFileChosen("OVERVIEW")}
          disabled={busy}
          style={{ display: "none" }}
          id={overviewId}
        />
        <label
          htmlFor={overviewId}
          className={`photo-upload-btn photo-upload-btn-overview ${busy ? "is-disabled" : ""}`}
          aria-disabled={busy}
        >
          {busy && activeType === "OVERVIEW" ? (
            <span className="photo-upload-btn-busy">{busyLabel ?? "Pracujem…"}</span>
          ) : (
            <>
              <span className="photo-upload-btn-icon" aria-hidden="true">📦</span>
              <span className="photo-upload-btn-title">Odfotiť položku</span>
              <span className="photo-upload-btn-hint">Iba ako referencia</span>
            </>
          )}
        </label>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

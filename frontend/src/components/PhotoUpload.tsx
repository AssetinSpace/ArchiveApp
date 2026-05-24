import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api, type PhotoType, type QrAssignmentResult } from "../api";
import { WebcamCaptureModal } from "./WebcamCaptureModal";
import { isMobileDevice } from "../utils/device";

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

type UploadSource = "camera" | "gallery";

type UploadSlot = {
  key: string;
  photoType: PhotoType;
  source: UploadSource;
  icon: string;
  title: string;
  hint: string;
  btnClass: string;
};

// Sprint 6: LABEL (štítok → OCR) vs OVERVIEW (referencia, OCR sa preskočí).
// Na mobile `capture="environment"` otvorí kameru; input bez capture ponúkne galériu.
const UPLOAD_SLOTS: UploadSlot[] = [
  {
    key: "label-camera",
    photoType: "LABEL",
    source: "camera",
    icon: "📄",
    title: "Odfotiť štítok",
    hint: "Pôjde do OCR",
    btnClass: "photo-upload-btn-label",
  },
  {
    key: "label-gallery",
    photoType: "LABEL",
    source: "gallery",
    icon: "🖼️",
    title: "Štítok z galérie",
    hint: "Pôjde do OCR",
    btnClass: "photo-upload-btn-label photo-upload-btn-gallery",
  },
  {
    key: "overview-camera",
    photoType: "OVERVIEW",
    source: "camera",
    icon: "📦",
    title: "Odfotiť položku",
    hint: "Iba ako referencia",
    btnClass: "photo-upload-btn-overview",
  },
  {
    key: "overview-gallery",
    photoType: "OVERVIEW",
    source: "gallery",
    icon: "🖼️",
    title: "Položka z galérie",
    hint: "Iba ako referencia",
    btnClass: "photo-upload-btn-overview photo-upload-btn-gallery",
  },
];

// ─── QrDetectionBanner ───────────────────────────────────────────────────────

function QrDetectionBanner({
  result,
  itemId,
  onDismiss,
}: {
  result: QrAssignmentResult;
  itemId: string;
  onDismiss: () => void;
}): React.JSX.Element | null {
  if (result.status === "ITEM_HAS_QR") return null;

  const scanLink = (
    <Link to={`/scan?assignTo=${itemId}`} style={{ marginLeft: 8 }}>
      Naskenovať ručne
    </Link>
  );

  let cls = "success";
  let content: React.ReactNode;

  switch (result.status) {
    case "ASSIGNED":
      cls = "success";
      content = `QR ${result.qrCode} rozpoznaný a priradený`;
      break;
    case "NO_QR_DETECTED":
      cls = "warning";
      content = <>QR kód nenájdený vo fotke{scanLink}</>;
      break;
    case "NOT_FOUND":
      cls = "warning";
      content = (
        <>
          QR {result.qrCode} neexistuje v systéme — skontroluj nálepku{scanLink}
        </>
      );
      break;
    case "ALREADY_ASSIGNED":
      cls = "warning";
      content = (
        <>
          QR {result.qrCode} už patrí{" "}
          <Link to={`/items/${result.assignedToItemId}`}>inej položke</Link>
          {scanLink}
        </>
      );
      break;
  }

  return (
    <div className={cls} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span>{content}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Zavrieť"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

// ─── PhotoUpload ─────────────────────────────────────────────────────────────

export function PhotoUpload({ itemId }: Props): React.JSX.Element {
  const qc = useQueryClient();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<PhotoType | null>(null);
  const [webcamSlot, setWebcamSlot] = useState<{ photoType: PhotoType; title: string } | null>(null);
  const [qrBanner, setQrBanner] = useState<QrAssignmentResult | null>(null);

  // Auto-dismiss the ASSIGNED banner after 3 s.
  useEffect(() => {
    if (qrBanner?.status !== "ASSIGNED") return;
    const t = setTimeout(() => setQrBanner(null), 3000);
    return () => clearTimeout(t);
  }, [qrBanner]);

  const uploadMut = useMutation({
    mutationFn: async ({ file, photoType }: { file: File; photoType: PhotoType }) => {
      let payload: File = file;
      if (file.size > COMPRESS_THRESHOLD_BYTES) {
        setBusyLabel("Komprimujem fotku…");
        const compressed = await imageCompression(file, COMPRESS_OPTIONS);
        payload =
          compressed instanceof File
            ? compressed
            : new File([compressed], file.name, { type: file.type });
      }
      setBusyLabel("Nahrávam na server…");
      return api.uploadPhoto(itemId, payload, photoType);
    },
    onSuccess: async (data) => {
      setError(null);
      setBusyLabel(null);
      setActiveType(null);

      const invalidations: Promise<void>[] = [
        qc.invalidateQueries({ queryKey: ["items", itemId, "photos"] }),
        qc.invalidateQueries({ queryKey: ["items", "inventory"] }),
        qc.invalidateQueries({ queryKey: ["ocr-status"] }),
      ];

      if (data.qrDetection && data.qrDetection.status !== "ITEM_HAS_QR") {
        setQrBanner(data.qrDetection);
        if (data.qrDetection.status === "ASSIGNED") {
          // Refresh item so qr_code field appears in the detail immediately.
          invalidations.push(
            qc.invalidateQueries({ queryKey: ["items", itemId] }),
          );
        }
      }

      await Promise.all(invalidations);
      for (const slot of UPLOAD_SLOTS) {
        const el = inputRefs.current[slot.key];
        if (el) el.value = "";
      }
    },
    onError: (e: Error) => {
      setError(e.message);
      setBusyLabel(null);
      setActiveType(null);
      for (const slot of UPLOAD_SLOTS) {
        const el = inputRefs.current[slot.key];
        if (el) el.value = "";
      }
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

  function handleWebcamCapture(blob: Blob): void {
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    const photoType = webcamSlot!.photoType;
    setError(null);
    setActiveType(photoType);
    uploadMut.mutate({ file, photoType });
  }

  const busy = uploadMut.isPending;

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="photo-upload-buttons">
        {UPLOAD_SLOTS.map((slot) => {
          const inputId = `photo-upload-${slot.key}-${itemId}`;
          const isActive = busy && activeType === slot.photoType;
          const btnContent = isActive ? (
            <span className="photo-upload-btn-busy">{busyLabel ?? "Pracujem…"}</span>
          ) : (
            <>
              <span className="photo-upload-btn-icon" aria-hidden="true">
                {slot.icon}
              </span>
              <span className="photo-upload-btn-title">{slot.title}</span>
              <span className="photo-upload-btn-hint">{slot.hint}</span>
            </>
          );

          return (
            <div key={slot.key}>
              <input
                ref={(el) => {
                  inputRefs.current[slot.key] = el;
                }}
                type="file"
                accept="image/*"
                {...(slot.source === "camera" ? { capture: "environment" } : {})}
                onChange={makeOnFileChosen(slot.photoType)}
                disabled={busy}
                style={{ display: "none" }}
                id={inputId}
              />
              {slot.source === "camera" ? (
                <button
                  type="button"
                  disabled={busy}
                  className={`photo-upload-btn ${slot.btnClass} ${busy ? "is-disabled" : ""}`}
                  onClick={() => {
                    if (isMobileDevice()) {
                      inputRefs.current[slot.key]?.click();
                    } else {
                      setWebcamSlot({ photoType: slot.photoType, title: slot.title });
                    }
                  }}
                >
                  {btnContent}
                </button>
              ) : (
                <label
                  htmlFor={inputId}
                  className={`photo-upload-btn ${slot.btnClass} ${busy ? "is-disabled" : ""}`}
                  aria-disabled={busy}
                >
                  {btnContent}
                </label>
              )}
            </div>
          );
        })}
      </div>
      {error && <div className="error">{error}</div>}
      {qrBanner && <QrDetectionBanner result={qrBanner} itemId={itemId} onDismiss={() => setQrBanner(null)} />}
      <WebcamCaptureModal
        isOpen={webcamSlot !== null}
        onClose={() => setWebcamSlot(null)}
        onCapture={handleWebcamCapture}
        title={webcamSlot?.title}
      />
    </div>
  );
}
